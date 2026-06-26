import type { Transform } from './Transform'
import type { Trait } from './Trait'
import type { EntityId } from './EntityId'

export interface Entity {
  id: EntityId
  type: string
  transform: Transform
  traits: Trait[]
}
