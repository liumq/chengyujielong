/**
 * 文字渲染器，封装中文文字排版相关的高级绘制能力
 * 支持自动换行、竖排文字、描边文字等
 */
export class TextRenderer {
  private ctx: CanvasRenderingContext2D
  private defaultFontFamily = 'PingFang SC, Microsoft YaHei, sans-serif'

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  /** 设置默认字体族 */
  setDefaultFontFamily(family: string): void {
    this.defaultFontFamily = family
  }

  /**
   * 绘制自动换行文字
   * @param text 文本内容
   * @param x 起始 x 坐标
   * @param y 起始 y 坐标
   * @param maxWidth 最大行宽
   * @param lineHeight 行高（像素）
   * @param options 样式选项
   * @returns 实际渲染的行数
   */
  drawWrappedText(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    options: TextOptions = {},
  ): number {
    const { color = '#ffffff', fontSize = 16, bold = false, align = 'left', fontFamily } = options
    this.ctx.save()
    this.applyFont(fontSize, bold, fontFamily)
    this.ctx.fillStyle = color
    this.ctx.textAlign = align
    this.ctx.textBaseline = 'top'

    const lines = this.splitLines(text, maxWidth)
    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], x, y + i * lineHeight)
    }
    this.ctx.restore()
    return lines.length
  }

  /**
   * 绘制带描边的文字（适合标题等需要突出的场景）
   */
  drawStrokedText(
    text: string,
    x: number,
    y: number,
    options: StrokedTextOptions = {},
  ): void {
    const {
      color = '#ffffff',
      strokeColor = '#000000',
      strokeWidth = 3,
      fontSize = 24,
      bold = true,
      align = 'center',
      baseline = 'middle',
      fontFamily,
    } = options

    this.ctx.save()
    this.applyFont(fontSize, bold, fontFamily)
    this.ctx.textAlign = align
    this.ctx.textBaseline = baseline

    this.ctx.strokeStyle = strokeColor
    this.ctx.lineWidth = strokeWidth
    this.ctx.lineJoin = 'round'
    this.ctx.strokeText(text, x, y)

    this.ctx.fillStyle = color
    this.ctx.fillText(text, x, y)
    this.ctx.restore()
  }

  /**
   * 绘制竖排文字（传统中文排版）
   * @param text 文本内容
   * @param x 起始 x 坐标（列的中心）
   * @param y 起始 y 坐标
   * @param charSpacing 字间距
   */
  drawVerticalText(
    text: string,
    x: number,
    y: number,
    charSpacing: number = 0,
    options: TextOptions = {},
  ): void {
    const { color = '#ffffff', fontSize = 16, bold = false, fontFamily } = options
    this.ctx.save()
    this.applyFont(fontSize, bold, fontFamily)
    this.ctx.fillStyle = color
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    for (let i = 0; i < text.length; i++) {
      this.ctx.fillText(text[i], x, y + i * (fontSize + charSpacing))
    }
    this.ctx.restore()
  }

  /**
   * 测量自动换行后文本占据的总高度
   */
  measureWrappedHeight(
    text: string,
    maxWidth: number,
    lineHeight: number,
    fontSize: number = 16,
    bold: boolean = false,
    fontFamily?: string,
  ): number {
    this.applyFont(fontSize, bold, fontFamily)
    const lines = this.splitLines(text, maxWidth)
    return lines.length * lineHeight
  }

  /** 测量单行文字宽度 */
  measureWidth(text: string, fontSize: number, bold = false, fontFamily?: string): number {
    this.applyFont(fontSize, bold, fontFamily)
    return this.ctx.measureText(text).width
  }

  /** 将文本按最大宽度拆分为多行 */
  private splitLines(text: string, maxWidth: number): string[] {
    const lines: string[] = []
    let currentLine = ''

    for (const char of text) {
      if (char === '\n') {
        lines.push(currentLine)
        currentLine = ''
        continue
      }
      const testLine = currentLine + char
      if (this.ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)
    return lines
  }

  private applyFont(fontSize: number, bold: boolean, fontFamily?: string): void {
    const family = fontFamily ?? this.defaultFontFamily
    this.ctx.font = `${bold ? 'bold ' : ''}${fontSize}px ${family}`
  }
}

export interface TextOptions {
  color?: string
  fontSize?: number
  bold?: boolean
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  fontFamily?: string
}

export interface StrokedTextOptions extends TextOptions {
  strokeColor?: string
  strokeWidth?: number
}
