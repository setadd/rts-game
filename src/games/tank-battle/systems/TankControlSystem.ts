import type { CommandQueue } from '@/engine/command/CommandQueue'
import type { System } from '@/engine/core/System'
import type { TickContext } from '@/engine/core/TickContext'
import type { World } from '@/engine/core/World'
import type { TankAimPayload, TankMovePayload } from '../commands/TankCommands'
import type { TankTrait } from '../traits/TankTrait'
import { getTrait } from '../utils/traitLookup'

/**
 * 消费坦克控制命令，并在固定 tick 中推进坦克位置和朝向。
 *
 * 系统不直接监听键盘或鼠标。Vue 层、AI、回放或未来网络层都只需要写入 CommandQueue，
 * 就能复用同一套模拟逻辑。
 */
export class TankControlSystem implements System {
  readonly name = 'tank-control'

  constructor(private readonly commands: CommandQueue) {}

  update(world: World, context: TickContext): void {
    for (const command of this.commands.dequeueForTick(context.tick)) {
      const entity = world.get(command.actorId)
      const tank = getTrait<TankTrait>(entity, 'tank')
      if (!tank) {
        continue
      }

      if (command.type === 'tank.move') {
        const payload = command.payload as TankMovePayload
        tank.moveInput = Math.max(-1, Math.min(1, payload.move))
        tank.turnInput = Math.max(-1, Math.min(1, payload.turn))
      }

      if (command.type === 'tank.aim') {
        const payload = command.payload as TankAimPayload
        tank.turretYaw = payload.yaw
      }
    }

    for (const entity of world.getAll()) {
      const tank = getTrait<TankTrait>(entity, 'tank')
      if (!tank) {
        continue
      }

      entity.transform.rotation.y += tank.turnInput * tank.turnSpeed * context.deltaSeconds
      entity.transform.position.x +=
        Math.sin(entity.transform.rotation.y) * tank.moveInput * tank.moveSpeed * context.deltaSeconds
      entity.transform.position.z +=
        Math.cos(entity.transform.rotation.y) * tank.moveInput * tank.moveSpeed * context.deltaSeconds
    }
  }
}
