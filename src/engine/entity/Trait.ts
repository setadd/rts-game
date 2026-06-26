import type { TickContext } from '@/engine/core/TickContext'
import type { Entity } from './Entity'

/**
 * Trait 表示挂在 Entity 上的小能力。
 *
 * 后续阶段会加入生命、武器、碰撞、阵营、AI 控制和渲染元数据等 Trait。
 * Trait 适合保存单实体局部状态或钩子；跨实体行为应放在 System 中。
 */
export interface Trait {
  name: string
  onAttach?(entity: Entity): void
  onTick?(entity: Entity, context: TickContext): void
  onDispose?(entity: Entity): void
}
