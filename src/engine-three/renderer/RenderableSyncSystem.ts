import type { System } from '@/engine/core/System'
import type { TickContext } from '@/engine/core/TickContext'
import type { World } from '@/engine/core/World'
import type { RenderableRegistry } from './RenderableRegistry'

/**
 * 把核心 Entity 的 Transform 单向同步到 Three.js Object3D。
 *
 * 这个 System 位于渲染适配层：它可以读取 World，但核心引擎不需要知道 Three.js。
 * 后续如果加入插值渲染，也应该在这里或同层适配器中处理，而不是污染模拟层。
 */
export class RenderableSyncSystem implements System {
  readonly name = 'renderable-sync'

  constructor(private readonly registry: RenderableRegistry) {}

  update(world: World, _context: TickContext): void {
    for (const entity of world.getAll()) {
      const object = this.registry.get(entity.id)
      if (!object) {
        continue
      }

      object.position.set(
        entity.transform.position.x,
        entity.transform.position.y,
        entity.transform.position.z,
      )
      object.rotation.set(
        entity.transform.rotation.x,
        entity.transform.rotation.y,
        entity.transform.rotation.z,
      )
      object.scale.set(entity.transform.scale.x, entity.transform.scale.y, entity.transform.scale.z)
    }
  }
}
