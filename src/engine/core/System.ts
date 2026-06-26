import type { World } from './World'
import type { TickContext } from './TickContext'

/**
 * System 用于处理跨实体的每 tick 行为。
 *
 * Trait 更适合表达单个实体身上的小能力；System 更适合处理需要遍历多个实体的逻辑，
 * 例如碰撞、炮弹、AI、框选、寻路或渲染同步。
 */
export interface System {
  name: string
  update(world: World, context: TickContext): void
}
