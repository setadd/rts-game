/**
 * 单次固定模拟更新传给 Trait 和 System 的时间上下文。
 *
 * 在固定 tickRate 下，`deltaSeconds` 应保持稳定。渲染层可以用不同帧率运行，
 * 但核心模拟只应该通过 tick 前进。
 */
export interface TickContext {
  tick: number
  deltaSeconds: number
  elapsedSeconds: number
}
