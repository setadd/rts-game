# RTS Game Engine

基于 Vue 3、Element Plus、Vite、TypeScript 和 Three.js 的 Web 3D 游戏引擎实验项目。

当前目标不是一次性复刻完整红色警戒，而是先用 `3D 坦克大战` 验证引擎框架：固定 tick、命令队列、Entity/Trait、System、Three.js 渲染适配、HUD 和自动测试。

## 当前进度

- 已完成基础工程、路由、Element Plus 页面框架。
- 已完成引擎核心：`World`、`Entity`、`Trait`、`System`、`GameLoop`、`CommandQueue`、`EventBus`。
- 已完成 Three.js 适配层：`ThreeRenderer`、`RenderableRegistry`、`RenderableSyncSystem`。
- 已完成坦克大战核心闭环：移动、转向、开火、炮弹飞行、碰撞、扣血、目标销毁、HUD。

## 文档

- [游戏引擎设计文档](docs/engine-design.md)
- [游戏引擎使用文档](docs/engine-usage.md)
- [工业级 RTS 游戏引擎分析、对比与演进计划](docs/industrial-rts-engine-analysis.md)
- [阶段设计与计划](docs/superpowers/)

## 快速开始

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址后进入 `游戏` 页面。

## 常用命令

```bash
npm run typecheck
npm run test
npm run test:engine
npm run build
npm run verify
```

`npm run verify` 会依次执行类型检查、单元测试和生产构建，是提交前的主验证命令。
