import { makerOf } from "./makerOf";

export interface Subscription {
  dispose: () => void;
}

type listener = (message) => void;

export class Bus {
  private listeners = new Map<makerOf<any>, listener[]>();

  public subscribe<T>(type: makerOf<T>, cb: (message: T) => void): Subscription {
    let listeners = this.listeners.get(type);
    if (listeners == null) {
      listeners = [];
      this.listeners.set(type, listeners);
    }

    listeners.push(cb);

    return {
      dispose: () => {
        let listeners = this.listeners.get(type);

        if (listeners == null) return;
        const idx = listeners.indexOf(cb);
        if (idx > -1) {
          listeners.splice(idx, 1);
        }
      },
    }
  }

  public publish<T>(message: T) {
    let listeners = this.listeners.get(message.constructor as any);

    if (listeners != null) {
      listeners.forEach(l => l(message));
    }
  }
}
