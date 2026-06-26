import type { Object3D } from 'three'
import type { EntityId } from '@/engine/entity/EntityId'

/**
 * 维护 Entity 与 Three.js Object3D 的映射关系。
 *
 * 核心引擎只知道 Entity，不直接持有 Mesh 或 Group。渲染层通过这个注册表找到
 * 每个实体对应的 Three.js 对象，再把模拟状态同步到画面上。
 */
export class RenderableRegistry {
  private readonly objects = new Map<EntityId, Object3D>()

  set(entityId: EntityId, object: Object3D): void {
    this.objects.set(entityId, object)
  }

  get(entityId: EntityId): Object3D | undefined {
    return this.objects.get(entityId)
  }

  delete(entityId: EntityId): void {
    this.objects.delete(entityId)
  }

  entries(): Array<[EntityId, Object3D]> {
    return [...this.objects.entries()]
  }
}
