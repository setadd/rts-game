import { describe, expect, test } from 'vitest'
import { EventBus } from '@/engine/event/EventBus'

interface Events {
  'entity.spawned': { id: string }
  'match.ended': { winner: string }
}

describe('EventBus', () => {
  test('dispatches payloads to subscribers', () => {
    const bus = new EventBus<Events>()
    const received: string[] = []

    bus.on('entity.spawned', (payload) => received.push(payload.id))
    bus.emit('entity.spawned', { id: 'tank-1' })

    expect(received).toEqual(['tank-1'])
  })

  test('unsubscribes listeners', () => {
    const bus = new EventBus<Events>()
    const received: string[] = []
    const unsubscribe = bus.on('match.ended', (payload) => received.push(payload.winner))

    unsubscribe()
    bus.emit('match.ended', { winner: 'blue' })

    expect(received).toEqual([])
  })
})
