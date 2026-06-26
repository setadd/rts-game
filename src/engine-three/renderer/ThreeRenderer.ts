import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'

/**
 * Three.js 渲染适配器。
 *
 * 这个类负责创建 Scene、Camera、WebGLRenderer 和基础光照。它属于渲染层，
 * 不能被 `src/engine` 下的核心模拟代码反向依赖。
 */
export class ThreeRenderer {
  readonly scene = new Scene()
  readonly camera = new PerspectiveCamera(60, 1, 0.1, 1000)
  readonly renderer: WebGLRenderer

  constructor(private readonly host: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(new Color('#0f1419'))
    this.host.appendChild(this.renderer.domElement)

    this.camera.position.set(8, 8, 8)
    this.camera.lookAt(0, 0, 0)

    const ambient = new AmbientLight('#ffffff', 0.5)
    const sun = new DirectionalLight('#ffffff', 1.2)
    sun.position.set(5, 8, 4)
    this.scene.add(ambient, sun)

    const ground = new Mesh(
      new BoxGeometry(12, 0.2, 12),
      new MeshStandardMaterial({ color: '#2d5a3f' }),
    )
    ground.position.y = -0.1
    this.scene.add(ground)

    this.resize()
  }

  /**
   * 使用宿主元素尺寸更新画布和相机比例。
   * 当前 MVP 阶段直接在渲染帧调用，后续可改成 ResizeObserver。
   */
  resize(): void {
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
