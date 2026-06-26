# Vue3 + Three.js RTS Engine 技术方案

## 1. 背景与目标

本方案设计一个基于 `Vue 3 + Vite + TypeScript + Three.js` 的 Web 3D 游戏引擎框架。长期目标是具备复刻红色警戒类 RTS 游戏的能力，但第一阶段不直接复刻红警，而是先实现一个可运行、可验证、可扩展的 `3D 坦克大战 MVP+`。

第一阶段 MVP+ 必须支持：

- 3D 坦克对战核心玩法。
- 玩家与 AI 人机对战。
- 地图与关卡编辑器。
- 关卡 JSON 保存、加载、运行时测试。
- 引擎核心逻辑与 Three.js 渲染层解耦。
- 后续可自然演进到 RTS 的单位、命令、寻路、阵营、地图、战争迷雾、生产和资源系统。

`D:\codeX\workspaces\redlater` 作为架构参考，不直接照搬其 React UI、红警资源解析和 2D/等距渲染管线。重点参考其工程思想：固定 tick、逻辑与渲染分离、World 对象管理、Trait 组合能力、Order/Action 命令系统、事件总线、地图和规则配置驱动。

## 2. 技术栈

- 前端框架：`Vue 3`
- 构建工具：`Vite`
- 语言：`TypeScript`
- 3D 渲染：`Three.js`
- 状态管理：`Pinia`，仅用于 UI、编辑器和菜单状态，不承载核心游戏模拟
- 测试：`Vitest`，优先测试核心逻辑、关卡解析、命令系统和 AI 行为
- 端到端验证：后续可接入 `Playwright`，用于验证页面运行、编辑器保存加载和 Demo 可玩性

## 3. 总体架构

引擎采用 `Actor/Trait + System` 混合架构。

- `Actor/Entity` 表示游戏对象，例如坦克、炮弹、墙体、出生点、装饰物。
- `Trait` 表示对象能力，例如生命、武器、移动、碰撞、阵营、AI 控制。
- `System` 表示跨对象处理逻辑，例如移动系统、碰撞系统、炮弹系统、AI 系统、渲染同步系统。
- `Command` 表示玩家输入、AI 决策或未来网络同步中的意图，例如移动、开火、停止、攻击目标。

高层结构：

```text
Vue App
  ├─ App.vue
  ├─ 路由、菜单、HUD、调试面板
  └─ GameCanvas.vue

Engine Core
  ├─ GameLoop
  ├─ World
  ├─ Entity / Trait
  ├─ System
  ├─ CommandQueue
  ├─ EventBus
  ├─ ResourceLoader
  ├─ SceneManager
  └─ Math / Time / Random

Three Adapter
  ├─ ThreeRenderer
  ├─ CameraController
  ├─ RenderableRegistry
  ├─ RenderableSyncSystem
  ├─ EffectsSystem
  └─ DebugDraw

Tank Battle Game
  ├─ 坦克、炮弹、武器、AI、胜负规则
  ├─ 地图加载器
  ├─ 地图编辑器
  └─ 关卡 JSON

Future RTS Layer
  ├─ 选择框、单位编队、右键命令
  ├─ 网格地图、A* 寻路
  ├─ 建筑、生产、资源、科技树
  ├─ 战争迷雾、小地图
  └─ 确定性 lockstep 联机
```

## 4. 核心设计原则

### 4.1 逻辑层不依赖 Three.js

核心模拟层不能直接引用 `THREE.Mesh`、`THREE.Scene`、`THREE.Camera` 等对象。逻辑层只表达位置、旋转、速度、生命、阵营、命令、碰撞、武器、AI 状态。

Three.js 只作为渲染适配层读取逻辑状态并同步表现对象。这样后续可以单独测试核心逻辑，也方便未来做回放、锁步联机、服务端模拟或替换渲染层。

### 4.2 固定 tick 驱动核心模拟

游戏逻辑使用固定 tick，例如 30 tick/s 或 60 tick/s。渲染层使用 `requestAnimationFrame`，通过插值平滑显示。

