import { UIComponent } from './UIComponent'
import { TweenManager, Easing } from '../core/Tween'

export interface ButtonOptions {
  text: string
  fontSize?: number
  color?: string
  bgColor?: string
  borderColor?: string
  radius?: number
  bold?: boolean
}

interface RippleEffect {
  x: number
  y: number
  progress: number
  maxRadius: number
}

/**
 * 按钮组件，支持点击回调、按压缩放、涟漪扩散、高亮闪烁动画
 */
export class Button extends UIComponent {
  text: string
  private fontSize: number
  private color: string
  bgColor: string
  private borderColor: string
  private radius: number
  private bold: boolean

  /** 按压缩放比例 */
  private scaleY: number = 1
  /** 高亮闪烁透明度 */
  private highlightAlpha: number = 0
  /** 涟漪效果列表 */
  private ripples: RippleEffect[] = []
  private onClick?: () => void
  /** 自定义数据，供业务层存取 */
  data: Record<string, unknown> = {}

  constructor(x: number, y: number, width: number, height: number, options: ButtonOptions) {
    super(x, y, width, height)
    this.text = options.text
    this.fontSize = options.fontSize ?? 16
    this.color = options.color ?? '#ffffff'
    this.bgColor = options.bgColor ?? '#0f3460'
    this.borderColor = options.borderColor ?? '#a8d8ea55'
    this.radius = options.radius ?? 12
    this.bold = options.bold ?? false
  }

  setOnClick(callback: () => void): this {
    this.onClick = callback
    return this
  }

  handleTap(px: number, py: number): boolean {
    if (!this.active || !this.visible) return false
    if (!this.containsPoint(px, py)) return false

    this.playPressAnimation(px, py)
    this.onClick?.()
    return true
  }

  private playPressAnimation(tapX: number, tapY: number): void {
    // 涟漪效果：从点击位置向外扩散（涟漪允许叠加，但限制最大数量）
    if (this.ripples.length >= 3) this.ripples.shift()
    const maxR = Math.max(this.width, this.height) * 1.2
    const ripple: RippleEffect = { x: tapX, y: tapY, progress: 0, maxRadius: maxR }
    this.ripples.push(ripple)
    TweenManager.instance.create({
      duration: 400,
      easing: Easing.easeOutCubic,
      onUpdate: (t) => { ripple.progress = t },
      onComplete: () => {
        const idx = this.ripples.indexOf(ripple)
        if (idx !== -1) this.ripples.splice(idx, 1)
      },
    })

    // 高亮闪烁（重置状态避免堆叠）
    this.highlightAlpha = 0.35
    TweenManager.instance.create({
      duration: 300,
      easing: Easing.easeOutQuad,
      onUpdate: (t) => { this.highlightAlpha = 0.35 * (1 - t) },
      onComplete: () => { this.highlightAlpha = 0 },
    })

    // 按压缩放（重置状态避免堆叠）
    this.scaleY = 1
    TweenManager.instance.create({
      duration: 80,
      easing: Easing.easeInQuad,
      onUpdate: (t) => { this.scaleY = 1 - t * 0.08 },
    }).then({
      duration: 200,
      easing: Easing.easeOutBack,
      onUpdate: (t) => { this.scaleY = 0.92 + t * 0.08 },
      onComplete: () => { this.scaleY = 1 },
    })
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2
    const cy = this.y + this.height / 2
    const h = this.height * this.scaleY
    const y = cy - h / 2

    // 背景
    ctx.fillStyle = this.bgColor
    ctx.beginPath()
    ctx.roundRect(this.x, y, this.width, h, this.radius)
    ctx.fill()

    // 涟漪效果（裁剪在按钮范围内）
    if (this.ripples.length > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(this.x, y, this.width, h, this.radius)
      ctx.clip()
      for (const rp of this.ripples) {
        const r = rp.maxRadius * rp.progress
        const alpha = 0.3 * (1 - rp.progress)
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    // 高亮闪烁叠加
    if (this.highlightAlpha > 0) {
      ctx.save()
      ctx.globalAlpha = this.highlightAlpha
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(this.x, y, this.width, h, this.radius)
      ctx.fill()
      ctx.restore()
    }

    // 边框
    ctx.strokeStyle = this.borderColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(this.x, y, this.width, h, this.radius)
    ctx.stroke()

    // 文字
    ctx.fillStyle = this.color
    ctx.font = `${this.bold ? 'bold ' : ''}${this.fontSize}px PingFang SC, Microsoft YaHei, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.text, cx, cy)
  }
}
