import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from 'three'
import type { World } from '@/engine/core/World'
import type { RenderableRegistry } from '@/engine-three/renderer/RenderableRegistry'
import type { ThreeRenderer } from '@/engine-three/renderer/ThreeRenderer'

const tankMaterial = new MeshStandardMaterial({ color: '#3f8cff' })
const turretMaterial = new MeshStandardMaterial({ color: '#9bd0ff' })
const targetMaterial = new MeshStandardMaterial({ color: '#d95f5f' })
const projectileMaterial = new MeshStandardMaterial({ color: '#ffd166' })

function createTankObject(): Object3D {
  const group = new Group()

  // 车体和炮塔先用简单几何体表达，后续可替换为 glTF 模型；外部仍然只拿到 Object3D。
  const body = new Mesh(new BoxGeometry(1.2, 0.45, 1.8), tankMaterial)
  body.position.y = 0.25
  group.add(body)

  const turret = new Mesh(new BoxGeometry(0.75, 0.28, 0.85), turretMaterial)
  turret.position.y = 0.65
  group.add(turret)

  const barrel = new Mesh(new CylinderGeometry(0.07, 0.07, 1.2, 12), turretMaterial)
  barrel.rotation.x = Math.PI / 2
  barrel.position.set(0, 0.66, 0.85)
  group.add(barrel)

  return group
}

function createTargetObject(): Object3D {
  const target = new Mesh(new BoxGeometry(1.4, 0.8, 1.4), targetMaterial)
  target.position.y = 0.4
  return target
}

function createProjectileObject(): Object3D {
  const projectile = new Mesh(new SphereGeometry(0.18, 16, 12), projectileMaterial)
  projectile.position.y = 0.45
  return projectile
}

/**
 * 保持 World 实体和 Three.js 对象数量一致。
 *
 * 游戏系统只负责创建或删除 Entity；这里在渲染帧里补齐 Mesh，并清理已经死亡的对象。
 * 这样 ProjectileSystem 可以专注模拟炮弹，CollisionDamageSystem 可以专注删除实体。
 */
export function createTankBattleRenderables(
  world: World,
  registry: RenderableRegistry,
  renderer: ThreeRenderer,
): void {
  for (const entity of world.getAll()) {
    if (registry.get(entity.id)) {
      continue
    }

    const object =
      entity.type === 'projectile'
        ? createProjectileObject()
        : entity.type === 'tank'
          ? createTankObject()
          : createTargetObject()

    renderer.scene.add(object)
    registry.set(entity.id, object)
  }

  for (const [entityId, object] of registry.entries()) {
    if (world.has(entityId)) {
      continue
    }

    renderer.scene.remove(object)
    registry.delete(entityId)
  }
}
