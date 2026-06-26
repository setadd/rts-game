# 游戏引擎使用文档

## 1. 环境要求

- Node.js：建议使用本机已安装的 Node 环境。
- npm：随 Node.js 安装。
- 浏览器：支持 WebGL 的现代浏览器。

项目依赖已记录在 `package.json` 和 `package-lock.json` 中。

## 2. 安装依赖

```bash
npm install
```

如果依赖已经安装过，可以直接运行开发服务器。

## 3. 启动开发服务器

```bash
npm run dev
```

Vite 会输出本地访问地址，通常是：

```text
http://127.0.0.1:5173/
```

打开页面后点击顶部导航的 `游戏`，进入当前坦克大战场景。

## 4. 游戏操作

当前可玩场景是 Phase 2 的坦克大战核心验证版。

| 操作 | 按键 |
| --- | --- |
| 前进 | `W` |
| 后退 | `S` |
| 左转 | `A` |
| 右转 | `D` |
| 开火 | `Space` |

HUD 会显示：

- `HP`：玩家坦克生命值。
- `炮弹`：当前场上炮弹数量。
- `目标`：当前场上剩余目标数量。

当前阶段还没有 AI、胜负结算、关卡编辑器和地图 JSON 加载。

## 5. 常用脚本

```bash
npm run typecheck
```

执行 TypeScript 和 Vue 类型检查。

```bash
npm run test
```

执行全部 Vitest 测试。

```bash
npm run test:engine
```

只执行引擎核心测试。

```bash
npm run build
```

执行生产构建。

```bash
npm run verify
```

提交前主验证命令，等价于：

```bash
npm run typecheck && npm run test && npm run build
```

## 6. 目录说明

```text
src/
  app/                 Vue 应用、路由、页面和画布组件
  engine/              渲染无关的游戏引擎核心
  engine-three/        Three.js 渲染适配层
  games/tank-battle/   坦克大战玩法验证模块
  test/                Vitest 测试
docs/
  engine-design.md     引擎设计文档
  engine-usage.md      引擎使用文档
  superpowers/         阶段方案和执行计划
```

## 7. 如何新增一种 Trait

Trait 用来表达实体状态或能力。新增 Trait 时建议放在具体游戏模块下，例如：

```text
src/games/tank-battle/traits/TeamTrait.ts
```

示例：

```ts
import type { Trait } from '@/engine/entity/Trait'

export interface TeamTrait extends Trait {
  name: 'team'
  teamId: 'player' | 'enemy'
}

export function createTeamTrait(teamId: TeamTrait['teamId']): TeamTrait {
  return {
    name: 'team',
    teamId,
  }
}
```

使用规则：

- `name` 使用稳定字符串，系统通过它查找 Trait。
- Trait 保存状态，不要直接依赖 Three.js。
- 如果 Trait 需要生命周期钩子，可以实现 `onAttach`、`onTick`、`onDispose`。

## 8. 如何新增一个 System

System 用来处理每个固定 tick 中的跨实体逻辑。

示例：

```ts
import type { System } from '@/engine/core/System'
import type { TickContext } from '@/engine/core/TickContext'
import type { World } from '@/engine/core/World'

export class ExampleSystem implements System {
  readonly name = 'example'

  update(world: World, context: TickContext): void {
    for (const entity of world.getAll()) {
      // 在这里读取 Trait，并根据固定 tick 修改模拟状态。
      // System 不应该直接创建或操作 Three.js Mesh。
      void entity
      void context
    }
  }
}
```

注册位置当前在：

```text
src/app/components/GameCanvas.vue
```

示例：

```ts
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
```

新增 gameplay 系统时，通常应放在 `RenderableSyncSystem` 之前，让渲染同步拿到本 tick 的最终 transform。

## 9. 如何新增命令

命令负载类型放在：

```text
src/games/tank-battle/commands/TankCommands.ts
```

示例：

```ts
export interface TankFirePayload {
  requestId: string
}
```

