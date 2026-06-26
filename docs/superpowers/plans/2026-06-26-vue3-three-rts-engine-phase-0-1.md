# Vue3 Three RTS Engine Phase 0-1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the project foundation and minimum engine skeleton for a Vue 3 + Vite + Three.js RTS-capable engine.

**Architecture:** Create a Vue shell with a full-viewport game canvas, then implement a testable core engine that has no dependency on Three.js. Three.js lives behind an adapter layer that renders Entity state from `World`.

**Tech Stack:** Vue 3, Vite, TypeScript, Three.js, Pinia, Vitest, vue-tsc.

---

## Scope

This plan implements only Phase 0 and Phase 1 from the approved design:

- Phase 0: project scaffold, routes, app shell, scripts, typecheck, build, test setup.
- Phase 1: minimum engine skeleton: `World`, `Entity`, `Trait`, `System`, `CommandQueue`, `EventBus`, `GameLoop`, `ThreeRenderer`, and `RenderableSyncSystem`.

This plan does not implement tank combat, AI, level editing, or map JSON loading. Those need separate follow-up plans after this foundation is verified.

## File Structure

Create these files:

```text
package.json
index.html
vite.config.ts
tsconfig.json
tsconfig.node.json
src/main.ts
src/app/App.vue
src/app/styles/base.css
src/app/router/index.ts
src/app/views/HomeView.vue
src/app/views/GameView.vue
src/app/views/EditorView.vue
src/app/components/GameCanvas.vue
src/engine/entity/EntityId.ts
src/engine/entity/Transform.ts
src/engine/entity/Trait.ts
src/engine/entity/Entity.ts
src/engine/core/TickContext.ts
src/engine/core/System.ts
src/engine/core/World.ts
src/engine/core/GameLoop.ts
src/engine/command/Command.ts
src/engine/command/CommandQueue.ts
src/engine/event/EventBus.ts
src/engine-three/renderer/ThreeRenderer.ts
src/engine-three/renderer/RenderableRegistry.ts
src/engine-three/renderer/RenderableSyncSystem.ts
src/test/engine/world.test.ts
src/test/engine/command-queue.test.ts
src/test/engine/event-bus.test.ts
src/test/engine/game-loop.test.ts
src/test/engine/renderable-sync-system.test.ts
```

Responsibilities:

- `src/engine/**`: pure engine logic. No imports from `three`, Vue, browser DOM, or Pinia.
- `src/engine-three/**`: Three.js adapter layer. This is allowed to import `three`.
- `src/app/**`: Vue application shell and pages.
- `src/test/**`: Vitest tests. Engine tests must exercise real code, not mocks, except for a controlled fake scheduler in `GameLoop` tests.

## Task 1: Scaffold Vue/Vite Project Files

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json`:

```json
{
  "name": "vue3-three-rts-engine",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:engine": "vitest run src/test/engine",
    "verify": "npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "@vitejs/plugin-vue": "^5.2.1",
    "pinia": "^2.3.0",
    "three": "^0.171.0",
    "vue": "^3.5.13",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@types/three": "^0.171.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.7",
    "vitest": "^2.1.8",
    "vue-tsc": "^2.1.10"
  }
}
```

- [ ] **Step 2: Create Vite HTML entry**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 Three RTS Engine</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 3: Create Vite config**

Create `vite.config.ts`:

```ts
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 4: Create TypeScript configs**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created. If network access fails in the sandbox, rerun with approved network escalation.

- [ ] **Step 6: Run initial script checks**

Run: `npm run typecheck`

Expected: fails because `src/main.ts` does not exist yet. This confirms scripts are wired to the project entry.

- [ ] **Step 7: Commit**

If `git status --short` works in this directory, run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json
git commit -m "chore: scaffold vue three engine project"
```

If `git status --short` reports `not a git repository`, record that result in the implementation summary and continue without committing.

## Task 2: Add Vue App Shell and Routes

**Files:**
- Create: `src/main.ts`
- Create: `src/app/App.vue`
- Create: `src/app/styles/base.css`
- Create: `src/app/router/index.ts`
- Create: `src/app/views/HomeView.vue`
- Create: `src/app/views/GameView.vue`
- Create: `src/app/views/EditorView.vue`
- Create: `src/app/components/GameCanvas.vue`

- [ ] **Step 1: Create Vue entry**

Create `src/main.ts`:

```ts
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './app/App.vue'
import { router } from './app/router'
import './app/styles/base.css'

