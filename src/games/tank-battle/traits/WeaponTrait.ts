import type { Trait } from '@/engine/entity/Trait'

export interface WeaponTrait extends Trait {
  name: 'weapon'
  cooldownTicks: number
  remainingCooldownTicks: number
  projectileSpeed: number
  projectileDamage: number
}

/**
 * 创建坦克主炮状态。
 *
 * 冷却用 tick 计数而不是毫秒计数，保证固定 tick 模拟、回放和未来 lockstep 下行为一致。
 */
export function createWeaponTrait(): WeaponTrait {
  return {
    name: 'weapon',
    cooldownTicks: 12,
    remainingCooldownTicks: 0,
    projectileSpeed: 10,
    projectileDamage: 25,
  }
}
