import { describe, expect, test } from 'vitest'
import { World } from '@/engine/core/World'
import type { Entity } from '@/engine/entity/Entity'

function entity(id: string, type = 'test-object'): Entity {
  return {
    id,
    type,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    traits: [],
  }
}

describe('World', () => {
  test('spawns and queries entities by id', () => {
    const world = new World()
    const tank = entity('tank-1', 'tank')

    world.spawn(tank)

    expect(world.has('tank-1')).toBe(true)
    expect(world.get('tank-1')).toBe(tank)
    expect(world.getAll()).toEqual([tank])
  })

  test('rejects duplicate entity ids', () => {
    const world = new World()
    world.spawn(entity('tank-1'))

    expect(() => world.spawn(entity('tank-1'))).toThrow('Entity already exists: tank-1')
  })

  test('removes existing entities', () => {
    const world = new World()
    const tank = entity('tank-1')
    world.spawn(tank)

    world.remove('tank-1')

    expect(world.has('tank-1')).toBe(false)
    expect(world.getAll()).toEqual([])
  })

  test('rejects removing missing entities', () => {
    const world = new World()

    expect(() => world.remove('missing')).toThrow('Entity does not exist: missing')
  })

  test('updates tick traits in insertion order', () => {
    const calls: string[] = []
    const world = new World()
    world.spawn({
      ...entity('tank-1'),
      traits: [
        { name: 'first', onTick: () => calls.push('first') },
        { name: 'second', onTick: () => calls.push('second') },
      ],
    })

    world.tick({ tick: 1, deltaSeconds: 1 / 30, elapsedSeconds: 1 / 30 })

    expect(calls).toEqual(['first', 'second'])
  })
})
