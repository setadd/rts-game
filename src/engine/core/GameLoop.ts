import type { System } from './System'
import type { World } from './World'

interface GameLoopOptions {
  tickRate: number
  maxCatchUpTicks: number
  requestFrame?: (callback: (timestamp: number) => void) => number
  cancelFrame?: (handle: number) => void
}

/**
 * 以固定 tick 频率推进权威模拟状态。
 *
 * 浏览器渲染帧率会受到 GPU、页面可见性、系统负载影响而波动。核心模拟不能直接跟着
 * 渲染帧率变化，所以这里把不稳定的 animation frame 时间转换成固定长度的模拟 tick。
 */
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

    // 注入调度器可以让 GameLoop 在没有真实浏览器的 Node 测试里运行，
    // 也为后续逐帧回放和确定性调试预留入口。
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

    // 渲染卡顿时允许一次补跑多个固定 tick；同时设置上限，避免页面长时间挂起后
    // 恢复时一次性执行过多逻辑导致界面继续卡死。
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
