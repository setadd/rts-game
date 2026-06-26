<script setup lang="ts">
defineProps<{
  hp: number
  projectiles: number
  targets: number
}>()
</script>

<template>
  <div class="tank-hud">
    <el-tag type="success" size="large">HP {{ hp }}</el-tag>
    <el-tag size="large">炮弹 {{ projectiles }}</el-tag>
    <el-tag type="danger" size="large">目标 {{ targets }}</el-tag>
  </div>
</template>

<style scoped>
.tank-hud {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  pointer-events: none;
}
</style>
