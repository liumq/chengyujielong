/** 兼容不支持 roundRect 的旧 WebView */
function pathRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number | number[],
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
    return
  }
  const radius = typeof r === 'number' ? r : r[0]
  const rr = Math.min(radius, w / 2, h / 2)
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.arcTo(x + w, y, x + w, y + rr, rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr)
  ctx.lineTo(x + rr, y + h)
  ctx.arcTo(x, y + h, x, y + h - rr, rr)
  ctx.lineTo(x, y + rr)
  ctx.arcTo(x, y, x + rr, y, rr)
  ctx.closePath()
}

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
    pathRoundRect(this.ctx, x, y, w, h, radius)
    this.ctx.fill()
  }

  /** 描边圆角矩形 */
  strokeRoundRect(x: number, y: number, w: number, h: number, radius: number, color: string, lineWidth = 1): void {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = lineWidth
    this.ctx.beginPath()
    pathRoundRect(this.ctx, x, y, w, h, radius)
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

  private _bgGrad: CanvasGradient | null = null
  private _bgGradH: number = 0

  /** 填充深色主题背景渐变（自动缓存 gradient 对象） */
  fillBackground(width: number, height: number): void {
    if (!this._bgGrad || this._bgGradH !== height) {
      this._bgGrad = this.ctx.createLinearGradient(0, 0, 0, height)
      this._bgGrad.addColorStop(0, '#1a1a2e')
      this._bgGrad.addColorStop(1, '#16213e')
      this._bgGradH = height
    }
    this.ctx.fillStyle = this._bgGrad
    this.ctx.fillRect(0, 0, width, height)
  }
}
