import { describe, expect, test } from 'vitest'
import { CommandQueue } from '@/engine/command/CommandQueue'
import { World } from '@/engine/core/World'
import { createDefaultTransform } from '@/engine/entity/Transform'
import { ProjectileSystem } from '@/games/tank-battle/systems/ProjectileSystem'
import { createProjectileTrait } from '@/games/tank-battle/traits/ProjectileTrait'
import { createTankTrait } from '@/games/tank-battle/traits/TankTrait'
import { createWeaponTrait } from '@/games/tank-battle/traits/WeaponTrait'

describe('ProjectileSystem', () => {
  test('fires a projectile from a tank weapon', () => {
    const world = new World()
    const commands = new CommandQueue()
    world.spawn({
      id: 'player',
      type: 'tank',
      transform: createDefaultTransform(),
      traits: [createTankTrait(), createWeaponTrait()],
    })
    commands.enqueue({ id: 'fire-1', actorId: 'player', type: 'tank.fire', payload: { requestId: 'shot-1' } })

    new ProjectileSystem(commands).update(world, { tick: 1, deltaSeconds: 1 / 30, elapsedSeconds: 1 / 30 })

    expect(world.has('projectile-shot-1')).toBe(true)
  })

  test('moves projectiles forward and expires lifetime', () => {
    const world = new World()
    const commands = new CommandQueue()
    const system = new ProjectileSystem(commands)
    world.spawn({
      id: 'projectile-shot-1',
      type: 'projectile',
      transform: createDefaultTransform(),
      traits: [createProjectileTrait('player', 25, 10)],
    })

    system.update(world, { tick: 1, deltaSeconds: 1, elapsedSeconds: 1 })

    expect(world.has('projectile-shot-1')).toBe(true)
    expect(world.get('projectile-shot-1').transform.position.z).toBeCloseTo(10)

    for (let tick = 2; tick <= 91; tick += 1) {
      system.update(world, { tick, deltaSeconds: 1 / 30, elapsedSeconds: tick / 30 })
    }

    expect(world.has('projectile-shot-1')).toBe(false)
  })
})
