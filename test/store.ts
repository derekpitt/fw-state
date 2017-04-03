import { assert } from "chai";

import { dispatch, handle, Store, setupStores, ContainerGetter } from "../src/store";
import { makerOf } from "../src/makerOf";


export class Container {
  protected instances = new Map();

  private getServiceTypes<T>(t: makerOf<T>): makerOf<T>[] {
    return (<any>Reflect).getMetadata("design:paramtypes", t) || [];
  }

  public get<T>(t: makerOf<T>, setInstance = true): T {
    if (this.instances.get(t))
      return this.instances.get(t) as T;

    const injectedTypes = this.getServiceTypes(t).map(tt => {
      return this.get(tt);
    });

    const instance = new (Function.prototype.bind.apply(t, [null, ...injectedTypes]));

    if (setInstance)
      this.use(t, instance);

    return instance;
  }

  protected has(t: makerOf<any>): boolean {
    return this.instances.get(t) != null;
  }

  public use<T>(key: makerOf<T>, instance: T) {
    this.instances.set(key, instance);
  }
}

const wait = (n: number) => new Promise((res) => setTimeout(res, n));

class TestAction {
  constructor(public hi: string) { }
}

class AnotherTestAction {
  constructor(public hi: string) { }
}

class AnotherTestHandlerWrapper {
  public called = false;

  async handle(method: () => Promise<void>, arg) {
    this.called = true;
    await method();
  }
}

class TestStore extends Store<{ hi: string }> {
  defaultState() {
    return { hi: "" };
  }

  @handle(TestAction)
  private async handleTestAction(t: TestAction) {
    await wait(5);
    this.setState(state => ({ ...state, hi: t.hi }));
  }

  @handle(AnotherTestAction, AnotherTestHandlerWrapper)
  private async handleAnotherTestAction(t: AnotherTestAction) {
    await wait(5);
    this.setState(state => ({ hi: t.hi }));
  }
}

describe("store", () => {
  let containerInstance: Container = null;

  beforeEach(() => {
    containerInstance = new Container();

    setupStores(containerInstance, TestStore);
  });

  describe("handlers", () => {
    it("should handle", async () => {
      const testStore = containerInstance.get(TestStore);

      await dispatch(new TestAction("pow"));
      assert(testStore.state.hi == "pow");
    });
  });

  describe("handler wrappers", () => {
    it("should call the wrapper and then set the state", async () => {
      const testStore = containerInstance.get(TestStore);
      const anotherTestHandlerWrapper = containerInstance.get(AnotherTestHandlerWrapper);
      await dispatch(new AnotherTestAction("whammy"));

      assert(anotherTestHandlerWrapper.called == true, "wrapper wasn't called");
      assert(testStore.state.hi == "whammy", "state not set");
    });
  });

  describe("onStateChanged", () => {
    it("should call when state changed", async () => {
      let called: boolean = false;
      const testStore = containerInstance.get(TestStore);

      testStore.onStateChanged(() => {
        called = true;
      });

      await dispatch(new TestAction("powow"));

      assert(called);
    });

    it("should unsubscribe", async () => {
      let called = 0;
      const testStore = containerInstance.get(TestStore);

      const unsub = testStore.onStateChanged(() => {
        called += 1;
      });

      await dispatch(new TestAction("powow"));
      unsub.dispose();
      await dispatch(new TestAction("powow"));

      assert(called == 1);
    });
  });
});

