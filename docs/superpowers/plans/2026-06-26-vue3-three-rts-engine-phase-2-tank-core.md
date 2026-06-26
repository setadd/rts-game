# Vue3 Three RTS Engine Phase 2 Tank Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable tank-battle core loop: player tank movement, turret aiming, firing, projectile collision, health, death, and HUD.

**Architecture:** Keep gameplay simulation in `src/games/tank-battle/**` and keep Three.js rendering in `src/engine-three/**` or Vue view wiring. Player input emits commands into `CommandQueue`; tank systems consume commands during fixed ticks and mutate engine `Entity` state.

**Tech Stack:** Vue 3, Element Plus, Vite, TypeScript, Three.js, Vitest.

---

## Scope

This plan implements Phase 2 from the approved design:

- Player tank entity.
- Move and rotate controls.
- Turret aiming state.
- Projectile firing.
- Projectile movement and collision.
- Health, damage, death, entity removal.
- Basic HUD showing player HP, projectile count, and destroyed targets.

This plan does not implement bot AI, patrol routes, map editor, level JSON loading, or win/loss rules. Those stay in later phases.

## File Structure

Create these files:

```text
src/games/tank-battle/commands/TankCommands.ts
src/games/tank-battle/traits/ColliderTrait.ts
src/games/tank-battle/traits/HealthTrait.ts
src/games/tank-battle/traits/ProjectileTrait.ts
src/games/tank-battle/traits/TankTrait.ts
src/games/tank-battle/traits/WeaponTrait.ts
src/games/tank-battle/utils/traitLookup.ts
src/games/tank-battle/systems/TankControlSystem.ts
src/games/tank-battle/systems/ProjectileSystem.ts
src/games/tank-battle/systems/CollisionDamageSystem.ts
src/games/tank-battle/factory/createTankBattleWorld.ts
src/games/tank-battle/render/createTankBattleRenderables.ts
src/games/tank-battle/ui/TankBattleHud.vue
src/test/tank-battle/tank-control-system.test.ts
src/test/tank-battle/projectile-system.test.ts
src/test/tank-battle/collision-damage-system.test.ts
```

Modify these files:

```text
src/app/components/GameCanvas.vue
package.json
```

Responsibilities:

- `traits/`: store local gameplay state on entities.
- `systems/`: process fixed-tick gameplay behavior.
- `factory/`: create a small hard-coded test arena until Phase 4 adds level loading.
- `render/`: create Three.js meshes for tank, projectile, and target blocks.
- `ui/`: Element Plus HUD for Phase 2 runtime state.
- `test/tank-battle/`: gameplay tests using real `World`, real `CommandQueue`, and real systems.

## Task 1: Add Tank Battle Traits and Lookup Helpers

**Files:**
- Create: `src/games/tank-battle/traits/TankTrait.ts`
- Create: `src/games/tank-battle/traits/WeaponTrait.ts`
- Create: `src/games/tank-battle/traits/HealthTrait.ts`
- Create: `src/games/tank-battle/traits/ColliderTrait.ts`
- Create: `src/games/tank-battle/traits/ProjectileTrait.ts`
- Create: `src/games/tank-battle/utils/traitLookup.ts`

- [ ] **Step 1: Create trait state files**

Create `TankTrait.ts`:

```ts
import type { Trait } from '@/engine/entity/Trait'

export interface TankTrait extends Trait {
  name: 'tank'
  moveSpeed: number
  turnSpeed: number
  turretYaw: number
  moveInput: number
  turnInput: number
}

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
```

Create `WeaponTrait.ts`:

```ts
import type { Trait } from '@/engine/entity/Trait'

export interface WeaponTrait extends Trait {
  name: 'weapon'
  cooldownTicks: number
  remainingCooldownTicks: number
  projectileSpeed: number
  projectileDamage: number
}

export function createWeaponTrait(): WeaponTrait {
  return {
    name: 'weapon',
    cooldownTicks: 12,
    remainingCooldownTicks: 0,
    projectileSpeed: 10,
    projectileDamage: 25,
  }
}
```

