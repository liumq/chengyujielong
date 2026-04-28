import { Scene } from '../core/Scene'
import { CanvasRenderer } from '../render/CanvasRenderer'
import { Button } from '../ui/Button'
import { TweenManager, Easing } from '../core/Tween'
import type { Engine } from '../core/Engine'
import type { IdiomEntry } from '../data/IdiomDatabase'

export interface ResultData {
  score: number
  chainLength: number
  bestCombo: number
  reason: string
  isNewRecord?: boolean
  historyBestScore?: number
  /** 本局接龙历史 */
  history?: IdiomEntry[]
}

/**
 * 结算场景
 */
export class ResultScene extends Scene {
  private r: CanvasRenderer
  private engine: Engine
  private data: ResultData
  private enterProgress: number = 0

  /** 成语列表弹窗 */
  private historyVisible: boolean = false
  private historyAlpha: number = 0
  private historyScale: number = 0.6
  private historyScrollY: number = 0
  private historyContentHeight: number = 0
  private historyDragging: boolean = false
  private historyTouchStartY: number = 0
  private historyScrollStartY: number = 0
  private historyVelocity: number = 0
  private historyLastTouchY: number = 0
  private historyLastTouchTime: number = 0
  private historyCloseBtn: Button | null = null

  constructor(engine: Engine, data: ResultData) {
    super()
    this.engine = engine
    this.r = new CanvasRenderer(engine.ctx)
    this.data = data
  }

  onEnter(): void {
    TweenManager.instance.clear()
    const { width, height } = this.engine
    this.enterProgress = 0
    this.historyVisible = false

    this.engine.storage.incrementTotalGames()
    this.data.isNewRecord = this.engine.storage.updateBestScore(this.data.score)
    this.engine.storage.updateBestCombo(this.data.bestCombo)
    this.data.historyBestScore = this.engine.storage.getBestScore()

    TweenManager.instance.create({
      duration: 600,
      easing: Easing.easeOutCubic,
      onUpdate: (t) => { this.enterProgress = t },
    })

    const btnReplay = new Button(
      width / 2 - 110, height * 0.72, 220, 54,
      { text: '再来一局', fontSize: 18, bold: true, bgColor: '#e94560', borderColor: 'transparent', radius: 14 }
    ).setOnClick(() => {
      import('./GameScene').then(({ GameScene }) => {
        this.engine.switchScene(new GameScene(this.engine))
      })
    })

    const btnMenu = new Button(
      width / 2 - 110, height * 0.72 + 66, 220, 48,
      { text: '返回主菜单', fontSize: 16, bgColor: '#0f3460', borderColor: '#a8d8ea44', radius: 14 }
    ).setOnClick(() => {
      import('./MenuScene').then(({ MenuScene }) => {
        this.engine.switchScene(new MenuScene(this.engine))
      })
    })

    // 查看本局成语按钮（有历史记录时才显示）
    if (this.data.history && this.data.history.length > 1) {
      const btnHistory = new Button(
        width / 2 - 110, height * 0.72 + 126, 220, 42,
        { text: `查看本局成语 (${this.data.history.length}条)`, fontSize: 14, bgColor: '#16213e', borderColor: '#a8d8ea44', radius: 12 }
      ).setOnClick(() => {
        this.showHistory()
      })
      this.addObject(btnHistory)
    }

    this.addObject(btnReplay)
    this.addObject(btnMenu)

    this.engine.input.onTap((x, y) => {
      if (this.historyVisible) {
        if (this.historyCloseBtn?.handleTap(x, y)) return
        const { width: w, height: h } = this.engine
        const panelX = w * 0.06
        const panelY = h * 0.06
        const panelW = w * 0.88
        const panelH = h * 0.88
        if (x < panelX || x > panelX + panelW || y < panelY || y > panelY + panelH) {
          this.hideHistory()
        }
        return
      }
      for (const obj of this.objects) {
        if (obj instanceof Button) obj.handleTap(x, y)
      }
    })

    // 触摸滚动（成语列表弹窗）
    this.engine.input.onTouchStart((touches) => {
      if (!this.historyVisible || touches.length === 0) return
      this.historyDragging = true
      this.historyTouchStartY = touches[0].y
      this.historyScrollStartY = this.historyScrollY
      this.historyLastTouchY = touches[0].y
      this.historyLastTouchTime = Date.now()
      this.historyVelocity = 0
    })

    this.engine.input.onTouchMove((touches) => {
      if (!this.historyDragging || touches.length === 0) return
      const dy = this.historyTouchStartY - touches[0].y
      this.historyScrollY = this.clampScroll(this.historyScrollStartY + dy)
      const now = Date.now()
      const dt = now - this.historyLastTouchTime
      if (dt > 0) {
        this.historyVelocity = (this.historyLastTouchY - touches[0].y) / dt * 16
      }
      this.historyLastTouchY = touches[0].y
      this.historyLastTouchTime = now
    })

    this.engine.input.onTouchEnd(() => {
      this.historyDragging = false
    })
  }

