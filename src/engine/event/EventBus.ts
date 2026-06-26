type Listener<TPayload> = (payload: TPayload) => void

export class EventBus<TEvents extends object> {
  private readonly listeners = new Map<keyof TEvents, Set<Listener<TEvents[keyof TEvents]>>>()

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
