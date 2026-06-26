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
    const loop = new GameLoop(
      world,
      [
        {
          name: 'recorder',
          update: (_world, context) => ticks.push(context.tick),
        },
      ],
      {
        tickRate: 30,
        maxCatchUpTicks: 5,
        requestFrame: scheduler.requestFrame.bind(scheduler),
        cancelFrame: scheduler.cancelFrame.bind(scheduler),
      },
    )

    loop.start()
    loop.stop()
    scheduler.step(34)

    expect(ticks).toEqual([])
  })

  test('binds default browser frame scheduler to global object', () => {
    const originalRequestFrame = globalThis.requestAnimationFrame
    const originalCancelFrame = globalThis.cancelAnimationFrame
    let cancelledHandle = 0

    globalThis.requestAnimationFrame = function requestFrame(callback: FrameRequestCallback): number {
      // 浏览器原生 requestAnimationFrame 要求调用者是 window；这个断言复现真实页面里的 Illegal invocation。
      expect(this).toBe(globalThis)
      expect(typeof callback).toBe('function')
      return 7
    }
    globalThis.cancelAnimationFrame = function cancelFrame(handle: number): void {
      expect(this).toBe(globalThis)
      cancelledHandle = handle
    }

    try {
      const loop = new GameLoop(new World(), [], {
        tickRate: 30,
        maxCatchUpTicks: 5,
      })

      expect(() => loop.start()).not.toThrow()
      loop.stop()
      expect(cancelledHandle).toBe(7)
    } finally {
      globalThis.requestAnimationFrame = originalRequestFrame
      globalThis.cancelAnimationFrame = originalCancelFrame
    }
  })
})
