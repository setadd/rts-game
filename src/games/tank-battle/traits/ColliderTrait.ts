import type { Trait } from '@/engine/entity/Trait'

export interface ColliderTrait extends Trait {
  name: 'collider'
  radius: number
  solid: boolean
}

/**
 * 创建圆形碰撞体。
 *
 * Phase 2 只需要验证战斗闭环，圆形碰撞足够覆盖坦克、炮弹和目标块。
 * 后续地图墙体和复杂模型可以在系统内部替换为更精细的碰撞表达。
 */
export function createColliderTrait(radius: number, solid = true): ColliderTrait {
  return {
    name: 'collider',
    radius,
    solid,
  }
}