Create `HealthTrait.ts`:

```ts
import type { Trait } from '@/engine/entity/Trait'

export interface HealthTrait extends Trait {
  name: 'health'
  hp: number
  maxHp: number
  destroyed: boolean
}

export function createHealthTrait(maxHp: number): HealthTrait {
  return {
    name: 'health',
    hp: maxHp,
    maxHp,
    destroyed: false,
  }
}
```

Create `ColliderTrait.ts`:

```ts
import type { Trait } from '@/engine/entity/Trait'

export interface ColliderTrait extends Trait {
  name: 'collider'
  radius: number
  solid: boolean
}

export function createColliderTrait(radius: number, solid = true): ColliderTrait {
  return {
    name: 'collider',
    radius,
    solid,
  }
}
```

Create `ProjectileTrait.ts`:

```ts
import type { Trait } from '@/engine/entity/Trait'
import type { EntityId } from '@/engine/entity/EntityId'

export interface ProjectileTrait extends Trait {
  name: 'projectile'
  ownerId: EntityId
  damage: number
  speed: number
  lifetimeTicks: number
}

export function createProjectileTrait(ownerId: EntityId, damage: number, speed: number): ProjectileTrait {
  return {
    name: 'projectile',
    ownerId,
    damage,
    speed,
    lifetimeTicks: 90,
  }
}
```

- [ ] **Step 2: Create trait lookup helper**

Create `traitLookup.ts`:

```ts
import type { Entity } from '@/engine/entity/Entity'
import type { Trait } from '@/engine/entity/Trait'

export function getTrait<TTrait extends Trait>(entity: Entity, name: TTrait['name']): TTrait | undefined {
  return entity.traits.find((trait) => trait.name === name) as TTrait | undefined
}

export function requireTrait<TTrait extends Trait>(entity: Entity, name: TTrait['name']): TTrait {
  const trait = getTrait<TTrait>(entity, name)
  if (!trait) {
    throw new Error(`Entity ${entity.id} is missing trait: ${String(name)}`)
  }
  return trait
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/games/tank-battle/traits src/games/tank-battle/utils
git commit -m "feat: add tank battle traits"
```

## Task 2: Implement Tank Movement with TDD

**Files:**
- Create: `src/games/tank-battle/commands/TankCommands.ts`
- Create: `src/test/tank-battle/tank-control-system.test.ts`
- Create: `src/games/tank-battle/systems/TankControlSystem.ts`

- [ ] **Step 1: Write failing movement test**

Create `tank-control-system.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { CommandQueue } from '@/engine/command/CommandQueue'
import { World } from '@/engine/core/World'
import { createDefaultTransform } from '@/engine/entity/Transform'
import { createTankTrait } from '@/games/tank-battle/traits/TankTrait'
import { TankControlSystem } from '@/games/tank-battle/systems/TankControlSystem'

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
```

- [ ] **Step 2: Run RED**

Run: `npm run test -- src/test/tank-battle/tank-control-system.test.ts`

Expected: FAIL because `TankControlSystem` does not exist.

- [ ] **Step 3: Implement command types and system**

Create `TankCommands.ts`:

```ts
export interface TankMovePayload {
  move: number
  turn: number
}

export interface TankAimPayload {
  yaw: number
}

export interface TankFirePayload {
  requestId: string
}
```

Create `TankControlSystem.ts`:

```ts
import type { CommandQueue } from '@/engine/command/CommandQueue'
import type { System } from '@/engine/core/System'
import type { TickContext } from '@/engine/core/TickContext'
import type { World } from '@/engine/core/World'
import type { TankMovePayload, TankAimPayload } from '../commands/TankCommands'
import type { TankTrait } from '../traits/TankTrait'
import { getTrait } from '../utils/traitLookup'

/**
 * 消费玩家或脚本输入产生的坦克控制命令。
 *
 * 系统只处理意图，不直接监听键盘事件。Vue 组件负责把键盘/鼠标输入转换成命令，
 * 这样同一套系统后续可以复用于 AI、回放和联机同步。
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
      entity.transform.position.x += Math.sin(entity.transform.rotation.y) * tank.moveInput * tank.moveSpeed * context.deltaSeconds
      entity.transform.position.z += Math.cos(entity.transform.rotation.y) * tank.moveInput * tank.moveSpeed * context.deltaSeconds
    }
  }
}
```