固定 tick 解决三个问题：

- AI、碰撞、武器冷却等逻辑行为稳定。
- 后续支持回放和确定性调试。
- 为 RTS lockstep 联机预留基础。

### 4.3 命令驱动行为

玩家输入和 AI 决策不直接修改对象状态，而是生成命令：

```ts
interface Command {
  id: string
  actorId: EntityId
  type: string
  payload: unknown
  tick?: number
}
```

坦克大战中先使用：

- `MoveCommand`
- `AimCommand`
- `FireCommand`
- `StopCommand`

后续 RTS 可扩展：

- `SelectCommand`
- `MoveToCommand`
- `AttackCommand`
- `AttackMoveCommand`
- `BuildCommand`
- `ProduceCommand`
- `GatherCommand`

### 4.4 配置驱动对象与关卡

坦克、武器、关卡、AI 参数尽量使用 JSON 配置。第一阶段不做复杂脚本系统，但保留配置扩展口。

示例：

```json
{
  "id": "light-tank",
  "name": "轻型坦克",
  "maxHp": 100,
  "moveSpeed": 6,
  "turnSpeed": 180,
  "weaponId": "basic-cannon",
  "viewRange": 18
}
```

## 5. 推荐目录结构

```text
src/
  app/
    App.vue
    router/
    stores/
    styles/

  engine/
    core/
      Game.ts
      GameLoop.ts
      World.ts
      System.ts
      TickContext.ts
    entity/
      Entity.ts
      EntityId.ts
      Transform.ts
      Trait.ts
    command/
      Command.ts
      CommandQueue.ts
      CommandProcessor.ts
    event/
      EventBus.ts
      GameEvents.ts
    resource/
      ResourceLoader.ts
      JsonLoader.ts
    scene/
      SceneManager.ts
      GameScene.ts
    math/
      Vector2.ts
      Grid.ts
      Random.ts

  engine-three/
    renderer/
      ThreeRenderer.ts
      RenderableRegistry.ts
      RenderableSyncSystem.ts
    camera/
      CameraController.ts
      TankBattleCamera.ts
      RtsCamera.ts
    effects/
      EffectsSystem.ts
      ExplosionEffect.ts
    debug/
      DebugDraw.ts
      DebugStats.ts

  games/
    tank-battle/
      TankBattleGame.ts
      TankBattleGameMode.ts
      TankBattleMatch.ts
      config/
        tanks.json
        weapons.json
        levels/
          demo-level.json
      traits/
        TankTrait.ts
        HealthTrait.ts
        WeaponTrait.ts
        ProjectileTrait.ts
        ColliderTrait.ts
        TeamTrait.ts
        BotTrait.ts
      systems/
        PlayerControlSystem.ts
        BotAiSystem.ts
        MovementSystem.ts
        ProjectileSystem.ts
        CollisionSystem.ts
        DamageSystem.ts
        WinConditionSystem.ts
      level/
        LevelSchema.ts
        LevelLoader.ts
        LevelRuntimeBuilder.ts
      editor/
        MapEditor.vue
        EditorState.ts
        EditorTools.ts
        MapSerializer.ts
        MapValidator.ts
      ui/
        TankBattleHud.vue
        DebugPanel.vue

  test/
    engine/
      world.test.ts
      command-queue.test.ts
      game-loop.test.ts
      level-loader.test.ts
    tank-battle/
      movement-system.test.ts
      projectile-system.test.ts
      collision-system.test.ts
      bot-ai-system.test.ts
      win-condition-system.test.ts
      map-validator.test.ts

  scripts/
    smoke-game-flow.ts
    smoke-editor-flow.ts
    debug-tank-battle-flow.ts
    debug-level-editor-flow.ts
```

## 6. 引擎核心模块

### 6.1 GameLoop

职责：

- 管理启动、暂停、恢复、销毁。
- 使用固定 tick 更新核心逻辑。
- 调用渲染层 update/render。
- 计算渲染插值 `interpolation`。
- 捕获 update/render 异常并进入错误状态。

接口草案：

