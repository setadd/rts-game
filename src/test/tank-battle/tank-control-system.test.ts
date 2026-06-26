import { describe, expect, test } from 'vitest'
import { CommandQueue } from '@/engine/command/CommandQueue'
import { World } from '@/engine/core/World'
import { createDefaultTransform } from '@/engine/entity/Transform'
import { TankControlSystem } from '@/games/tank-battle/systems/TankControlSystem'
import { createTankTrait } from '@/games/tank-battle/traits/TankTrait'

describe('TankControlSystem', () => {
  test('moves a tank forward using fixed tick input', () => {
    const world = new World()
    const commands = new CommandQueue()
    world.spawn({
      id: 'player',
      type: 'tank',
      transform: createDefaultTransform(),
      traits: [createTankTrait()],
    })
    commands.enqueue({ id: 'move-1', actorId: 'player', type: 'tank.move', payload: { move: 1, turn: 0 } })

    new TankControlSystem(commands).update(world, { tick: 1, deltaSeconds: 1, elapsedSeconds: 1 })

    expect(world.get('player').transform.position.z).toBeCloseTo(5)
  })

  test('rotates a tank using turn input', () => {
    const world = new World()
    const commands = new CommandQueue()
    world.spawn({
      id: 'player',
      type: 'tank',
      transform: createDefaultTransform(),
      traits: [createTankTrait()],
    })
    commands.enqueue({ id: 'turn-1', actorId: 'player', type: 'tank.move', payload: { move: 0, turn: 1 } })

    new TankControlSystem(commands).update(world, { tick: 1, deltaSeconds: 0.5, elapsedSeconds: 0.5 })

    expect(world.get('player').transform.rotation.y).toBeCloseTo(Math.PI / 2)
  })
})
