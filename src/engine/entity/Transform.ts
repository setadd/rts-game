export interface Vector3Like {
  x: number
  y: number
  z: number
}

/**
 * 模拟层使用的渲染无关 Transform。
 *
 * 这里刻意保持 position/rotation/scale 与 Three.js 概念相近，但不把 Three.js 类型
 * 引入核心引擎，避免逻辑层和渲染层耦合。
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
