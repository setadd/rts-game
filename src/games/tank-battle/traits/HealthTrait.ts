import type { Trait } from '@/engine/entity/Trait'

export interface HealthTrait extends Trait {
  name: 'health'
  hp: number
  maxHp: number
  destroyed: boolean
}

/**
 * 创建可受伤实体的生命状态。
 *
 * `destroyed` 是给 UI、特效或后续事件系统读取的显式标记；实体是否从 World 移除
 * 仍由战斗系统统一决定。
 */
export function createHealthTrait(maxHp: number): HealthTrait {
  return {
    name: 'health',
    hp: maxHp,
    maxHp,
    destroyed: false,
  }
}
