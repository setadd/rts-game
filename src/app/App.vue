<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="top-bar">
      <strong>RTS Engine</strong>
      <nav>
        <RouterLink to="/">
          <el-button text>首页</el-button>
        </RouterLink>
        <RouterLink to="/game">
          <el-button text>游戏</el-button>
        </RouterLink>
        <RouterLink to="/editor">
          <el-button text>编辑器</el-button>
        </RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