createApp(App).use(createPinia()).use(router).mount('#app')
```

- [ ] **Step 2: Create router**

Create `src/app/router/index.ts`:

```ts
import { createRouter, createWebHashHistory } from 'vue-router'
import EditorView from '../views/EditorView.vue'
import GameView from '../views/GameView.vue'
import HomeView from '../views/HomeView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/game', name: 'game', component: GameView },
    { path: '/editor', name: 'editor', component: EditorView },
  ],
})
```

- [ ] **Step 3: Create app layout**

Create `src/app/App.vue`:

```vue
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="top-bar">
      <strong>RTS Engine</strong>
      <nav>
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/game">游戏</RouterLink>
        <RouterLink to="/editor">编辑器</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
```

- [ ] **Step 4: Create base styles**

Create `src/app/styles/base.css`:

```css
* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
}

body {
  background: #101418;
  color: #e5edf5;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

a {
  color: inherit;
}

.app-shell {
  display: grid;
  grid-template-rows: 48px 1fr;
  width: 100%;
  height: 100%;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 16px;
  border-bottom: 1px solid #26313c;
  background: #151b21;
}

.top-bar nav {
  display: flex;
  gap: 12px;
}

.top-bar a {
  padding: 6px 8px;
  border-radius: 6px;
  text-decoration: none;
  color: #9fb0c0;
}

.top-bar a.router-link-active {
  color: #ffffff;
  background: #24313d;
}

.app-main {
  min-height: 0;
}

.page {
  width: 100%;
  height: 100%;
  padding: 24px;
}
```

- [ ] **Step 5: Create views**

Create `src/app/views/HomeView.vue`:

```vue
<template>
  <section class="page">
    <h1>Vue3 Three RTS Engine</h1>
    <p>第一阶段目标：完成可测试的引擎骨架和 Three.js 渲染适配层。</p>
  </section>
</template>
```

Create `src/app/views/GameView.vue`:

```vue
<script setup lang="ts">
import GameCanvas from '../components/GameCanvas.vue'
</script>

<template>
  <GameCanvas />
</template>
```

Create `src/app/views/EditorView.vue`:

```vue
<template>
  <section class="page">
    <h1>地图编辑器</h1>
    <p>编辑器将在后续计划中实现。</p>
  </section>
</template>
```

- [ ] **Step 6: Create temporary canvas placeholder**

Create `src/app/components/GameCanvas.vue`:

```vue
<template>
  <section class="game-canvas-placeholder">
    <div>
      <h1>Game Canvas</h1>
      <p>Three.js renderer will mount here in Task 8.</p>
    </div>
  </section>
</template>

<style scoped>
.game-canvas-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  background: #0f1419;
}

.game-canvas-placeholder div {
  text-align: center;
  color: #9fb0c0;
}
</style>
```

- [ ] **Step 7: Verify Vue shell**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS and `dist/` created.

- [ ] **Step 8: Commit**

If Git is available:

```bash
git add src package.json package-lock.json
git commit -m "feat: add vue app shell"
```

## Task 3: Implement Entity, Trait, and World with TDD

**Files:**
- Create: `src/test/engine/world.test.ts`
- Create: `src/engine/entity/EntityId.ts`
- Create: `src/engine/entity/Transform.ts`
- Create: `src/engine/entity/Trait.ts`
- Create: `src/engine/entity/Entity.ts`
- Create: `src/engine/core/TickContext.ts`
- Create: `src/engine/core/World.ts`

- [ ] **Step 1: Write failing World tests**

Create `src/test/engine/world.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm run test:engine -- world.test.ts`

Expected: FAIL with module resolution errors for `World` and `Entity`.

- [ ] **Step 3: Implement entity types**

Create `src/engine/entity/EntityId.ts`:

```ts
export type EntityId = string
```

Create `src/engine/entity/Transform.ts`:

```ts
export interface Vector3Like {
  x: number
  y: number
  z: number
}

export interface Transform {
  position: Vector3Like
  rotation: Vector3Like
  scale: Vector3Like
}

