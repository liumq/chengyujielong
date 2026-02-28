/**
 * Canvas 渲染工具集，封装常用的 2D 绘制操作
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  /** 填充矩形 */
  fillRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, w, h)
  }

  /** 描边矩形 */
  strokeRect(x: number, y: number, w: number, h: number, color: string, lineWidth = 1): void {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = lineWidth
    this.ctx.strokeRect(x, y, w, h)
  }

  /** 填充圆角矩形 */
  fillRoundRect(x: number, y: number, w: number, h: number, radius: number, color: string): void {
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.roundRect(x, y, w, h, radius)
    this.ctx.fill()
  }

  /** 描边圆角矩形 */
  strokeRoundRect(x: number, y: number, w: number, h: number, radius: number, color: string, lineWidth = 1): void {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = lineWidth
    this.ctx.beginPath()
    this.ctx.roundRect(x, y, w, h, radius)
    this.ctx.stroke()
  }

  /** 填充文字（居中对齐） */
  fillText(
    text: string,
    x: number,
    y: number,
    color: string,
    fontSize: number,
    fontFamily = 'PingFang SC, Microsoft YaHei, sans-serif',
    align: CanvasTextAlign = 'center',
    baseline: CanvasTextBaseline = 'middle',
  ): void {
    this.ctx.fillStyle = color
    this.ctx.font = `${fontSize}px ${fontFamily}`
    this.ctx.textAlign = align
    this.ctx.textBaseline = baseline
    this.ctx.fillText(text, x, y)
  }

  /** 填充加粗文字 */
  fillBoldText(
    text: string,
    x: number,
    y: number,
    color: string,
    fontSize: number,
    fontFamily = 'PingFang SC, Microsoft YaHei, sans-serif',
    align: CanvasTextAlign = 'center',
    baseline: CanvasTextBaseline = 'middle',
  ): void {
    this.ctx.fillStyle = color
    this.ctx.font = `bold ${fontSize}px ${fontFamily}`
    this.ctx.textAlign = align
    this.ctx.textBaseline = baseline
    this.ctx.fillText(text, x, y)
  }

  /** 填充圆形 */
  fillCircle(cx: number, cy: number, r: number, color: string): void {
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2)
    this.ctx.fill()
  }

  /** 绘制线段 */
  drawLine(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth = 1): void {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = lineWidth
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
  }

  /** 设置全局透明度 */
  setAlpha(alpha: number): void {
    this.ctx.globalAlpha = alpha
  }

  /** 重置全局透明度 */
  resetAlpha(): void {
    this.ctx.globalAlpha = 1
  }

  /** 保存绘图状态 */
  save(): void {
    this.ctx.save()
  }

  /** 恢复绘图状态 */
  restore(): void {
    this.ctx.restore()
  }

  /** 测量文字宽度 */
  measureText(text: string, fontSize: number, fontFamily = 'PingFang SC, Microsoft YaHei, sans-serif'): number {
    this.ctx.font = `${fontSize}px ${fontFamily}`
    return this.ctx.measureText(text).width
  }
}
