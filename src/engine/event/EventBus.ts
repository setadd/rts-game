type Listener<TPayload> = (payload: TPayload) => void

/**
 * 轻量级类型化发布订阅工具，用于解耦引擎系统和 UI 适配层。
 *
 * 这里刻意使用同步派发：事件处理器会在 emit 所在的同一个模拟步骤内执行，
 * 这样更容易测试和调试。耗时任务应在核心模拟循环外触发。
 */
export class EventBus<TEvents extends object> {
  private readonly listeners = new Map<keyof TEvents, Set<Listener<TEvents[keyof TEvents]>>>()

  /**
   * 订阅事件并返回取消订阅函数。场景、UI 面板或系统销毁时应调用该函数，
   * 避免旧监听器继续响应新状态。
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
   * 向当前监听器派发类型化 payload。派发前复制监听器集合，
   * 允许监听器在处理事件时安全地取消订阅自己。
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
