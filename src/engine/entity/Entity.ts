import type { Transform } from './Transform'
import type { Trait } from './Trait'
import type { EntityId } from './EntityId'

/**
 * Minimal simulation object.
 *
 * Entity intentionally contains only identity, type, transform, and traits.
 * Game-specific behavior belongs in traits and systems so tank battles can later
 * evolve into RTS units without changing the base object shape.
 */
export interface Entity {
  id: EntityId
  type: string
  transform: Transform
  traits: Trait[]
}