```ts
interface GameLoopOptions {
  tickRate: number
  maxCatchUpTicks: number
}

class GameLoop {
  start(): void
  stop(): void
  pause(): void
  resume(): void
}
```

### 6.2 World

职责：

- 管理 Entity 生命周期。
- 提供按 id、类型、trait、空间范围查询。
- 分发 spawn/remove 事件。
- 为系统提供稳定的实体访问入口。

第一阶段可先使用 Map 存储，后续加入空间索引。

### 6.3 Entity / Trait

Entity 是轻量对象，Trait 承载能力和状态。

基础 Trait：

- `TransformTrait` 或直接内置 `transform`
- `RenderableTrait`
- `ColliderTrait`
- `HealthTrait`
- `TeamTrait`
- `TankTrait`
- `WeaponTrait`
- `ProjectileTrait`
- `BotTrait`

### 6.4 System

System 处理每 tick 的跨对象逻辑。第一阶段重点：

- `CommandProcessor`
- `MovementSystem`
- `PlayerControlSystem`
- `BotAiSystem`
- `ProjectileSystem`
- `CollisionSystem`
- `DamageSystem`
- `WinConditionSystem`
- `RenderableSyncSystem`

### 6.5 EventBus

事件用于系统间解耦，也用于通知 Vue UI。

第一阶段事件：

- `entity.spawned`
- `entity.removed`
- `entity.damaged`
- `entity.destroyed`
- `projectile.fired`
- `match.started`
- `match.ended`
- `level.loaded`
- `editor.level.changed`

## 7. 坦克大战 MVP+ 设计

### 7.1 游戏模式

第一阶段只做一个模式：玩家 vs AI。

规则：

- 玩家阵营为蓝方。
- AI 阵营为红方。
- 胜利条件：消灭所有敌方坦克。
- 失败条件：玩家坦克全部死亡。
- 地图由关卡 JSON 加载。
- 编辑器保存的关卡可以直接进入测试。

### 7.2 玩家控制

第一版控制方式：

- `W/S` 前进后退。
- `A/D` 转向。
- 鼠标或方向键控制炮塔朝向。
- 鼠标左键或空格开火。
- `Esc` 暂停。

输入层产生命令，不直接改坐标。

### 7.3 AI 人机对战

AI 第一版不追求复杂战术，只验证基本战斗闭环。

状态机：

```text
Patrol
  -> 发现玩家进入 Chase

Chase
  -> 进入射程进入 Attack
  -> 目标丢失返回 Patrol

Attack
  -> 持续瞄准和开火
  -> 目标离开射程返回 Chase
  -> 自身低血量可进入 Retreat

Retreat
  -> 拉开距离后回到 Chase 或 Patrol
```

AI 需要支持：

- 感知范围。
- 射击范围。
- 简单射线检测，避免隔墙发现或开火。
- 巡逻点。
- 简单绕障碍移动。

### 7.4 战斗系统

第一阶段武器系统：

- 炮弹直线飞行。
- 命中墙体或坦克后销毁。
- 命中坦克造成固定伤害。
- 开火冷却。
- 爆炸视觉效果。

后续可扩展：

- 溅射伤害。
- 穿甲、爆炸、火焰等 Warhead 类型。
- 射程、弹速、命中率、装甲类型。

## 8. 地图与关卡编辑器

### 8.1 编辑器定位

编辑器不是独立玩具，而是引擎内容生产链路的一部分。它生成的地图 JSON 必须能被运行时直接加载。

第一版采用网格地图，不做复杂地形雕刻。原因：

- 网格更适合 RTS 寻路和地图编辑。
- 障碍、出生点、巡逻点、资源点都容易序列化。
- 后续可以扩展地形类型和高度，而不破坏第一版数据结构。

### 8.2 编辑器界面

布局：

```text
左侧工具栏：选择、放置墙体、删除、出生点、敌人、巡逻点、装饰物
中间 3D 视图：地图编辑画布
右侧属性面板：当前选中对象属性
底部操作栏：新建、保存、加载、导出、导入、测试当前关卡
```

