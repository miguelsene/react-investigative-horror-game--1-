import { useSyncExternalStore } from 'react';

type Setter<T> = (partial: Partial<T> | T | ((state: T) => Partial<T> | T), replace?: boolean) => void;
type Creator<T> = (set: Setter<T>, get: () => T) => T;
type PersistOptions<T> = {
  name: string;
  version?: number;
  partialize?: (state: T) => unknown;
  migrate?: (state: unknown, version: number) => unknown;
};
type PersistedCreator<T> = Creator<T> & { persistOptions?: PersistOptions<T> };

export function persist<T>(creator: Creator<T>, options: PersistOptions<T>): PersistedCreator<T> {
  return Object.assign(creator, { persistOptions: options });
}

interface StoreHook<T> {
  <U = T>(selector?: (state: T) => U): U;
  getState: () => T;
  setState: Setter<T>;
  subscribe: (listener: () => void) => () => void;
}

export function create<T>() {
  return (creator: PersistedCreator<T> | Creator<T>): StoreHook<T> => {
    let state: T;
    const listeners = new Set<() => void>();
    const options = (creator as PersistedCreator<T>).persistOptions;
    const persistState = () => {
      if (!options || typeof localStorage === 'undefined') return;
      try {
        const saved = options.partialize ? options.partialize(state) : state;
        localStorage.setItem(options.name, JSON.stringify({ state: saved, version: options.version ?? 0 }));
      } catch { /* Storage may be unavailable in private or embedded contexts. */ }
    };
    const setState: Setter<T> = (next, replace) => {
      const value = typeof next === 'function' ? (next as (s: T) => Partial<T> | T)(state) : next;
      state = replace ? value as T : { ...state, ...value };
      persistState();
      listeners.forEach((listener) => listener());
    };
    const getState = () => state;
    state = creator(setState, getState);

    if (options && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(options.name);
        if (raw) {
          const envelope = JSON.parse(raw) as { state?: unknown; version?: number };
          const restored = options.migrate ? options.migrate(envelope.state, envelope.version ?? 0) : envelope.state;
          if (restored && typeof restored === 'object') state = { ...state, ...restored };
        }
      } catch { /* Ignore malformed or inaccessible saved state. */ }
    }

    const hook = (<U = T>(selector: (value: T) => U = ((value) => value as unknown as U)) =>
      useSyncExternalStore((notify) => {
        listeners.add(notify);
        return () => listeners.delete(notify);
      }, () => selector(state), () => selector(state))) as StoreHook<T>;
    hook.getState = getState;
    hook.setState = setState;
    hook.subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
    return hook;
  };
}
