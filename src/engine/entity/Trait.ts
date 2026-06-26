import type { TickContext } from '@/engine/core/TickContext'
import type { Entity } from './Entity'

export interface Trait {
  name: string
  onAttach?(entity: Entity): void
  onTick?(entity: Entity, context: TickContext): void
  onDispose?(entity: Entity): void
}
