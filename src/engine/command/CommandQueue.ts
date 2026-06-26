import type { Command } from './Command'

/**
 * 命令队列负责暂存命令，直到模拟推进到命令允许执行的 tick。
 *
 * 队列不绑定键盘、鼠标、AI 或网络来源，目的是让玩家输入、机器人 AI、脚本化测试
 * 和未来的联机输入都走同一条处理路径。
 */
export class CommandQueue {
  private readonly commands: Command[] = []

  enqueue(command: Command): void {
    this.commands.push(command)
  }

  /**
   * 取出当前 tick 可执行的命令，并保留未来 tick 的命令。
   * 同一 tick 内保持入队顺序，避免同帧命令的执行结果不可预测。
   */
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
