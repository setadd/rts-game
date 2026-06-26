import type { Entity } from '@/engine/entity/Entity'
import type { EntityId } from '@/engine/entity/EntityId'
import type { TickContext } from './TickContext'

/**
 * World 持有权威的模拟实体集合。
 *
 * 渲染、UI、编辑器可以观察或镜像 World 状态，但不应该拥有游戏对象。
 * 这种分离是单元测试、回放和未来 RTS 锁步同步的基础。
 */
export class World {
  private readonly entities = new Map<EntityId, Entity>()

  /**
   * 把实体加入模拟，并让 Trait 有机会执行初始化。
   * 重复 id 直接视为程序错误，因为命令和渲染对象都依赖稳定的实体身份。
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
   * 从模拟中移除实体，并在实体不再能从 World 访问前调用 Trait 清理钩子。
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
   * 执行一次固定 tick 内的逐实体 Trait 更新。
   * 需要跨实体协作的逻辑应放在 System 中，而不是塞进这个方法。
   */
  tick(context: TickContext): void {
    for (const entity of this.entities.values()) {
      for (const trait of entity.traits) {
        trait.onTick?.(entity, context)
      }
    }
  }
}