  onExit(): void {
    super.onExit()
    this.engine.input.reset()
    TweenManager.instance.clear()
  }

  private showHistory(): void {
    this.historyVisible = true
    this.historyScrollY = 0
    this.historyVelocity = 0
    this.historyAlpha = 0
    this.historyScale = 0.6

    const { width } = this.engine
    this.historyCloseBtn = new Button(
      width * 0.06 + width * 0.88 - 48, this.engine.height * 0.06 + 8, 36, 36,
      { text: '✕', fontSize: 18, bgColor: 'transparent', borderColor: 'transparent', radius: 18 }
    ).setOnClick(() => { this.hideHistory() })

    TweenManager.instance.create({
      duration: 300,
      easing: Easing.easeOutBack,
      onUpdate: (t) => {
        this.historyScale = 0.6 + t * 0.4
        this.historyAlpha = Math.min(1, t * 1.5)
      },
    })
  }

  private hideHistory(): void {
    TweenManager.instance.create({
      duration: 200,
      easing: Easing.easeInQuad,
      onUpdate: (t) => {
        this.historyScale = 1 - t * 0.3
        this.historyAlpha = 1 - t
      },
      onComplete: () => {
        this.historyVisible = false
        this.historyCloseBtn = null
      },
    })
  }

  private clampScroll(y: number): number {
    const { height } = this.engine
    const viewH = height * 0.88 - 70
    const maxScroll = Math.max(0, this.historyContentHeight - viewH)
    return Math.max(0, Math.min(maxScroll, y))
  }

