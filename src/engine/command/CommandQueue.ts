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
   * 取出当前 tick 可执行且满足条件的命令，并保留未来 tick 或不满足条件的命令。
   * predicate 让多个系统可以共享同一个队列，各自只消费自己认识的命令类型。
   */
  dequeueForTick(currentTick: number, predicate: (command: Command) => boolean = () => true): Command[] {
    const ready: Command[] = []
    const pending: Command[] = []

    for (const command of this.commands) {
      const commandIsReady = command.tick === undefined || command.tick <= currentTick
      if (commandIsReady && predicate(command)) {
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
