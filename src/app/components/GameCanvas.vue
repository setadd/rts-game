<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { CommandQueue } from '@/engine/command/CommandQueue'
import { GameLoop } from '@/engine/core/GameLoop'
import type { World } from '@/engine/core/World'
import { RenderableRegistry } from '@/engine-three/renderer/RenderableRegistry'
import { RenderableSyncSystem } from '@/engine-three/renderer/RenderableSyncSystem'
import { ThreeRenderer } from '@/engine-three/renderer/ThreeRenderer'
import { createTankBattleWorld } from '@/games/tank-battle/factory/createTankBattleWorld'
import { createTankBattleRenderables } from '@/games/tank-battle/render/createTankBattleRenderables'
import { CollisionDamageSystem } from '@/games/tank-battle/systems/CollisionDamageSystem'
import { ProjectileSystem } from '@/games/tank-battle/systems/ProjectileSystem'
import { TankControlSystem } from '@/games/tank-battle/systems/TankControlSystem'
import type { HealthTrait } from '@/games/tank-battle/traits/HealthTrait'
import { getTrait } from '@/games/tank-battle/utils/traitLookup'
import TankBattleHud from '@/games/tank-battle/ui/TankBattleHud.vue'

const host = ref<HTMLElement | null>(null)
const hp = ref(0)
const projectiles = ref(0)
const targets = ref(0)

let renderer: ThreeRenderer | undefined
let loop: GameLoop | undefined
let renderFrameId: number | undefined
let world: World | undefined
let commands: CommandQueue | undefined
let registry: RenderableRegistry | undefined
let commandSequence = 0

const pressedKeys = new Set<string>()

function nextCommandId(prefix: string): string {
  commandSequence += 1
  return `${prefix}-${commandSequence}`
}

function readAxisInput(): { move: number; turn: number } {
  const moveForward = pressedKeys.has('KeyW') ? 1 : 0
  const moveBackward = pressedKeys.has('KeyS') ? 1 : 0
  const turnLeft = pressedKeys.has('KeyA') ? 1 : 0
  const turnRight = pressedKeys.has('KeyD') ? 1 : 0

  return {
    move: moveForward - moveBackward,
    turn: turnLeft - turnRight,
  }
}

function enqueueMoveCommand(): void {
  if (!commands || !world?.has('player')) {
    return
  }

  // 键盘状态只在 Vue 层汇总，模拟层仍然只接收命令；后续 AI 或联网输入可以复用同一条路径。
  commands.enqueue({
    id: nextCommandId('move'),
    actorId: 'player',
    type: 'tank.move',
    payload: readAxisInput(),
  })
}

function enqueueFireCommand(): void {
  if (!commands || !world?.has('player')) {
    return
  }

  commands.enqueue({
    id: nextCommandId('fire'),
    actorId: 'player',
    type: 'tank.fire',
    payload: { requestId: nextCommandId('shot') },
  })
}

function handleKeyDown(event: KeyboardEvent): void {
  if (!['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) {
    return
  }

  event.preventDefault()

  if (event.code === 'Space') {
    if (!event.repeat) {
      enqueueFireCommand()
    }
    return
  }

  pressedKeys.add(event.code)
  enqueueMoveCommand()
}

function handleKeyUp(event: KeyboardEvent): void {
  if (!['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
    return
  }

  event.preventDefault()
  pressedKeys.delete(event.code)
  enqueueMoveCommand()
}

function updateHud(): void {
  if (!world) {
    return
  }

  const player = world.has('player') ? world.get('player') : undefined
  const playerHealth = player ? getTrait<HealthTrait>(player, 'health') : undefined

  hp.value = Math.max(0, Math.round(playerHealth?.hp ?? 0))
  projectiles.value = world.getAll().filter((entity) => entity.type === 'projectile').length
  targets.value = world.getAll().filter((entity) => entity.type === 'target').length
}

onMounted(() => {
  if (!host.value) {
    return
  }

  world = createTankBattleWorld()
  commands = new CommandQueue()
  registry = new RenderableRegistry()
  renderer = new ThreeRenderer(host.value)

  createTankBattleRenderables(world, registry, renderer)
  updateHud()

  loop = new GameLoop(
    world,
    [
      new TankControlSystem(commands),
      new ProjectileSystem(commands),
      new CollisionDamageSystem(),
      new RenderableSyncSystem(registry),
    ],
    {
      tickRate: 30,
      maxCatchUpTicks: 5,
    },
  )
  loop.start()

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  const renderFrame = () => {
    if (!world || !registry || !renderer) {
      return
    }

    // 炮弹和被击毁目标会在固定 tick 中增删，这里在渲染帧里补齐或清理 Three.js 对象。
    createTankBattleRenderables(world, registry, renderer)
    updateHud()
    renderer.resize()
    renderer.render()
    renderFrameId = requestAnimationFrame(renderFrame)
  }
  renderFrameId = requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  loop?.stop()
  if (renderFrameId !== undefined) {
    cancelAnimationFrame(renderFrameId)
  }
  renderer?.dispose()
})
</script>

<template>
  <section ref="host" class="game-canvas" tabindex="0">
    <TankBattleHud :hp="hp" :projectiles="projectiles" :targets="targets" />
  </section>
</template>

<style scoped>
.game-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0f1419;
  outline: none;
}

.game-canvas :deep(canvas) {
  display: block;
}
</style>