### 8.3 编辑器工具

MVP+ 必须支持：

- 新建地图。
- 设置地图尺寸。
- 放置地面格子。
- 放置墙体/障碍物。
- 放置玩家出生点。
- 放置 AI 出生点。
- 放置 AI 巡逻点。
- 放置敌方坦克。
- 选择对象并编辑属性。
- 删除对象。
- 保存为 JSON。
- 从 JSON 加载。
- 一键测试当前关卡。

暂不支持：

- 地形高度雕刻。
- 复杂贴图绘制。
- 多图层编辑。
- 插件系统。
- 红警原版地图格式导入。

### 8.4 关卡数据格式

示例：

```json
{
  "schemaVersion": 1,
  "id": "level-01",
  "name": "训练关卡",
  "size": {
    "width": 24,
    "height": 18,
    "cellSize": 2
  },
  "terrain": {
    "default": "grass",
    "tiles": []
  },
  "objects": [
    {
      "id": "wall-1",
      "type": "wall",
      "position": { "x": 5, "z": 8 },
      "size": { "width": 2, "depth": 1 },
      "destructible": false
    }
  ],
  "spawns": [
    {
      "id": "player-spawn-1",
      "team": "player",
      "position": { "x": 2, "z": 2 },
      "rotation": 0
    },
    {
      "id": "enemy-spawn-1",
      "team": "enemy",
      "position": { "x": 18, "z": 12 },
      "rotation": 180
    }
  ],
  "patrols": [
    {
      "id": "patrol-a",
      "points": [
        { "x": 14, "z": 4 },
        { "x": 20, "z": 4 },
        { "x": 20, "z": 12 }
      ]
    }
  ],
  "enemies": [
    {
      "id": "enemy-1",
      "tankType": "light-tank",
      "spawnId": "enemy-spawn-1",
      "patrolId": "patrol-a"
    }
  ],
  "winCondition": {
    "type": "destroyAllEnemies"
  },
  "loseCondition": {
    "type": "allPlayersDestroyed"
  }
}
```

### 8.5 地图校验

保存和测试前必须校验：

- 地图尺寸合法。
- 至少有一个玩家出生点。
- 至少有一个敌人。
- 敌人引用的出生点存在。
- 巡逻路线引用存在。
- 对象 id 不重复。
- 对象位置在地图范围内。

## 9. Vue 与引擎的边界

Vue 负责：

- 页面路由。
- 主菜单。
- HUD。
- 编辑器属性面板。
- 调试面板。
- 文件导入导出操作。

引擎负责：

- 游戏循环。
- 世界状态。
- 命令处理。
- AI。
- 碰撞和伤害。
- 胜负判断。
- 关卡运行时构建。

边界规则：

- Vue 不直接修改 Entity 内部状态。
- Vue 通过命令、编辑器状态或引擎 API 与核心交互。
- 游戏运行状态通过只读快照或事件同步给 UI。

## 10. 自动化测试规划

测试策略参考 `D:\codeX\workspaces\redlater` 的两层思路：

- 使用 `test`、`typecheck`、`build` 作为基础质量门禁。
- 为关键玩法和页面维护脚本化 debug/smoke 入口，例如 `debug:*`、`smoke:*`，让手工可玩的流程也能被自动回归。

本项目不能只依赖手动打开浏览器试玩。每个阶段都必须留下可重复执行的验证方式。

### 10.1 测试分层

```text
单元测试
  ├─ World / Entity / Trait
  ├─ CommandQueue
  ├─ LevelLoader / MapValidator
  ├─ AI 状态机
  ├─ 碰撞、伤害、胜负规则
  └─ 配置解析和默认值

集成测试
  ├─ 加载关卡后生成正确实体
  ├─ 玩家命令驱动坦克移动和开火
  ├─ AI 巡逻、发现、追击、攻击
  ├─ 炮弹命中后扣血和销毁
  └─ 胜负条件触发

浏览器冒烟测试
  ├─ 首页能打开
  ├─ 游戏页 Three.js 画布非空
  ├─ 示例关卡可进入
  ├─ 编辑器可放置对象并保存 JSON
  └─ 编辑器保存的关卡可一键测试

可视化/调试回归
  ├─ 固定关卡截图
  ├─ 实体状态 JSON 快照
  ├─ 性能指标快照
  └─ debug 面板状态快照
```

