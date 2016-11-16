declare module 'fw-state/makerOf' {
	export interface makerOf<T> {
	    new (...args: any[]): T;
	}

}
declare module 'fw-state/bus' {
	import { makerOf } from 'fw-state/makerOf';
	export interface Subscription {
	    dispose: () => void;
	}
	export class Bus {
	    private listeners;
	    subscribe<T>(type: makerOf<T>, cb: (message: T) => void): Subscription;
	    publish<T>(message: T): void;
	}

}
declare module 'fw-state/store' {
	import { Subscription } from 'fw-state/bus';
	import { makerOf } from 'fw-state/makerOf';
	export interface HandlerWrapper {
	    handle(method: () => Promise<void> | void, headArgument: any, ...tailArguments: any[]): Promise<void> | void;
	}
	export function handle(fn: any, wrapper?: makerOf<HandlerWrapper>): (target: any, method: any) => void;
	export function waitFor(storeToWaitOn: any): (waiter: any) => void;
	export interface ContainerGetter {
	    get<T>(ctor: makerOf<T>): T;
	}
	export function setupStores(getter: ContainerGetter, ...stores: makerOf<Store<any>>[]): void;
	export function dispatch(event: any): Promise<void>;
	export abstract class Store<T> {
	    state: T;
	    private stateSet;
	    private waiters;
	    private localBus;
	    constructor();
	    protected abstract defaultState(): T;
	    protected setState(newState: any): void;
	    wait(): Promise<void>;
	    onStateChanged(cb: () => void): Subscription;
	}

}
declare module 'fw-state' {
	export * from 'fw-state/store';
	export * from 'fw-state/makerOf';
	export { Subscription } from 'fw-state/bus';

}
