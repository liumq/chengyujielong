import { UIComponent } from './UIComponent'

export interface LabelOptions {
  text: string
  fontSize?: number
  color?: string
  bold?: boolean
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  fontFamily?: string
}

/**
 * 文字标签组件
 */
export class Label extends UIComponent {
  text: string
  fontSize: number
  color: string
  bold: boolean
  align: CanvasTextAlign
  baseline: CanvasTextBaseline
  fontFamily: string

  constructor(x: number, y: number, options: LabelOptions) {
    super(x, y, 0, 0)
    this.text = options.text
    this.fontSize = options.fontSize ?? 16
    this.color = options.color ?? '#ffffff'
    this.bold = options.bold ?? false
    this.align = options.align ?? 'center'
    this.baseline = options.baseline ?? 'middle'
    this.fontFamily = options.fontFamily ?? 'PingFang SC, Microsoft YaHei, sans-serif'
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color
    ctx.font = `${this.bold ? 'bold ' : ''}${this.fontSize}px ${this.fontFamily}`
    ctx.textAlign = this.align
    ctx.textBaseline = this.baseline
    ctx.fillText(this.text, this.x, this.y)
  }
}
