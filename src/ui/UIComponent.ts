import { GameObject } from '../core/GameObject'

/**
 * UI 组件基类，提供位置、尺寸、透明度、可见性管理
 */
export abstract class UIComponent extends GameObject {
  x: number
  y: number
  width: number
  height: number
  /** 透明度 0~1 */
  alpha: number = 1
  /** 可见性（不可见时跳过渲染但仍 update） */
  visible: boolean = true

  constructor(x: number, y: number, width: number, height: number) {
    super()
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  /** 判断点是否在组件矩形区域内 */
  containsPoint(px: number, py: number): boolean {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height
  }

  /** 默认 update 为空，子类按需重写 */
  update(_deltaTime: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.alpha <= 0) return
    ctx.save()
    ctx.globalAlpha *= this.alpha
    this.draw(ctx)
    ctx.restore()
  }

  /** 子类实现具体绘制逻辑 */
  protected abstract draw(ctx: CanvasRenderingContext2D): void
}