export function createDefaultTransform(): Transform {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  }
}
```

Create `src/engine/core/TickContext.ts`:

```ts
export interface TickContext {
  tick: number
  deltaSeconds: number
  elapsedSeconds: number
}
```

Create `src/engine/entity/Trait.ts`:

```ts
import type { TickContext } from '@/engine/core/TickContext'
import type { Entity } from './Entity'

export interface Trait {
  name: string
  onAttach?(entity: Entity): void
  onTick?(entity: Entity, context: TickContext): void
  onDispose?(entity: Entity): void
}
```

Create `src/engine/entity/Entity.ts`:

```ts
import type { Transform } from './Transform'
import type { Trait } from './Trait'
import type { EntityId } from './EntityId'

export interface Entity {
  id: EntityId
  type: string
  transform: Transform
  traits: Trait[]
}
```

- [ ] **Step 4: Implement World**

Create `src/engine/core/World.ts`:

```ts
import type { Entity } from '@/engine/entity/Entity'
import type { EntityId } from '@/engine/entity/EntityId'
import type { TickContext } from './TickContext'

export class World {
  private readonly entities = new Map<EntityId, Entity>()

  spawn(entity: Entity): void {
    if (this.entities.has(entity.id)) {
      throw new Error(`Entity already exists: ${entity.id}`)
    }

    this.entities.set(entity.id, entity)

    for (const trait of entity.traits) {
      trait.onAttach?.(entity)
    }
  }

  remove(id: EntityId): Entity {
    const entity = this.entities.get(id)
    if (!entity) {
      throw new Error(`Entity does not exist: ${id}`)
    }

    for (const trait of entity.traits) {
      trait.onDispose?.(entity)
    }

    this.entities.delete(id)
    return entity
  }

  has(id: EntityId): boolean {
    return this.entities.has(id)
  }

  get(id: EntityId): Entity {
    const entity = this.entities.get(id)
    if (!entity) {
      throw new Error(`Entity does not exist: ${id}`)
    }
    return entity
  }

  getAll(): Entity[] {
    return [...this.entities.values()]
  }

  tick(context: TickContext): void {
    for (const entity of this.entities.values()) {
      for (const trait of entity.traits) {
        trait.onTick?.(entity, context)
      }
    }
  }
}
```

- [ ] **Step 5: Verify GREEN**

Run: `npm run test:engine -- world.test.ts`

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

If Git is available:

```bash
git add src/engine src/test/engine/world.test.ts
git commit -m "feat: add world and entity model"
```

## Task 4: Implement EventBus with TDD

**Files:**
- Create: `src/test/engine/event-bus.test.ts`
- Create: `src/engine/event/EventBus.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/engine/event-bus.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { EventBus } from '@/engine/event/EventBus'

interface Events {
  'entity.spawned': { id: string }
  'match.ended': { winner: string }
}

