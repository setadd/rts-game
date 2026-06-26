import { describe, expect, test } from 'vitest'
import { World } from '@/engine/core/World'
import { createDefaultTransform } from '@/engine/entity/Transform'
import { CollisionDamageSystem } from '@/games/tank-battle/systems/CollisionDamageSystem'
import { createColliderTrait } from '@/games/tank-battle/traits/ColliderTrait'
import { type HealthTrait, createHealthTrait } from '@/games/tank-battle/traits/HealthTrait'
import { createProjectileTrait } from '@/games/tank-battle/traits/ProjectileTrait'
import { requireTrait } from '@/games/tank-battle/utils/traitLookup'

describe('CollisionDamageSystem', () => {
  test('damages target and removes projectile on hit', () => {
    const world = new World()
    world.spawn({
      id: 'target',
      type: 'target',
      transform: createDefaultTransform(),
      traits: [createHealthTrait(100), createColliderTrait(1)],
    })
    world.spawn({
      id: 'projectile-1',
      type: 'projectile',
      transform: createDefaultTransform(),
      traits: [createProjectileTrait('player', 25, 10), createColliderTrait(0.2, false)],
    })

    new CollisionDamageSystem().update(world, { tick: 1, deltaSeconds: 1 / 30, elapsedSeconds: 1 / 30 })

    expect(world.has('projectile-1')).toBe(false)
    expect(requireTrait<HealthTrait>(world.get('target'), 'health').hp).toBe(75)
  })

  test('removes destroyed targets from world', () => {
    const world = new World()
    world.spawn({
      id: 'target',
      type: 'target',
      transform: createDefaultTransform(),
      traits: [createHealthTrait(10), createColliderTrait(1)],
    })
    world.spawn({
      id: 'projectile-1',
      type: 'projectile',
      transform: createDefaultTransform(),
      traits: [createProjectileTrait('player', 25, 10), createColliderTrait(0.2, false)],
    })

    new CollisionDamageSystem().update(world, { tick: 1, deltaSeconds: 1 / 30, elapsedSeconds: 1 / 30 })

    expect(world.has('target')).toBe(false)
  })
})