### 10.2 测试命令规划

第一版 `package.json` 应预留以下脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:engine": "vitest run src/test/engine",
    "test:tank": "vitest run src/test/tank-battle",
    "smoke:game": "playwright test tests/e2e/game-smoke.spec.ts",
    "smoke:editor": "playwright test tests/e2e/editor-smoke.spec.ts",
    "debug:tank-battle": "tsx scripts/debug-tank-battle-flow.ts",
    "debug:level-editor": "tsx scripts/debug-level-editor-flow.ts",
    "verify": "npm run typecheck && npm run test && npm run build"
  }
}
```

如果第一阶段暂不接入 Playwright，仍要保留 `smoke:*` 设计位，并用脚本输出运行时状态 JSON，避免测试体系只停留在单元测试。

### 10.3 TDD 约束

核心引擎和玩法逻辑采用测试先行：

- 新增 `World`、`CommandQueue`、`LevelLoader`、`MapValidator`、`BotAiSystem`、`CollisionSystem` 等核心模块前，先写失败测试。
- UI 视觉细节可以不强制 TDD，但必须有浏览器冒烟测试或手工验证记录。
- 修复任何玩法 bug 前，先补一个能复现问题的失败测试。
- 配置文件格式变化必须先更新 schema/validator 测试。

### 10.4 必测核心用例

引擎层：

- `World` 不能重复添加相同 id 的实体。
- `World` 删除不存在实体时返回明确错误或失败结果。
- `CommandQueue` 按 tick 和入队顺序消费命令。
- `GameLoop` 固定 tick 更新次数稳定，渲染插值在合法范围。
- `EventBus` 能订阅、分发、取消订阅事件。

关卡层：

- 合法关卡能解析为运行时对象。
- 缺少玩家出生点时报错。
- 敌人引用不存在的出生点时报错。
- 巡逻路线点越界时报错。
- 对象 id 重复时报错。
- 编辑器保存再加载后数据保持一致。

坦克玩法层：

- 移动命令能改变坦克位置但不会穿墙。
- 开火命令会生成炮弹并进入冷却。
- 炮弹命中敌方坦克后扣血。
- 炮弹命中墙体后销毁。
- 坦克血量归零后触发死亡事件。
- 敌人全灭后触发胜利。
- 玩家全灭后触发失败。

AI 层：

- 没有目标时按巡逻点移动。
- 玩家进入感知范围后切换到追击。
- 进入射程后切换到攻击。
- 目标离开射程后回到追击。
- 目标死亡后重新寻找目标或回到巡逻。

编辑器层：

- 放置墙体后地图 JSON 增加对象。
- 删除对象后 JSON 同步删除。
- 修改属性面板后对象数据更新。
- 保存的 JSON 通过 `MapValidator`。
- 一键测试会把当前编辑器数据交给运行时加载。

### 10.5 自动化调试入口

参考 `redlater` 的 `debug:*` 命令风格，本项目从第一阶段开始维护固定调试入口：

- `debug:tank-battle`：加载标准关卡，自动执行移动、开火、击毁敌人的流程，输出实体状态和胜负结果。
- `debug:level-editor`：创建地图、放置对象、保存、加载、校验，输出 JSON 快照。
- `smoke:game`：启动浏览器，确认游戏页渲染非空，示例关卡可进入。
- `smoke:editor`：启动浏览器，确认编辑器工具栏、3D 画布、属性面板可用。

调试脚本输出统一写入：

```text
.artifacts/
  debug-tank-battle/
    state.json
    result.json
    screenshot.png
  debug-level-editor/
    level.json
    validation.json
    screenshot.png
