import type { Command } from './Command'

/**
 * Stores commands until the simulation reaches the tick where they are allowed
 * to run. Keeping this queue independent from input devices and systems lets
 * player input, bot AI, scripted tests, and future network input share one path.
 */
export class CommandQueue {
  private readonly commands: Command[] = []

  enqueue(command: Command): void {
    this.commands.push(command)
  }

  /**
   * Returns commands ready for the current fixed tick and keeps future commands
   * pending. Insertion order is preserved so same-tick commands stay predictable.
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