  update(deltaTime: number): void {
    super.update(deltaTime)
    // 惯性滚动
    if (this.historyVisible && !this.historyDragging && Math.abs(this.historyVelocity) > 0.5) {
      this.historyScrollY = this.clampScroll(this.historyScrollY + this.historyVelocity)
      this.historyVelocity *= 0.92
      if (Math.abs(this.historyVelocity) < 0.5) this.historyVelocity = 0
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine
    const r = this.r
    const p = this.enterProgress

    r.fillBackground(width, height)

    // 结果面板（从下滑入）
    const panelY = height * 0.12 + (1 - p) * height * 0.4
    ctx.save()
    ctx.globalAlpha = p
    r.fillRoundRect(20, panelY, width - 40, height * 0.55, 20, 'rgba(15,52,96,0.9)')
    r.strokeRoundRect(20, panelY, width - 40, height * 0.55, 20, '#a8d8ea33', 1)

    const titleText = this.data.reason.includes('赢') ? '恭喜！' : this.data.reason === '主动退出' ? '已退出' : '游戏结束'
    r.fillBoldText(titleText, width / 2, panelY + 44, '#e94560', 30)
    r.fillText(this.data.reason, width / 2, panelY + 76, '#a8d8ea', 14)

    r.drawLine(40, panelY + 94, width - 40, panelY + 94, '#a8d8ea22', 1)

    if (this.data.isNewRecord) {
      r.fillRoundRect(width / 2 - 50, panelY + 98, 100, 26, 8, '#e94560')
      r.fillBoldText('NEW RECORD!', width / 2, panelY + 111, '#ffffff', 12)
    }

    const statY = panelY + (this.data.isNewRecord ? 140 : 120)
    const statItems = [
      { label: '最终得分', value: `${this.data.score}`, color: '#e94560' },
      { label: '接龙数量', value: `${this.data.chainLength} 条`, color: '#f5f5f5' },
      { label: '最高连击', value: `${this.data.bestCombo} 连`, color: '#ffd700' },
    ]
    statItems.forEach((item, i) => {
      r.fillText(item.label, width / 2, statY + i * 52, '#a8d8ea88', 13)
      r.fillBoldText(item.value, width / 2, statY + i * 52 + 24, item.color, 24)
    })
    if (this.data.historyBestScore !== undefined) {
      r.fillText(`历史最高: ${this.data.historyBestScore}`, width / 2, statY + 3 * 52 + 10, '#a8d8ea55', 12)
    }

    for (const obj of this.objects) {
      obj.render(ctx)
    }

    ctx.restore()

    // 成语历史弹窗
    if (this.historyVisible) {
      this.renderHistoryPanel(ctx)
    }
  }

  /** 绘制成语历史弹窗 */
  private renderHistoryPanel(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine
    const r = this.r
    const history = this.data.history ?? []

    // 蒙层
    r.save()
    r.setAlpha(this.historyAlpha * 0.6)
    r.fillRect(0, 0, width, height, '#000000')
    r.resetAlpha()
    r.restore()

    const panelX = width * 0.06
    const panelY = height * 0.06
    const panelW = width * 0.88
    const panelH = height * 0.88
    const cx = panelX + panelW / 2
    const cy = panelY + panelH / 2

    ctx.save()
    ctx.globalAlpha = this.historyAlpha
    ctx.translate(cx, cy)
    ctx.scale(this.historyScale, this.historyScale)
    ctx.translate(-cx, -cy)

    r.fillRoundRect(panelX, panelY, panelW, panelH, 20, 'rgba(15, 30, 60, 0.97)')
    r.strokeRoundRect(panelX, panelY, panelW, panelH, 20, '#a8d8ea33', 1)

    r.fillBoldText(`本局成语 (${history.length}条)`, cx, panelY + 34, '#e94560', 20)
    r.drawLine(panelX + 16, panelY + 56, panelX + panelW - 16, panelY + 56, '#a8d8ea22', 1)

    this.historyCloseBtn?.render(ctx)

    // 内容区域裁剪
    const contentX = panelX + 12
    const contentY = panelY + 64
    const contentW = panelW - 24
    const contentH = panelH - 70

    ctx.save()
    ctx.beginPath()
    ctx.rect(contentX, contentY, contentW, contentH)
    ctx.clip()

    let curY = contentY + 8 - this.historyScrollY
    const itemH = 58

    for (let i = 0; i < history.length; i++) {
      const entry = history[i]
      const itemY = curY

      // 序号 + 成语卡片
      r.fillRoundRect(contentX, itemY, contentW, itemH - 6, 10, 'rgba(233,69,96,0.08)')
      r.strokeRoundRect(contentX, itemY, contentW, itemH - 6, 10, '#a8d8ea11', 1)

      // 序号
      r.fillBoldText(`${i + 1}`, contentX + 18, itemY + 18, '#e9456088', 12)

      // 成语
      r.fillBoldText(entry.word, contentX + 60, itemY + 16, '#f5f5f5', 17)
      // 拼音
      r.fillText(entry.pinyin, contentX + 60, itemY + 34, '#a8d8ea66', 10, undefined, 'left')

      // 释义（截断显示）
      if (entry.meaning) {
        const maxLen = Math.floor((contentW - 80) / 10)
        const meaning = entry.meaning.length > maxLen
          ? entry.meaning.slice(0, maxLen) + '…'
          : entry.meaning
        r.fillText(meaning, contentX + contentW - 8, itemY + 26, '#d4a57488', 10, undefined, 'right')
      }

      // 接龙箭头
      if (i < history.length - 1) {
        r.fillText('↓', cx, itemY + itemH - 2, '#a8d8ea33', 12)
      }

      curY += itemH
    }

    this.historyContentHeight = curY + this.historyScrollY - contentY + 20

    // 滚动条
    const viewH = contentH
    if (this.historyContentHeight > viewH) {
      const scrollBarH = Math.max(30, viewH * viewH / this.historyContentHeight)
      const scrollBarY = contentY + (this.historyScrollY / (this.historyContentHeight - viewH)) * (viewH - scrollBarH)
      r.fillRoundRect(panelX + panelW - 8, scrollBarY, 4, scrollBarH, 2, 'rgba(168, 216, 234, 0.25)')
    }

    ctx.restore()

    // 底部渐变遮罩
    const fadeH = 30
    const fadeY = panelY + panelH - fadeH
    const fadeGrad = ctx.createLinearGradient(0, fadeY, 0, fadeY + fadeH)
    fadeGrad.addColorStop(0, 'rgba(15, 30, 60, 0)')
    fadeGrad.addColorStop(1, 'rgba(15, 30, 60, 0.97)')
    ctx.fillStyle = fadeGrad
    ctx.beginPath()
    ctx.roundRect(panelX + 1, fadeY, panelW - 2, fadeH, [0, 0, 19, 19])
    ctx.fill()

    if (this.historyContentHeight > contentH && this.historyScrollY < this.historyContentHeight - contentH - 10) {
      r.fillText('↓ 上滑查看更多', cx, panelY + panelH - 14, '#a8d8ea55', 11)
    }

    ctx.restore()
  }
}
