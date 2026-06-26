import type { Trait } from '@/engine/entity/Trait'
import type { EntityId } from '@/engine/entity/EntityId'

export interface ProjectileTrait extends Trait {
  name: 'projectile'
  ownerId: EntityId
  damage: number
  speed: number
  lifetimeTicks: number
}

/**
 * 创建炮弹状态。
 *
 * ownerId 用于避免炮弹刚生成就命中发射者；lifetimeTicks 用于清理飞出战场的炮弹。
 */
export function createProjectileTrait(ownerId: EntityId, damage: number, speed: number): ProjectileTrait {
  return {
    name: 'projectile',
    ownerId,
    damage,
    speed,
    lifetimeTicks: 90,
  }
}
