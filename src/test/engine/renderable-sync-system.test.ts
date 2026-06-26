import { describe, expect, test } from 'vitest'
import { Object3D } from 'three'
import { World } from '@/engine/core/World'
import { RenderableRegistry } from '@/engine-three/renderer/RenderableRegistry'
import { RenderableSyncSystem } from '@/engine-three/renderer/RenderableSyncSystem'
import type { Entity } from '@/engine/entity/Entity'

function entity(id: string): Entity {
  return {
    id,
    type: 'box',
    transform: {
      position: { x: 3, y: 1, z: -2 },
      rotation: { x: 0, y: Math.PI / 2, z: 0 },
      scale: { x: 2, y: 2, z: 2 },
    },
    traits: [],
  }
}

describe('RenderableSyncSystem', () => {
  test('copies entity transform into registered Object3D', () => {
    const world = new World()
    const registry = new RenderableRegistry()
    const object = new Object3D()
    world.spawn(entity('tank-1'))
    registry.set('tank-1', object)
    const system = new RenderableSyncSystem(registry)

    system.update(world, { tick: 1, deltaSeconds: 1 / 30, elapsedSeconds: 1 / 30 })

    expect(object.position.toArray()).toEqual([3, 1, -2])
    expect(object.rotation.y).toBe(Math.PI / 2)
    expect(object.scale.toArray()).toEqual([2, 2, 2])
  })
})
