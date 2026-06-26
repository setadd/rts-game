/**
 * Timing data passed to traits and systems for one fixed simulation update.
 *
 * `deltaSeconds` is constant for a given tick rate. Rendering can run at a
 * different frame rate, but core simulation should only advance through ticks.
 */
export interface TickContext {
  tick: number
  deltaSeconds: number
  elapsedSeconds: number
}