```

### 10.6 阶段验收测试矩阵

| 阶段 | 必须通过的测试 |
| --- | --- |
| 阶段 0：项目初始化 | `typecheck`、`build`、首页冒烟 |
| 阶段 1：引擎骨架 | `test:engine`、Three.js 画布非空 |
| 阶段 2：坦克核心玩法 | `test:tank` 中移动、开火、碰撞、伤害用例 |
| 阶段 3：人机对战 | AI 状态机测试、胜负条件测试、`debug:tank-battle` |
| 阶段 4：地图和关卡加载 | `level-loader`、`map-validator`、示例关卡集成测试 |
| 阶段 5：地图/关卡编辑器 | 编辑器保存加载测试、`debug:level-editor`、`smoke:editor` |
| 阶段 6：MVP+ 整体验收 | `verify`、`smoke:game`、`smoke:editor`、示例关卡完整通关流程 |

### 10.7 性能与稳定性基线

MVP+ 阶段不追求极限性能，但必须记录基线：

- 示例关卡 20 个坦克以内，桌面浏览器稳定运行。
- 固定 tick 不因渲染帧率波动导致逻辑速度变化。
- 炮弹、爆炸效果优先使用对象池，避免频繁创建销毁导致卡顿。
- debug 面板显示 FPS、tick、实体数、炮弹数、AI 数、命令队列长度。
- 后续每次性能优化都要保留“优化前后行为一致”的测试，避免只测速度不测正确性。

## 11. 开发阶段计划

### 阶段 0：项目初始化

产出：

- Vue 3 + Vite + TypeScript 工程。
- Three.js 接入。
- 基础页面：主菜单、游戏页、编辑器页。
- 基础 lint/typecheck/build 脚本。

验收：

- 页面可启动。
- Three.js 画布非空渲染。
- 能进入游戏页和编辑器页。
- `typecheck`、`build`、首页冒烟测试通过。

### 阶段 1：引擎最小骨架

产出：

- `GameLoop`
- `World`
- `Entity`
- `Trait`
- `System`
- `CommandQueue`
- `EventBus`
- `ThreeRenderer`
- `RenderableSyncSystem`

验收：

- 能生成一个实体并在 Three.js 场景显示。
- 固定 tick 能驱动实体移动。
- 渲染层能用插值同步显示。
- 核心逻辑测试不需要浏览器和 Three.js。
- `test:engine` 覆盖 World、CommandQueue、GameLoop、EventBus。

### 阶段 2：坦克核心玩法

产出：

- 玩家坦克。
- 移动和转向。
- 炮塔朝向。
- 炮弹发射。
- 碰撞检测。
- 生命和死亡。
- HUD 显示血量、击杀数、敌人数量。

验收：

- 玩家能操作坦克移动和射击。
- 炮弹能击中敌人或障碍。
- 敌人被击毁后从 World 移除。
- 移动、开火、碰撞、伤害、死亡测试通过。

### 阶段 3：人机对战

产出：

- `TeamTrait`
- `BotTrait`
- `BotAiSystem`
- 巡逻、追击、攻击状态机。
- 胜负判断。

验收：

- AI 能按巡逻点移动。
- AI 能发现玩家并追击。
- AI 能进入射程后开火。
- 玩家消灭全部敌人后胜利。
- 玩家死亡后失败。
- AI 状态机测试和 `debug:tank-battle` 通过。

### 阶段 4：地图和关卡加载

产出：

- `LevelSchema`
- `LevelLoader`
- `LevelRuntimeBuilder`
- 地图对象生成。
- 出生点生成。
- 敌人生成。
- 巡逻路线生成。

验收：

- 能从 JSON 加载一张完整地图。
- 地图中的障碍、玩家、敌人、巡逻点能正确进入运行时。
- 错误地图能给出明确校验错误。
- `level-loader`、`map-validator` 和示例关卡集成测试通过。

### 阶段 5：地图/关卡编辑器

产出：

- `MapEditor.vue`
- 编辑器工具栏。
- 3D 编辑视图。
- 属性面板。
- 保存/加载 JSON。
- 一键测试当前关卡。

验收：

- 能创建新地图。
- 能放置障碍、出生点、敌人、巡逻点。
- 能选择对象并修改属性。
- 能保存 JSON。
- 能加载 JSON。
- 能直接测试编辑器中的关卡。
- 编辑器保存加载测试、`debug:level-editor`、`smoke:editor` 通过。

### 阶段 6：MVP+ 整体验收

产出：

- 一张示例关卡。
- 一个完整可玩的 3D 坦克大战人机对战 Demo。
- 一个可用的地图/关卡编辑器。
- 核心逻辑测试。
- 项目 README 和运行说明。

验收：

- 从主菜单进入游戏能直接游玩。
- 从编辑器创建地图后能直接测试。
- 游戏逻辑、渲染、UI、编辑器边界清晰。
- 后续可继续扩展 RTS 沙盒。
- `verify`、`smoke:game`、`smoke:editor` 全部通过。

## 12. 向红警能力演进路线

MVP+ 完成后，按以下顺序扩展：

### 12.1 RTS 操作层

- 框选单位。
- 单位选择状态。
- 右键移动。
- 右键攻击。
- 多单位命令分发。
- 俯视 RTS 相机。

### 12.2 地图与寻路

- 网格地图占用信息。
- A* 寻路。
- 动态障碍。
- 多单位避让。
- 地形通行成本。

### 12.3 单位与武器体系

- 步兵、车辆、建筑、飞行器。
- 武器、弹头、装甲类型。
- 射程、弹道、溅射、穿甲。
- 单位经验和升级。

### 12.4 经济与生产

- 资源点。
- 采集单位。
- 资金系统。
- 建筑建造。
- 单位生产队列。
- 科技前置。

### 12.5 RTS 信息系统

- 小地图。
- 战争迷雾。
- 雷达。
- 视野共享。
- 阵营关系。

### 12.6 确定性与联网

- 状态 hash。
- 命令回放。
- 确定性随机数。
- lockstep 同步。
- 断线恢复和观战回放。

## 13. 风险与约束

### 13.1 风险：一开始就复刻红警导致范围失控

处理方式：第一阶段只做 3D 坦克大战 MVP+，但所有架构边界都按 RTS 演进保留。

### 13.2 风险：Three.js 逻辑侵入核心

处理方式：核心逻辑禁止依赖 Three.js 类型。通过 Renderable 映射和同步系统连接渲染。

### 13.3 风险：编辑器成为一次性页面

处理方式：编辑器输出的 JSON 必须由运行时直接加载，并纳入 MVP 验收。

### 13.4 风险：AI、寻路、碰撞一次做太复杂

处理方式：AI 第一版只做巡逻、追击、攻击；寻路先做网格级绕障；碰撞先用 AABB 或圆形碰撞，后续再替换为更复杂方案。

### 13.5 风险：测试体系后补导致架构不可测

处理方式：核心逻辑从第一阶段开始测试先行；渲染和编辑器流程至少保留 smoke/debug 脚本；每个阶段都必须有可重复执行的验证命令。

## 14. 第一版不做的内容

MVP+ 明确不做：

- 多人联网。
- 红警原版资源格式解析。
- 红警原版地图格式导入。
- 完整 RTS 建造系统。
- 完整经济系统。
- 完整战争迷雾。
- 复杂物理引擎。
- 地形高度编辑。
- 插件化编辑器。

这些内容进入后续 RTS 扩展阶段。

## 15. 完成定义

第一阶段完成时，应满足：

- 工程能本地启动。
- 主菜单、游戏页、编辑器页可用。
- 3D 坦克大战可完整游玩。
- 支持玩家 vs AI。
- AI 能巡逻、追击、攻击。
- 关卡编辑器能创建、保存、加载、测试地图。
- 示例关卡可运行。
- 核心逻辑有基础测试。
- 自动化测试命令和调试脚本可执行。
- `.artifacts/` 中能输出关键 debug 流程的状态、结果和截图。
- 文档说明如何运行、如何编辑地图、如何扩展坦克和武器。

如果达到以上标准，可以认为引擎第一阶段框架可行，并可以进入 RTS 沙盒阶段。
