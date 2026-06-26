import type { EntityId } from '@/engine/entity/EntityId'

/**
 * Command 表示“意图”，不是立即修改状态的操作。
 *
 * 玩家输入、AI 决策、回放数据、未来的联机锁步包都应该通过命令进入模拟层。
 * 这样能保持模拟逻辑可预测，也方便后续扩展 RTS 风格的单位指令系统。
 */
export interface Command<TPayload = unknown> {
  id: string
  actorId: EntityId
  type: string
  payload: TPayload
  /**
   * 可选的固定模拟 tick，用于延迟命令或未来的锁步同步命令。
   * 没有 tick 的命令会在下一次更新时被消费。
   */
  tick?: number
}
