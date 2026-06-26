import type { Trait } from '@/engine/entity/Trait'

export interface TankTrait extends Trait {
  name: 'tank'
  moveSpeed: number
  turnSpeed: number
  turretYaw: number
  moveInput: number
  turnInput: number
}

/**
 * 创建玩家坦克的基础移动状态。
 *
 * 第一版先把输入状态保存在 Trait 上，System 每个固定 tick 读取它推进实体位置。
 * 后续如果加入单位指令队列，可以把 moveInput/turnInput 替换成更高层的移动任务。
 */
export function createTankTrait(): TankTrait {
  return {
    name: 'tank',
    moveSpeed: 5,
    turnSpeed: Math.PI,
    turretYaw: 0,
    moveInput: 0,
    turnInput: 0,
  }
}
