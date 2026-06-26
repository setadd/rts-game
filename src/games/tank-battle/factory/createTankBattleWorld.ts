import { World } from '@/engine/core/World'
import { createDefaultTransform } from '@/engine/entity/Transform'
import { createColliderTrait } from '../traits/ColliderTrait'
import { createHealthTrait } from '../traits/HealthTrait'
import { createTankTrait } from '../traits/TankTrait'
import { createWeaponTrait } from '../traits/WeaponTrait'

/**
 * 创建 Phase 2 使用的临时坦克大战测试场景。
 *
 * 当前阶段先硬编码玩家坦克和几个靶标，用来验证移动、开火、命中、扣血和销毁闭环。
 * 地图 JSON、关卡编辑器和 AI 刷怪会在后续阶段替换这里的数据来源，但不会改变 World/Entity 的结构。
 */
export function createTankBattleWorld(): World {
  const world = new World()

  world.spawn({
    id: 'player',
    type: 'tank',
    transform: createDefaultTransform(),
    traits: [createTankTrait(), createWeaponTrait(), createHealthTrait(100), createColliderTrait(0.6)],
  })

  const targetPositions = [
    { id: 'target-1', x: 0, z: 6 },
    { id: 'target-2', x: -3, z: 4 },
    { id: 'target-3', x: 3, z: 4 },
  ]

  for (const target of targetPositions) {
    const transform = createDefaultTransform()
    transform.position.x = target.x
    transform.position.z = target.z

    world.spawn({
      id: target.id,
      type: 'target',
      transform,
      traits: [createHealthTrait(50), createColliderTrait(0.8)],
    })
  }

  return world
}
