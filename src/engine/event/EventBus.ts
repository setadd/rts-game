type Listener<TPayload> = (payload: TPayload) => void

/**
 * Small typed pub/sub utility for decoupling engine systems and UI adapters.
 *
 * The bus is intentionally synchronous: event handlers run during the same
 * simulation step that emits the event, which makes tests and debugging easier.
 * Long-running work should be triggered outside the core simulation loop.
 */
export class EventBus<TEvents extends object> {
  private readonly listeners = new Map<keyof TEvents, Set<Listener<TEvents[keyof TEvents]>>>()

  /**
   * Subscribes to an event and returns an unsubscribe function. Callers should
   * keep that function and invoke it when a scene, UI panel, or system is torn down.
   */
  on<TKey extends keyof TEvents>(eventName: TKey, listener: Listener<TEvents[TKey]>): () => void {
    const listeners = this.listeners.get(eventName) ?? new Set<Listener<TEvents[keyof TEvents]>>()
    listeners.add(listener as Listener<TEvents[keyof TEvents]>)
    this.listeners.set(eventName, listeners)

    return () => {
      listeners.delete(listener as Listener<TEvents[keyof TEvents]>)
      if (listeners.size === 0) {
        this.listeners.delete(eventName)
      }
    }
  }

  /**
   * Dispatches a typed payload to current listeners. The listener array is copied
   * so a listener can safely unsubscribe itself while an event is being emitted.
   */
  emit<TKey extends keyof TEvents>(eventName: TKey, payload: TEvents[TKey]): void {
    const listeners = this.listeners.get(eventName)
    if (!listeners) {
      return
    }

    for (const listener of [...listeners]) {
      ;(listener as Listener<TEvents[TKey]>)(payload)
    }
  }
}
