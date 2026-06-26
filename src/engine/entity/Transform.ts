export interface Vector3Like {
  x: number
  y: number
  z: number
}

/**
 * Render-agnostic transform used by the simulation.
 *
 * This deliberately mirrors the position/rotation/scale concepts used by
 * Three.js without importing Three.js types into the engine core.
 */
export interface Transform {
  position: Vector3Like
  rotation: Vector3Like
  scale: Vector3Like
}

export function createDefaultTransform(): Transform {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  }
}
