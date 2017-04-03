import { Subscription, Bus } from "./bus";
import { makerOf } from "./makerOf";


export interface HandlerWrapper {
  // you can call method with no params, so you don't have to worry about passing the right arguments to the real handlerer
  handle(method: () => Promise<void> | void, headArgument: any, ...tailArguments): Promise<void> | void;
}

const handlers = new Map();

export function handle(fn, wrapper?: makerOf<HandlerWrapper>) {
  return function(target, method) {
    handlers.set(fn, handlers.get(fn) || []);
    handlers.set(fn, handlers.get(fn).concat([{target, method, wrapper}]));
  }
}

const waitForGraph = new Map();

export function waitFor(storeToWaitOn) {
  return function(waiter) {
    waitForGraph.set(waiter, storeToWaitOn);
  }
}

function groupByAsMap<T>(things: T[], on: (T) => any): Map<any, T[]> {
  const map = new Map<any, T[]>();

  things.forEach((thing) => {
    const result = on(thing);
    map.set(result, map.get(result) || []);
    map.set(result, map.get(result).concat([thing]));
  });

  return map;
}

export interface ContainerGetter {
  get<T>(ctor: makerOf<T>): T;
}

let container: ContainerGetter = null;

export function setupStores(getter: ContainerGetter, ...stores: makerOf<Store<any>>[]) {
  container = getter;
  stores.forEach(s => getter.get(s));
}

async function dispatchOnStore(event, handlers: { method: string, wrapper: makerOf<HandlerWrapper> }[], target, dispatchRuns: Map<any, boolean>) {
  // if we have already run, GET OUTA HERE
  if (dispatchRuns.get(target.constructor)) return;

  const wait = waitForGraph.get(target.constructor);
  if (wait && dispatchRuns.get(wait) == null) {
    await performDispatch(event, wait, dispatchRuns);
  }

  const promises = [];

  // todo, cache these
  const instance = container.get(target.constructor);

  for (let hi = 0; hi < handlers.length; hi++) {
    let result;

    if (handlers[hi].wrapper) {
      const callHandler = () => {
        return instance[handlers[hi].method].apply(instance, [event]);
      };

      const wrapperInstance = container.get<HandlerWrapper>(handlers[hi].wrapper);

      result = wrapperInstance.handle.apply(wrapperInstance, [callHandler, event]);
    } else {
      result = instance[handlers[hi].method].apply(instance, [event])
    }

    if (result instanceof Promise) {
      promises.push(result);
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  dispatchRuns.set(target.constructor, true);
}

async function performDispatch(event, onlyTarget = null, dispatchRuns: Map<any, boolean> = new Map<any, boolean>()) {
  const eventHandlers = handlers.get(event.constructor);
  if (eventHandlers == null) return;
  let groupedHandlers = groupByAsMap(eventHandlers, eh => eh.target);

  if (onlyTarget) {
    if (groupedHandlers.get(onlyTarget)) {
      let onlyTargetGroup = groupedHandlers.get(onlyTarget);
      groupedHandlers = new Map();
      groupedHandlers.set(onlyTarget, onlyTargetGroup);
    } else {
      // welp, nothing to handle here.. move along
      return;
    }
  }

  for (let [target, handlers] of groupedHandlers) {
    await dispatchOnStore(event, <any>handlers, target, dispatchRuns);
  }
}

export function dispatch(event) {
  if (handlers.has(event.constructor)) {
    return performDispatch(event);
  }
}


class StoreStateChanged { }

export abstract class Store<T> {
  public state: T;
  private stateSet = false;
  private waiters: Function[] = [];
  private localBus = new Bus();

  constructor() {
    this.state = this.defaultState();
  }

  protected abstract defaultState(): T;

  protected setState(newStateFn: (currentState: T) => T) {
    const newState = newStateFn(this.state);
    Object.assign(this.state, newState);

    this.localBus.publish(new StoreStateChanged());

    if (!this.stateSet) {
      this.stateSet = true;
      this.waiters.forEach(w => w());
      this.waiters = [];
    }
  }

  // this will return a promise that waits for the
  // first time setState is called (so when something other than the defaultState
  // is called
  public wait() {
    if (this.stateSet) return Promise.resolve();

    return new Promise<void>((res) => {
      this.waiters.push(res);
    });
  }

  public onStateChanged(cb: () => void): Subscription {
    return this.localBus.subscribe(StoreStateChanged, cb);
  }
}
