import type { EntityId } from '@/engine/entity/EntityId'

/**
 * A command is an intent, not an immediate state mutation.
 *
 * Player input, AI decisions, replay data, and future network lockstep packets
 * should all enter the simulation through commands. This keeps the simulation
 * deterministic and makes later RTS-style order handling much easier to test.
 */
export interface Command<TPayload = unknown> {
  id: string
  actorId: EntityId
  type: string
  payload: TPayload
  /**
   * Optional fixed simulation tick for delayed or lockstep-synchronized commands.
   * Commands without a tick are consumed by the next update.
   */
  tick?: number
}
