import type { System } from '@/engine/core/System'
import type { TickContext } from '@/engine/core/TickContext'
import type { World } from '@/engine/core/World'
import type { ColliderTrait } from '../traits/ColliderTrait'
import type { HealthTrait } from '../traits/HealthTrait'
import type { ProjectileTrait } from '../traits/ProjectileTrait'
import { getTrait } from '../utils/traitLookup'

function distanceSquared(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx
  const dz = az - bz
  return dx * dx + dz * dz
}

/**
 * 处理炮弹和可受伤实体之间的命中、扣血与销毁。
 *
 * 当前 MVP 使用 XZ 平面的圆形碰撞：坦克、目标和炮弹都用半径表达占位范围。
 * 这种模型足够验证战斗闭环，而且计算稳定、测试简单。后续做墙体、寻路阻挡、
 * 复杂模型命中盒时，可以把内部碰撞判定替换为空间索引或物理库，外部系统接口不需要变化。
 */
export class CollisionDamageSystem implements System {
  readonly name = 'collision-damage'

  update(world: World, _context: TickContext): void {
    const removals = new Set<string>()
    const entities = world.getAll()

    for (const projectileEntity of entities) {
      const projectile = getTrait<ProjectileTrait>(projectileEntity, 'projectile')
      const projectileCollider = getTrait<ColliderTrait>(projectileEntity, 'collider')
      if (!projectile || !projectileCollider) {
        continue
      }

      for (const target of entities) {
        // 炮弹不命中自己，也不命中发射者。这样后续玩家和 AI 共用一套武器系统时不会误伤开火单位。
        if (target.id === projectile.ownerId || target.id === projectileEntity.id) {
          continue
        }

        const health = getTrait<HealthTrait>(target, 'health')
        const targetCollider = getTrait<ColliderTrait>(target, 'collider')
        if (!health || !targetCollider) {
          continue
        }

        const radius = projectileCollider.radius + targetCollider.radius
        const hit =
          distanceSquared(
            projectileEntity.transform.position.x,
            projectileEntity.transform.position.z,
            target.transform.position.x,
            target.transform.position.z,
          ) <=
          radius * radius

        if (!hit) {
          continue
        }

        health.hp -= projectile.damage
        removals.add(projectileEntity.id)

        if (health.hp <= 0) {
          health.destroyed = true
          removals.add(target.id)
        }

        // 一枚炮弹只处理第一次命中，避免同一 tick 内穿透多个目标造成非预期伤害。
        break
      }
    }

    for (const id of removals) {
      if (world.has(id)) {
        world.remove(id)
      }
    }
  }
}
