export interface Vector3Like {
  x: number
  y: number
  z: number
}

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
