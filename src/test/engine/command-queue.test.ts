import { describe, expect, test } from 'vitest'
import { CommandQueue } from '@/engine/command/CommandQueue'

describe('CommandQueue', () => {
  test('dequeues unticked commands in insertion order', () => {
    const queue = new CommandQueue()
    queue.enqueue({ id: '1', actorId: 'tank-1', type: 'move', payload: { x: 1 } })
    queue.enqueue({ id: '2', actorId: 'tank-1', type: 'fire', payload: {} })

    expect(queue.dequeueForTick(0).map((command) => command.id)).toEqual(['1', '2'])
    expect(queue.size()).toBe(0)
  })

  test('dequeues commands scheduled up to the current tick', () => {
    const queue = new CommandQueue()
    queue.enqueue({ id: 'late', actorId: 'tank-1', type: 'move', payload: {}, tick: 3 })
    queue.enqueue({ id: 'now', actorId: 'tank-1', type: 'fire', payload: {}, tick: 2 })

    expect(queue.dequeueForTick(2).map((command) => command.id)).toEqual(['now'])
    expect(queue.dequeueForTick(3).map((command) => command.id)).toEqual(['late'])
  })

  test('keeps ready commands that do not match the dequeue predicate', () => {
    const queue = new CommandQueue()
    queue.enqueue({ id: 'move', actorId: 'tank-1', type: 'tank.move', payload: {} })
    queue.enqueue({ id: 'fire', actorId: 'tank-1', type: 'tank.fire', payload: {} })

    expect(queue.dequeueForTick(1, (command) => command.type === 'tank.fire').map((command) => command.id)).toEqual([
      'fire',
    ])
    expect(queue.dequeueForTick(1).map((command) => command.id)).toEqual(['move'])
  })
})