- [ ] **Step 4: Run GREEN**

Run: `npm run test -- src/test/tank-battle/tank-control-system.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/games/tank-battle/commands src/games/tank-battle/systems/TankControlSystem.ts src/test/tank-battle/tank-control-system.test.ts
git commit -m "feat: add tank movement system"
```

## Task 3: Implement Projectile Firing and Movement with TDD

**Files:**
- Create: `src/test/tank-battle/projectile-system.test.ts`
- Create: `src/games/tank-battle/systems/ProjectileSystem.ts`

- [ ] **Step 1: Write failing projectile tests**

Create `projectile-system.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { CommandQueue } from '@/engine/command/CommandQueue'
import { World } from '@/engine/core/World'
import { createDefaultTransform } from '@/engine/entity/Transform'
import { ProjectileSystem } from '@/games/tank-battle/systems/ProjectileSystem'
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
      traits: [{ name: 'projectile', ownerId: 'player', damage: 25, speed: 10, lifetimeTicks: 1 }],
    })

    system.update(world, { tick: 1, deltaSeconds: 1, elapsedSeconds: 1 })

    expect(world.has('projectile-shot-1')).toBe(false)
  })
})
```

- [ ] **Step 2: Run RED**

Run: `npm run test -- src/test/tank-battle/projectile-system.test.ts`

Expected: FAIL because `ProjectileSystem` does not exist.

- [ ] **Step 3: Implement ProjectileSystem**

Create `ProjectileSystem.ts`:

```ts
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
 * 负责处理开火命令、生成炮弹、推进炮弹位置和生命周期。
 */
export class ProjectileSystem implements System {
  readonly name = 'projectile'

  constructor(private readonly commands: CommandQueue) {}

  update(world: World, context: TickContext): void {
    for (const command of this.commands.dequeueForTick(context.tick)) {
      if (command.type !== 'tank.fire') {
        continue
      }

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
      if (projectile.lifetimeTicks <= 0) {
        world.remove(entity.id)
      }
    }
  }
}
```

- [ ] **Step 4: Run GREEN**

Run: `npm run test -- src/test/tank-battle/projectile-system.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/games/tank-battle/systems/ProjectileSystem.ts src/test/tank-battle/projectile-system.test.ts
git commit -m "feat: add projectile system"
```

## Task 4: Implement Collision, Damage, and Death with TDD

**Files:**
- Create: `src/test/tank-battle/collision-damage-system.test.ts`
- Create: `src/games/tank-battle/systems/CollisionDamageSystem.ts`

- [ ] **Step 1: Write failing collision tests**

Create `collision-damage-system.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { World } from '@/engine/core/World'
import { createDefaultTransform } from '@/engine/entity/Transform'
import { CollisionDamageSystem } from '@/games/tank-battle/systems/CollisionDamageSystem'
import { createColliderTrait } from '@/games/tank-battle/traits/ColliderTrait'
import { createHealthTrait } from '@/games/tank-battle/traits/HealthTrait'
import { createProjectileTrait } from '@/games/tank-battle/traits/ProjectileTrait'

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
    expect((world.get('target').traits[0] as { hp: number }).hp).toBe(75)
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
```

- [ ] **Step 2: Run RED**

Run: `npm run test -- src/test/tank-battle/collision-damage-system.test.ts`

Expected: FAIL because `CollisionDamageSystem` does not exist.

- [ ] **Step 3: Implement CollisionDamageSystem**

Create `CollisionDamageSystem.ts`:

