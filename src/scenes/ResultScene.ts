import { Scene } from '../core/Scene'
import { CanvasRenderer } from '../render/CanvasRenderer'
import { Button } from '../ui/Button'
import { TweenManager, Easing } from '../core/Tween'
import type { Engine } from '../core/Engine'

export interface ResultData {
  score: number
  chainLength: number
  bestCombo: number
  reason: string
  isNewRecord?: boolean
  historyBestScore?: number
}

/**
 * 结算场景
 */
export class ResultScene extends Scene {
  private r: CanvasRenderer
  private engine: Engine
  private data: ResultData
  private enterProgress: number = 0

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

    // 保存存档
    this.engine.storage.incrementTotalGames()
    this.data.isNewRecord = this.engine.storage.updateBestScore(this.data.score)
    this.engine.storage.updateBestCombo(this.data.bestCombo)
    this.data.historyBestScore = this.engine.storage.getBestScore()

    // 入场动画
    TweenManager.instance.create({
      duration: 600,
      easing: Easing.easeOutCubic,
      onUpdate: (t) => { this.enterProgress = t },
    })

    // 再来一局按钮
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

    this.addObject(btnReplay)
    this.addObject(btnMenu)

    this.engine.input.onTap((x, y) => {
      for (const obj of this.objects) {
        if (obj instanceof Button) obj.handleTap(x, y)
      }
    })
  }

  onExit(): void {
    super.onExit()
    this.engine.input.destroy()
    TweenManager.instance.clear()
  }

  update(_deltaTime: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine
    const r = this.r
    const p = this.enterProgress

    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#16213e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // 结果面板（从下滑入）
    const panelY = height * 0.12 + (1 - p) * height * 0.4
    ctx.save()
    ctx.globalAlpha = p
    r.fillRoundRect(20, panelY, width - 40, height * 0.55, 20, 'rgba(15,52,96,0.9)')
    r.strokeRoundRect(20, panelY, width - 40, height * 0.55, 20, '#a8d8ea33', 1)

    // 标题
    const titleText = this.data.reason.includes('赢') ? '恭喜！' : this.data.reason === '主动退出' ? '已退出' : '游戏结束'
    r.fillBoldText(titleText, width / 2, panelY + 44, '#e94560', 30)
    r.fillText(this.data.reason, width / 2, panelY + 76, '#a8d8ea', 14)

    // 分隔线
    r.drawLine(40, panelY + 94, width - 40, panelY + 94, '#a8d8ea22', 1)

    // 新纪录标签
    if (this.data.isNewRecord) {
      r.fillRoundRect(width / 2 - 50, panelY + 98, 100, 26, 8, '#e94560')
      r.fillBoldText('NEW RECORD!', width / 2, panelY + 111, '#ffffff', 12)
    }

    // 数据
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

    ctx.restore()

    // 按钮（始终可见）
    for (const obj of this.objects) {
      obj.render(ctx)
    }
  }
}
