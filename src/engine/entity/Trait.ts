import type { TickContext } from '@/engine/core/TickContext'
import type { Entity } from './Entity'

/**
 * Traits are small capabilities attached to an Entity.
 *
 * Examples planned for later phases include health, weapons, collision, teams,
 * bot control, and render metadata. A trait should hold local state or hooks;
 * cross-entity behavior belongs in a System.
 */
export interface Trait {
  name: string
  onAttach?(entity: Entity): void
  onTick?(entity: Entity, context: TickContext): void
  onDispose?(entity: Entity): void
}