```ts
import type { System } from '@/engine/core/System'
import type { TickContext } from '@/engine/core/TickContext'
import type { World } from '@/engine/core/World'
import type { ColliderTrait } from '../traits/ColliderTrait'
import type { HealthTrait } from '../traits/HealthTrait'
import type { ProjectileTrait } from '../traits/ProjectileTrait'
import { getTrait } from '../utils/traitLookup'

function distanceSquared(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx
  const dz = az - bz
  return dx * dx + dz * dz
}

/**
 * 处理炮弹和可碰撞实体之间的命中、扣血和销毁。
 *
 * 第一版使用圆形碰撞，足够验证坦克大战 MVP 的战斗闭环。后续如需墙体、复杂模型
 * 或更精确命中盒，可以替换本系统内部实现，不影响外部接口。
 */
export class CollisionDamageSystem implements System {
  readonly name = 'collision-damage'

  update(world: World, _context: TickContext): void {
    const removals = new Set<string>()
    const entities = world.getAll()

    for (const projectileEntity of entities) {
      const projectile = getTrait<ProjectileTrait>(projectileEntity, 'projectile')
      const projectileCollider = getTrait<ColliderTrait>(projectileEntity, 'collider')
      if (!projectile || !projectileCollider) {
        continue
      }

      for (const target of entities) {
        if (target.id === projectile.ownerId || target.id === projectileEntity.id) {
          continue
        }

        const health = getTrait<HealthTrait>(target, 'health')
        const targetCollider = getTrait<ColliderTrait>(target, 'collider')
        if (!health || !targetCollider) {
          continue
        }

        const radius = projectileCollider.radius + targetCollider.radius
        const hit = distanceSquared(
          projectileEntity.transform.position.x,
          projectileEntity.transform.position.z,
          target.transform.position.x,
          target.transform.position.z,
        ) <= radius * radius

        if (!hit) {
          continue
        }

        health.hp -= projectile.damage
        removals.add(projectileEntity.id)
        if (health.hp <= 0) {
          health.destroyed = true
          removals.add(target.id)
        }
        break
      }
    }

    for (const id of removals) {
      if (world.has(id)) {
        world.remove(id)
      }
    }
  }
}
```

- [ ] **Step 4: Run GREEN**

Run: `npm run test -- src/test/tank-battle/collision-damage-system.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/games/tank-battle/systems/CollisionDamageSystem.ts src/test/tank-battle/collision-damage-system.test.ts
git commit -m "feat: add collision damage system"
```

## Task 5: Create Tank Battle World and Renderables

**Files:**
- Create: `src/games/tank-battle/factory/createTankBattleWorld.ts`
- Create: `src/games/tank-battle/render/createTankBattleRenderables.ts`

- [ ] **Step 1: Create world factory**

Create `createTankBattleWorld.ts`:

```ts
import { World } from '@/engine/core/World'
import { createDefaultTransform } from '@/engine/entity/Transform'
import { createColliderTrait } from '../traits/ColliderTrait'
import { createHealthTrait } from '../traits/HealthTrait'
import { createTankTrait } from '../traits/TankTrait'
import { createWeaponTrait } from '../traits/WeaponTrait'

export function createTankBattleWorld(): World {
  const world = new World()
  world.spawn({
    id: 'player',
    type: 'tank',
    transform: createDefaultTransform(),
    traits: [createTankTrait(), createWeaponTrait(), createHealthTrait(100), createColliderTrait(0.6)],
  })

  const targetTransform = createDefaultTransform()
  targetTransform.position.z = 6
  world.spawn({
    id: 'target-1',
    type: 'target',
    transform: targetTransform,
    traits: [createHealthTrait(50), createColliderTrait(0.8)],
  })

  return world
}
```

- [ ] **Step 2: Create renderable factory**

Create `createTankBattleRenderables.ts`:

