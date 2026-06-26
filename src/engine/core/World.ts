import type { Entity } from '@/engine/entity/Entity'
import type { EntityId } from '@/engine/entity/EntityId'
import type { TickContext } from './TickContext'

export class World {
  private readonly entities = new Map<EntityId, Entity>()

  spawn(entity: Entity): void {
    if (this.entities.has(entity.id)) {
      throw new Error(`Entity already exists: ${entity.id}`)
    }

    this.entities.set(entity.id, entity)

    for (const trait of entity.traits) {
      trait.onAttach?.(entity)
    }
  }

  remove(id: EntityId): Entity {
    const entity = this.entities.get(id)
    if (!entity) {
      throw new Error(`Entity does not exist: ${id}`)
    }

    for (const trait of entity.traits) {
      trait.onDispose?.(entity)
    }

    this.entities.delete(id)
    return entity
  }

  has(id: EntityId): boolean {
    return this.entities.has(id)
  }

  get(id: EntityId): Entity {
    const entity = this.entities.get(id)
    if (!entity) {
      throw new Error(`Entity does not exist: ${id}`)
    }
    return entity
  }

  getAll(): Entity[] {
    return [...this.entities.values()]
  }

  tick(context: TickContext): void {
    for (const entity of this.entities.values()) {
      for (const trait of entity.traits) {
        trait.onTick?.(entity, context)
      }
    }
  }
}
