import type { CommandQueue } from '@/engine/command/CommandQueue'
import type { System } from '@/engine/core/System'
import type { TickContext } from '@/engine/core/TickContext'
import type { World } from '@/engine/core/World'
import { createDefaultTransform } from '@/engine/entity/Transform'
import type { TankFirePayload } from '../commands/TankCommands'
import { createColliderTrait } from '../traits/ColliderTrait'
import { createProjectileTrait, type ProjectileTrait } from '../traits/ProjectileTrait'
import type { WeaponTrait } from '../traits/WeaponTrait'
import { getTrait } from '../utils/traitLookup'

/**
 * 处理坦克开火、炮弹生成、炮弹移动和生命周期。
 *
 * 系统只消费 `tank.fire` 命令，不会拿走移动或瞄准命令。这样多个系统可以共享同一个
 * CommandQueue，仍然保持各自职责清晰。
 */
export class ProjectileSystem implements System {
  readonly name = 'projectile'

  constructor(private readonly commands: CommandQueue) {}

  update(world: World, context: TickContext): void {
    for (const command of this.commands.dequeueForTick(
      context.tick,
      (queuedCommand) => queuedCommand.type === 'tank.fire',
    )) {
      const shooter = world.get(command.actorId)
      const weapon = getTrait<WeaponTrait>(shooter, 'weapon')
      if (!weapon || weapon.remainingCooldownTicks > 0) {
        continue
      }

      const payload = command.payload as TankFirePayload
      const transform = createDefaultTransform()
      transform.position = { ...shooter.transform.position }
      transform.rotation = { ...shooter.transform.rotation }

      world.spawn({
        id: `projectile-${payload.requestId}`,
        type: 'projectile',
        transform,
        traits: [
          createProjectileTrait(shooter.id, weapon.projectileDamage, weapon.projectileSpeed),
          createColliderTrait(0.2, false),
        ],
      })
      weapon.remainingCooldownTicks = weapon.cooldownTicks
    }

    for (const entity of world.getAll()) {
      const weapon = getTrait<WeaponTrait>(entity, 'weapon')
      if (weapon && weapon.remainingCooldownTicks > 0) {
        weapon.remainingCooldownTicks -= 1
      }

      const projectile = getTrait<ProjectileTrait>(entity, 'projectile')
      if (!projectile) {
        continue
      }

      entity.transform.position.x += Math.sin(entity.transform.rotation.y) * projectile.speed * context.deltaSeconds
      entity.transform.position.z += Math.cos(entity.transform.rotation.y) * projectile.speed * context.deltaSeconds
      projectile.lifetimeTicks -= 1

      if (projectile.lifetimeTicks <= 0 && world.has(entity.id)) {
        world.remove(entity.id)
      }
    }
  }
}