```ts
import { BoxGeometry, Mesh, MeshStandardMaterial, SphereGeometry } from 'three'
import type { World } from '@/engine/core/World'
import type { RenderableRegistry } from '@/engine-three/renderer/RenderableRegistry'
import type { ThreeRenderer } from '@/engine-three/renderer/ThreeRenderer'

export function createTankBattleRenderables(
  world: World,
  registry: RenderableRegistry,
  renderer: ThreeRenderer,
): void {
  for (const entity of world.getAll()) {
    if (registry.get(entity.id)) {
      continue
    }

    const object =
      entity.type === 'projectile'
        ? new Mesh(new SphereGeometry(0.18), new MeshStandardMaterial({ color: '#ffd166' }))
        : new Mesh(
            new BoxGeometry(entity.type === 'tank' ? 1.2 : 1.4, 0.5, entity.type === 'tank' ? 1.8 : 1.4),
            new MeshStandardMaterial({ color: entity.type === 'tank' ? '#4aa3ff' : '#d45b5b' }),
          )

    renderer.scene.add(object)
    registry.set(entity.id, object)
  }

  for (const [entityId, object] of registry.entries()) {
    if (!world.has(entityId)) {
      renderer.scene.remove(object)
      registry.delete(entityId)
    }
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/games/tank-battle/factory src/games/tank-battle/render
git commit -m "feat: add tank battle world factory"
```

## Task 6: Wire GameCanvas and HUD

**Files:**
- Create: `src/games/tank-battle/ui/TankBattleHud.vue`
- Modify: `src/app/components/GameCanvas.vue`

- [ ] **Step 1: Create HUD**

Create `TankBattleHud.vue`:

```vue
<script setup lang="ts">
defineProps<{
  hp: number
  projectiles: number
  targets: number
}>()
</script>

<template>
  <div class="tank-hud">
    <el-tag type="success">HP {{ hp }}</el-tag>
    <el-tag>炮弹 {{ projectiles }}</el-tag>
    <el-tag type="danger">目标 {{ targets }}</el-tag>
  </div>
</template>

<style scoped>
.tank-hud {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
  pointer-events: none;
}
</style>
```

- [ ] **Step 2: Replace demo cube setup in GameCanvas**

Modify `GameCanvas.vue` to:

- create `CommandQueue`
- create `createTankBattleWorld()`
- install `TankControlSystem`, `ProjectileSystem`, `CollisionDamageSystem`, `RenderableSyncSystem`
- listen to `keydown` and `keyup`
- enqueue `tank.move` and `tank.fire` commands
- call `createTankBattleRenderables()` before each render
- display `TankBattleHud`

Use Chinese comments for input mapping and the temporary hard-coded arena.

- [ ] **Step 3: Run verification**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/GameCanvas.vue src/games/tank-battle/ui/TankBattleHud.vue
git commit -m "feat: wire tank battle canvas"
```

## Task 7: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run tank tests**

Run: `npm run test -- src/test/tank-battle`

Expected: PASS.

- [ ] **Step 2: Run full verification**

Run: `npm run verify`

Expected: PASS. Existing Vite bundle-size warnings are acceptable for this phase.

- [ ] **Step 3: HTTP smoke check**

Run a temporary Vite server and request `http://127.0.0.1:5173/#/game`.

Expected: HTTP 200.

- [ ] **Step 4: Commit any final fixes**

If verification required changes:

```bash
git add <changed-files>
git commit -m "fix: stabilize tank battle phase two"
```

## Self-Review

Spec coverage:

- Player tank, movement, rotation, firing, projectile movement, collision, health, death, and HUD are covered.
- AI, win/loss rules, level schema, and editor are intentionally excluded and remain later phases.
- Tests cover movement, firing, projectile expiry, collision damage, and death.

Placeholder scan:

- This plan contains no unresolved markers.

Type consistency:

- Command types are introduced before systems consume them.
- Trait names match string literals used by `getTrait`.
- Systems use existing `World`, `CommandQueue`, `System`, and `TickContext` interfaces from Phase 0-1.
