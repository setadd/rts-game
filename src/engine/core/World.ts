import type { Entity } from '@/engine/entity/Entity'
import type { EntityId } from '@/engine/entity/EntityId'
import type { TickContext } from './TickContext'

/**
 * Owns the authoritative set of simulation entities.
 *
 * Rendering, UI, and editor tools can observe or mirror World state, but they
 * should not own game objects. This separation is the foundation for tests,
 * replay, and future RTS lockstep synchronization.
 */
export class World {
  private readonly entities = new Map<EntityId, Entity>()

  /**
   * Adds an entity to the simulation and gives traits a chance to initialize.
   * Duplicate ids are treated as programmer errors because commands and render
   * objects depend on stable entity identity.
   */
  spawn(entity: Entity): void {
    if (this.entities.has(entity.id)) {
      throw new Error(`Entity already exists: ${entity.id}`)
    }

    this.entities.set(entity.id, entity)

    for (const trait of entity.traits) {
      trait.onAttach?.(entity)
    }
  }

  /**
   * Removes an entity from the simulation and calls trait cleanup hooks before
   * the object becomes unreachable from World.
   */
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

  /**
   * Runs per-entity trait updates for one fixed simulation tick.
   * Systems that need to process many entities together run outside this method.
   */
  tick(context: TickContext): void {
    for (const entity of this.entities.values()) {
      for (const trait of entity.traits) {
        trait.onTick?.(entity, context)
      }
    }
  }
}