写入命令：

```ts
commands.enqueue({
  id: 'fire-1',
  actorId: 'player',
  type: 'tank.fire',
  payload: { requestId: 'shot-1' },
})
```

消费命令时使用 predicate，避免拿走其它系统的命令：

```ts
for (const command of commands.dequeueForTick(
  context.tick,
  (queuedCommand) => queuedCommand.type === 'tank.fire',
)) {
  // 只处理 tank.fire
}
```

## 10. 如何新增实体

当前测试战场由以下文件创建：

```text
src/games/tank-battle/factory/createTankBattleWorld.ts
```

新增实体示例：

```ts
const transform = createDefaultTransform()
transform.position.x = 2
transform.position.z = 6

world.spawn({
  id: 'target-4',
  type: 'target',
  transform,
  traits: [createHealthTrait(50), createColliderTrait(0.8)],
})
```

注意：

- `id` 必须唯一。
- `type` 会被渲染工厂用于选择 Mesh。
- gameplay 状态通过 traits 表达。

## 11. 如何新增渲染对象

渲染对象创建逻辑在：

```text
src/games/tank-battle/render/createTankBattleRenderables.ts
```

新增实体类型时，需要在这里补对应 Three.js 对象。

原则：

- gameplay 系统只创建 Entity，不创建 Mesh。
- 渲染工厂根据 `entity.type` 创建 `Object3D`。
- 有高度偏移的模型建议用 `Group` 包起来，把偏移放在子 Mesh 上，避免 `RenderableSyncSystem` 覆盖位置。

## 12. 如何写测试

核心玩法测试放在：

```text
src/test/tank-battle/
```

引擎测试放在：

```text
src/test/engine/
```

推荐测试方式：

1. 创建真实 `World`。
2. 创建必要实体和 Trait。
3. 如需输入，创建真实 `CommandQueue` 并写入命令。
4. 实例化目标 System。
5. 手动调用 `system.update(world, context)`。
6. 断言 World 中的实体状态变化。

示例：

```ts
new TankControlSystem(commands).update(world, {
  tick: 1,
  deltaSeconds: 1,
  elapsedSeconds: 1,
})
```

这种测试不依赖浏览器，也不依赖 Three.js，反馈速度快。

## 13. 开发约定

- 核心逻辑优先 TDD。
- 新增玩法规则时，把规则放进 System，不要写进 Vue 组件。
- 新增实体能力时，优先新增 Trait，而不是扩大 Entity 类型。
- Vue 组件只负责输入、HUD、编辑器和页面组织。
- Three.js 只放在 `src/engine-three` 或具体玩法的 `render/` 目录。
- 中文注释用于解释设计意图、边界和非显而易见的逻辑，不写重复语法说明。

## 14. 常见问题

### 页面能打开，但 HUD 显示为 0

优先查看浏览器控制台。此前出现过 `requestAnimationFrame` 调用者绑定错误，已在 `GameLoop` 中修复并补了回归测试。

### 构建时提示 chunk 过大

当前 Element Plus 和 Three.js 会让主包偏大。Phase 2 可接受。后续可以通过路由懒加载、手动分包和按需组件优化。

### 为什么核心逻辑不直接使用 Three.js Vector3

核心逻辑需要可测试、可回放、可迁移。直接依赖 Three.js 会让模拟层和渲染层耦合，后续 AI、编辑器、服务端模拟和联机同步都会变困难。

### 为什么输入要先变成命令

命令模型可以统一玩家输入、AI、回放和未来网络同步。如果 UI 直接改实体状态，后续很难做确定性测试和回放。

## 15. 下一阶段建议

建议下一阶段实现 `人机对战 MVP`：

- 增加 `TeamTrait` 和 `BotTrait`。
- 增加 AI 状态机：巡逻、追击、攻击。
- 增加胜负判断系统。
- 增加 AI 行为测试和完整战斗 debug 脚本。

完成后再进入地图 JSON 和关卡编辑器阶段。
