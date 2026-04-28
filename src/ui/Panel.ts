import { UIComponent } from './UIComponent'
import { TweenManager, Easing, type Tween } from '../core/Tween'

export interface PanelOptions {
  bgColor?: string
  borderColor?: string
  radius?: number
  /** 面板进入动画方向 */
  enterFrom?: 'bottom' | 'top' | 'fade' | 'scale'
}

/**
 * 面板容器组件，支持弹出/收起动画，可包含子组件
 */
export class Panel extends UIComponent {
  private bgColor: string
  private borderColor: string
  private radius: number
  private enterFrom: 'bottom' | 'top' | 'fade' | 'scale'

  /** 动画偏移量（用于滑入动画） */
  private offsetY: number = 0
  /** 动画缩放（用于 scale 动画） */
  private animScale: number = 1
  /** 当前活跃的动画补间 */
  private activeTween: Tween | null = null

  private children: UIComponent[] = []

  constructor(x: number, y: number, width: number, height: number, options: PanelOptions = {}) {
    super(x, y, width, height)
    this.bgColor = options.bgColor ?? 'rgba(15, 52, 96, 0.95)'
    this.borderColor = options.borderColor ?? 'rgba(168, 216, 234, 0.2)'
    this.radius = options.radius ?? 16
    this.enterFrom = options.enterFrom ?? 'scale'
  }

  /** 添加子组件 */
  addChild(child: UIComponent): this {
    this.children.push(child)
    return this
  }

  /** 播放进入动画（重复调用时取消旧补间并重置状态） */
  playEnterAnimation(onComplete?: () => void): void {
    if (this.activeTween) {
      this.activeTween.cancel()
      this.activeTween = null
    }
    this.visible = true
    switch (this.enterFrom) {
      case 'bottom':
        this.offsetY = this.height + 40
        this.alpha = 0
        this.activeTween = TweenManager.instance.create({
          duration: 350,
          easing: Easing.easeOutCubic,
          onUpdate: (t) => {
            this.offsetY = (1 - t) * (this.height + 40)
            this.alpha = t
          },
          onComplete: () => { this.activeTween = null; onComplete?.() },
        })
        break
      case 'top':
        this.offsetY = -(this.height + 40)
        this.alpha = 0
        this.activeTween = TweenManager.instance.create({
          duration: 350,
          easing: Easing.easeOutCubic,
          onUpdate: (t) => {
            this.offsetY = (1 - t) * -(this.height + 40)
            this.alpha = t
          },
          onComplete: () => { this.activeTween = null; onComplete?.() },
        })
        break
      case 'fade':
        this.alpha = 0
        this.activeTween = TweenManager.instance.create({
          duration: 300,
          easing: Easing.linear,
          onUpdate: (t) => { this.alpha = t },
          onComplete: () => { this.activeTween = null; onComplete?.() },
        })
        break
      case 'scale':
      default:
        this.animScale = 0.6
        this.alpha = 0
        this.activeTween = TweenManager.instance.create({
          duration: 300,
          easing: Easing.easeOutBack,
          onUpdate: (t) => {
            this.animScale = 0.6 + t * 0.4
            this.alpha = Math.min(1, t * 1.5)
          },
          onComplete: () => { this.activeTween = null; onComplete?.() },
        })
    }
  }

  /** 播放退出动画（取消进行中的动画后播放） */
  playExitAnimation(onComplete?: () => void): void {
    if (this.activeTween) {
      this.activeTween.cancel()
      this.activeTween = null
    }
    this.activeTween = TweenManager.instance.create({
      duration: 200,
      easing: Easing.easeInQuad,
      onUpdate: (t) => {
        this.animScale = 1 - t * 0.3
        this.alpha = 1 - t
      },
      onComplete: () => {
        this.visible = false
        this.activeTween = null
        onComplete?.()
      },
    })
  }

  update(deltaTime: number): void {
    for (const child of this.children) {
      if (child.active) child.update(deltaTime)
    }
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2
    const cy = this.y + this.height / 2 + this.offsetY

    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(this.animScale, this.animScale)
    ctx.translate(-cx, -cy)

    // 背景
    ctx.fillStyle = this.bgColor
    ctx.beginPath()
    ctx.roundRect(this.x, this.y + this.offsetY, this.width, this.height, this.radius)
    ctx.fill()

    // 边框
    ctx.strokeStyle = this.borderColor
    ctx.lineWidth = 1
    ctx.stroke()

    // 绘制子组件
    for (const child of this.children) {
      if (child.active && child.visible) {
        child.render(ctx)
      }
    }

    ctx.restore()
  }
}
