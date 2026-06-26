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
let renderFrameId: number | undefined

onMounted(() => {
  if (!host.value) {
    return
  }

  const world = new World()
  const registry = new RenderableRegistry()
  renderer = new ThreeRenderer(host.value)

  // 这个 cube 只用于验证阶段 1 的引擎骨架：World -> System -> Three.js 渲染同步。
  // 真正的坦克、炮弹和地图对象会在后续 Tank Battle 模块中通过配置和工厂创建。
  const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: '#4aa3ff' }))
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
    renderFrameId = requestAnimationFrame(renderFrame)
  }
  renderFrameId = requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  loop?.stop()
  if (renderFrameId !== undefined) {
    cancelAnimationFrame(renderFrameId)
  }
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
