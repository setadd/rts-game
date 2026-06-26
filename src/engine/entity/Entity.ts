import type { Transform } from './Transform'
import type { Trait } from './Trait'
import type { EntityId } from './EntityId'

/**
 * 最小模拟对象。
 *
 * Entity 只保留身份、类型、Transform 和 Trait。具体游戏行为放到 Trait 和 System 中，
 * 这样坦克大战后续演进为 RTS 单位时，不需要改动基础对象结构。
 */
export interface Entity {
  id: EntityId
  type: string
  transform: Transform
  traits: Trait[]
}