describe('EventBus', () => {
  test('dispatches payloads to subscribers', () => {
    const bus = new EventBus<Events>()
    const received: string[] = []

    bus.on('entity.spawned', (payload) => received.push(payload.id))
    bus.emit('entity.spawned', { id: 'tank-1' })

    expect(received).toEqual(['tank-1'])
  })

  test('unsubscribes listeners', () => {
    const bus = new EventBus<Events>()
    const received: string[] = []
    const unsubscribe = bus.on('match.ended', (payload) => received.push(payload.winner))

    unsubscribe()
    bus.emit('match.ended', { winner: 'blue' })

    expect(received).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm run test:engine -- event-bus.test.ts`

Expected: FAIL because `EventBus` does not exist.

- [ ] **Step 3: Implement EventBus**

Create `src/engine/event/EventBus.ts`:

```ts
type EventMap = Record<string, unknown>
type Listener<TPayload> = (payload: TPayload) => void

export class EventBus<TEvents extends EventMap> {
  private readonly listeners = new Map<keyof TEvents, Set<Listener<TEvents[keyof TEvents]>>>()

  on<TKey extends keyof TEvents>(eventName: TKey, listener: Listener<TEvents[TKey]>): () => void {
    const listeners = this.listeners.get(eventName) ?? new Set()
    listeners.add(listener as Listener<TEvents[keyof TEvents]>)
    this.listeners.set(eventName, listeners)

    return () => {
      listeners.delete(listener as Listener<TEvents[keyof TEvents]>)
      if (listeners.size === 0) {
        this.listeners.delete(eventName)
      }
    }
  }

  emit<TKey extends keyof TEvents>(eventName: TKey, payload: TEvents[TKey]): void {
    const listeners = this.listeners.get(eventName)
    if (!listeners) {
      return
    }

    for (const listener of [...listeners]) {
      ;(listener as Listener<TEvents[TKey]>)(payload)
    }
  }
}
```

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:engine -- event-bus.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

If Git is available:

```bash
git add src/engine/event/EventBus.ts src/test/engine/event-bus.test.ts
git commit -m "feat: add typed event bus"
```

## Task 5: Implement CommandQueue with TDD

**Files:**
- Create: `src/test/engine/command-queue.test.ts`
- Create: `src/engine/command/Command.ts`
- Create: `src/engine/command/CommandQueue.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/engine/command-queue.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { CommandQueue } from '@/engine/command/CommandQueue'

describe('CommandQueue', () => {
  test('dequeues unticked commands in insertion order', () => {
    const queue = new CommandQueue()
    queue.enqueue({ id: '1', actorId: 'tank-1', type: 'move', payload: { x: 1 } })
    queue.enqueue({ id: '2', actorId: 'tank-1', type: 'fire', payload: {} })

    expect(queue.dequeueForTick(0).map((command) => command.id)).toEqual(['1', '2'])
    expect(queue.size()).toBe(0)
  })

  test('dequeues commands scheduled up to the current tick', () => {
    const queue = new CommandQueue()
    queue.enqueue({ id: 'late', actorId: 'tank-1', type: 'move', payload: {}, tick: 3 })
    queue.enqueue({ id: 'now', actorId: 'tank-1', type: 'fire', payload: {}, tick: 2 })

    expect(queue.dequeueForTick(2).map((command) => command.id)).toEqual(['now'])
    expect(queue.dequeueForTick(3).map((command) => command.id)).toEqual(['late'])
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm run test:engine -- command-queue.test.ts`

Expected: FAIL because `CommandQueue` does not exist.

- [ ] **Step 3: Implement command types**

Create `src/engine/command/Command.ts`:

```ts
import type { EntityId } from '@/engine/entity/EntityId'

export interface Command<TPayload = unknown> {
  id: string
  actorId: EntityId
  type: string
  payload: TPayload
  tick?: number
}
```

- [ ] **Step 4: Implement CommandQueue**

Create `src/engine/command/CommandQueue.ts`:

```ts
import type { Command } from './Command'

export class CommandQueue {
  private readonly commands: Command[] = []

  enqueue(command: Command): void {
    this.commands.push(command)
  }

  dequeueForTick(currentTick: number): Command[] {
    const ready: Command[] = []
    const pending: Command[] = []

    for (const command of this.commands) {
      if (command.tick === undefined || command.tick <= currentTick) {
        ready.push(command)
      } else {
        pending.push(command)
      }
    }

    this.commands.length = 0
    this.commands.push(...pending)
    return ready
  }

  size(): number {
    return this.commands.length
  }
}
```

- [ ] **Step 5: Verify GREEN**

Run: `npm run test:engine -- command-queue.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

If Git is available:

```bash
git add src/engine/command src/test/engine/command-queue.test.ts
git commit -m "feat: add command queue"
```

## Task 6: Implement System and GameLoop with TDD

**Files:**
- Create: `src/test/engine/game-loop.test.ts`
- Create: `src/engine/core/System.ts`
- Create: `src/engine/core/GameLoop.ts`

- [ ] **Step 1: Write failing GameLoop tests**

Create `src/test/engine/game-loop.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { GameLoop } from '@/engine/core/GameLoop'
import type { System } from '@/engine/core/System'
import { World } from '@/engine/core/World'

class ManualScheduler {
  private frame: ((timestamp: number) => void) | undefined

  requestFrame(callback: (timestamp: number) => void): number {
    this.frame = callback
    return 1
  }

  cancelFrame(): void {
    this.frame = undefined
  }

  step(timestamp: number): void {
    this.frame?.(timestamp)
  }
}

describe('GameLoop', () => {
  test('ticks systems at a fixed rate', () => {
    const world = new World()
    const scheduler = new ManualScheduler()
    const ticks: number[] = []
    const system: System = {
      name: 'recorder',
      update: (_world, context) => ticks.push(context.tick),
    }
    const loop = new GameLoop(world, [system], {
      tickRate: 30,
      maxCatchUpTicks: 5,
      requestFrame: scheduler.requestFrame.bind(scheduler),
      cancelFrame: scheduler.cancelFrame.bind(scheduler),
    })

    loop.start()
    scheduler.step(0)
    scheduler.step(34)
    scheduler.step(67)

    expect(ticks).toEqual([1, 2])
  })

  test('stops scheduling frames after stop', () => {
    const world = new World()
    const scheduler = new ManualScheduler()
    const ticks: number[] = []
    const loop = new GameLoop(world, [{
      name: 'recorder',
      update: (_world, context) => ticks.push(context.tick),
    }], {
      tickRate: 30,
      maxCatchUpTicks: 5,
      requestFrame: scheduler.requestFrame.bind(scheduler),
      cancelFrame: scheduler.cancelFrame.bind(scheduler),
    })

    loop.start()
    loop.stop()
    scheduler.step(34)

    expect(ticks).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm run test:engine -- game-loop.test.ts`

Expected: FAIL because `GameLoop` and `System` do not exist.

- [ ] **Step 3: Implement System interface**

Create `src/engine/core/System.ts`:

```ts
import type { World } from './World'
import type { TickContext } from './TickContext'

export interface System {
  name: string
  update(world: World, context: TickContext): void
}
```

- [ ] **Step 4: Implement GameLoop**

Create `src/engine/core/GameLoop.ts`:

```ts
import type { System } from './System'
import type { World } from './World'

interface GameLoopOptions {
  tickRate: number
  maxCatchUpTicks: number
  requestFrame?: (callback: (timestamp: number) => void) => number
  cancelFrame?: (handle: number) => void
}

export class GameLoop {
  private readonly tickMillis: number
  private readonly requestFrame: (callback: (timestamp: number) => void) => number
  private readonly cancelFrame: (handle: number) => void
  private running = false
  private frameHandle: number | undefined
  private lastTimestamp: number | undefined
  private accumulatedMillis = 0
  private tick = 0

  constructor(
    private readonly world: World,
    private readonly systems: System[],
    private readonly options: GameLoopOptions,
  ) {
    this.tickMillis = 1000 / options.tickRate
    this.requestFrame = options.requestFrame ?? requestAnimationFrame
    this.cancelFrame = options.cancelFrame ?? cancelAnimationFrame
  }

  start(): void {
    if (this.running) {
      return
    }

    this.running = true
    this.lastTimestamp = undefined
    this.accumulatedMillis = 0
    this.frameHandle = this.requestFrame(this.frame)
  }

  stop(): void {
    this.running = false
    if (this.frameHandle !== undefined) {
      this.cancelFrame(this.frameHandle)
      this.frameHandle = undefined
    }
  }

  private readonly frame = (timestamp: number): void => {
    if (!this.running) {
      return
    }

    if (this.lastTimestamp === undefined) {
      this.lastTimestamp = timestamp
      this.frameHandle = this.requestFrame(this.frame)
      return
    }

    this.accumulatedMillis += timestamp - this.lastTimestamp
    this.lastTimestamp = timestamp

    let catchUpTicks = 0
    while (this.accumulatedMillis >= this.tickMillis && catchUpTicks < this.options.maxCatchUpTicks) {
      this.tick += 1
      const context = {
        tick: this.tick,
        deltaSeconds: this.tickMillis / 1000,
        elapsedSeconds: (this.tick * this.tickMillis) / 1000,
      }

      this.world.tick(context)
      for (const system of this.systems) {
        system.update(this.world, context)
      }

      this.accumulatedMillis -= this.tickMillis
      catchUpTicks += 1
    }

    this.frameHandle = this.requestFrame(this.frame)
  }
}
```

- [ ] **Step 5: Verify GREEN**

Run: `npm run test:engine -- game-loop.test.ts`

Expected: PASS.

- [ ] **Step 6: Run all engine tests**

Run: `npm run test:engine`

Expected: PASS.

- [ ] **Step 7: Commit**

If Git is available:

```bash
git add src/engine/core src/test/engine/game-loop.test.ts
git commit -m "feat: add fixed tick game loop"
```

## Task 7: Implement Three Renderer and Renderable Registry

**Files:**
- Create: `src/engine-three/renderer/ThreeRenderer.ts`
- Create: `src/engine-three/renderer/RenderableRegistry.ts`

- [ ] **Step 1: Create RenderableRegistry**

Create `src/engine-three/renderer/RenderableRegistry.ts`:

```ts
import type { Object3D } from 'three'
import type { EntityId } from '@/engine/entity/EntityId'

export class RenderableRegistry {
  private readonly objects = new Map<EntityId, Object3D>()

  set(entityId: EntityId, object: Object3D): void {
    this.objects.set(entityId, object)
  }

  get(entityId: EntityId): Object3D | undefined {
    return this.objects.get(entityId)
  }

  delete(entityId: EntityId): void {
    this.objects.delete(entityId)
  }

  entries(): Array<[EntityId, Object3D]> {
    return [...this.objects.entries()]
  }
}
```

- [ ] **Step 2: Create ThreeRenderer**

Create `src/engine-three/renderer/ThreeRenderer.ts`:

```ts
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'

export class ThreeRenderer {
  readonly scene = new Scene()
  readonly camera = new PerspectiveCamera(60, 1, 0.1, 1000)
  readonly renderer: WebGLRenderer

  constructor(private readonly host: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(new Color('#0f1419'))
    this.host.appendChild(this.renderer.domElement)

    this.camera.position.set(8, 8, 8)
    this.camera.lookAt(0, 0, 0)

    const ambient = new AmbientLight('#ffffff', 0.5)
    const sun = new DirectionalLight('#ffffff', 1.2)
    sun.position.set(5, 8, 4)
    this.scene.add(ambient, sun)

    const ground = new Mesh(
      new BoxGeometry(12, 0.2, 12),
      new MeshStandardMaterial({ color: '#2d5a3f' }),
    )
    ground.position.y = -0.1
    this.scene.add(ground)

    this.resize()
  }

  resize(): void {
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 4: Commit**

If Git is available:

```bash
git add src/engine-three/renderer
git commit -m "feat: add three renderer adapter"
```

## Task 8: Implement RenderableSyncSystem with TDD

**Files:**
- Create: `src/test/engine/renderable-sync-system.test.ts`
- Create: `src/engine-three/renderer/RenderableSyncSystem.ts`

- [ ] **Step 1: Write failing render sync test**

Create `src/test/engine/renderable-sync-system.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm run test:engine -- renderable-sync-system.test.ts`

Expected: FAIL because `RenderableSyncSystem` does not exist.

- [ ] **Step 3: Implement RenderableSyncSystem**

Create `src/engine-three/renderer/RenderableSyncSystem.ts`:

```ts
import type { System } from '@/engine/core/System'
import type { TickContext } from '@/engine/core/TickContext'
import type { World } from '@/engine/core/World'
import type { RenderableRegistry } from './RenderableRegistry'

export class RenderableSyncSystem implements System {
  readonly name = 'renderable-sync'

  constructor(private readonly registry: RenderableRegistry) {}

  update(world: World, _context: TickContext): void {
    for (const entity of world.getAll()) {
      const object = this.registry.get(entity.id)
      if (!object) {
        continue
      }

      object.position.set(
        entity.transform.position.x,
        entity.transform.position.y,
        entity.transform.position.z,
      )
      object.rotation.set(
        entity.transform.rotation.x,
        entity.transform.rotation.y,
        entity.transform.rotation.z,
      )
      object.scale.set(
        entity.transform.scale.x,
        entity.transform.scale.y,
        entity.transform.scale.z,
      )
    }
  }
}
```

- [ ] **Step 4: Verify GREEN**

Run: `npm run test:engine -- renderable-sync-system.test.ts`

Expected: PASS.

- [ ] **Step 5: Run all engine tests**

Run: `npm run test:engine`

Expected: PASS.

- [ ] **Step 6: Commit**

If Git is available:

```bash
git add src/engine-three/renderer/RenderableSyncSystem.ts src/test/engine/renderable-sync-system.test.ts
git commit -m "feat: sync entity transforms to three objects"
```

## Task 9: Mount Three.js Renderer in GameCanvas

**Files:**
- Modify: `src/app/components/GameCanvas.vue`

- [ ] **Step 1: Replace placeholder with renderer mount**

Modify `src/app/components/GameCanvas.vue`:

```vue
<script setup lang="ts">
import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { GameLoop } from '@/engine/core/GameLoop'
import { World } from '@/engine/core/World'
import { createDefaultTransform } from '@/engine/entity/Transform'
import { RenderableRegistry } from '@/engine-three/renderer/RenderableRegistry'
import { RenderableSyncSystem } from '@/engine-three/renderer/RenderableSyncSystem'
import { ThreeRenderer } from '@/engine-three/renderer/ThreeRenderer'

const host = ref<HTMLElement | null>(null)

let renderer: ThreeRenderer | undefined
let loop: GameLoop | undefined

onMounted(() => {
  if (!host.value) {
    return
  }

  const world = new World()
  const registry = new RenderableRegistry()
  renderer = new ThreeRenderer(host.value)

  const cube = new Mesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ color: '#4aa3ff' }),
  )
  renderer.scene.add(cube)

  world.spawn({
    id: 'demo-cube',
    type: 'demo',
    transform: createDefaultTransform(),
    traits: [
      {
        name: 'spin',
        onTick(entity, context) {
          entity.transform.rotation.y += context.deltaSeconds
        },
      },
    ],
  })
  registry.set('demo-cube', cube)

  loop = new GameLoop(world, [new RenderableSyncSystem(registry)], {
    tickRate: 30,
    maxCatchUpTicks: 5,
  })
  loop.start()

  const renderFrame = () => {
    if (!renderer) {
      return
    }
    renderer.resize()
    renderer.render()
    requestAnimationFrame(renderFrame)
  }
  requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  loop?.stop()
  renderer?.dispose()
})
</script>

<template>
  <section ref="host" class="game-canvas" />
</template>

<style scoped>
.game-canvas {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0f1419;
}

.game-canvas :deep(canvas) {
  display: block;
}
</style>
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

If Git is available:

```bash
git add src/app/components/GameCanvas.vue
git commit -m "feat: mount three renderer in game view"
```

## Task 10: Final Verification for Phase 0-1

**Files:**
- No new files.

- [ ] **Step 1: Run engine tests**

Run: `npm run test:engine`

Expected: all tests PASS.

- [ ] **Step 2: Run full verification**

Run: `npm run verify`

Expected: `typecheck`, `test`, and `build` all PASS.

- [ ] **Step 3: Optional browser smoke check**

Run: `npm run dev`

Open: `http://127.0.0.1:5173/#/game`

Expected: the page shows a nonblank Three.js scene with a green ground and a rotating blue cube.

- [ ] **Step 4: Record implementation summary**

Record these results in the final response:

```text
npm run test:engine: PASS
npm run verify: PASS
browser smoke: PASS or not run
git commit status: committed or skipped because directory is not a valid Git repository
```

## Self-Review

Spec coverage:

- Project scaffold maps to Phase 0.
- Vue routes and canvas page map to the app shell requirement.
- `World`, `Entity`, `Trait`, `System`, `CommandQueue`, `EventBus`, and `GameLoop` map to Phase 1 engine skeleton.
- `ThreeRenderer`, `RenderableRegistry`, and `RenderableSyncSystem` map to the Three adapter requirement.
- TDD and `verify` scripts map to the automated testing requirement.

Known follow-up plans:

- Phase 2: tank movement, firing, projectile, collision, health, HUD.
- Phase 3: bot AI and win/loss rules.
- Phase 4: level schema, loader, validator, runtime builder.
- Phase 5: map and level editor.

Placeholder scan:

- This plan contains no unresolved markers or unspecified implementation steps.

Type consistency:

- `EntityId`, `Entity`, `Transform`, `Trait`, `TickContext`, `System`, `World`, `Command`, `CommandQueue`, `EventBus`, `GameLoop`, `RenderableRegistry`, `RenderableSyncSystem`, and `ThreeRenderer` names are introduced before later usage.
