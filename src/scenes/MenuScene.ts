import { Scene } from '../core/Scene'
import { CanvasRenderer } from '../render/CanvasRenderer'
import { Button } from '../ui/Button'
import { TweenManager, Easing } from '../core/Tween'
import type { Engine } from '../core/Engine'

/** 玩法说明数据：每一段包含标题和正文 */
interface HelpSection {
  title: string
  lines: string[]
}

const HELP_SECTIONS: HelpSection[] = [
  {
    title: '游戏目标',
    lines: [
      '在限定时间内，尽可能多地完成成语',
      '接龙，获取高分！考验你的成语储备',
      '和反应速度。',
    ],
  },
  {
    title: '基本规则',
    lines: [
      '1. 游戏开始时，系统随机给出一个成语',
      '2. 你需要输入一个新成语，使其首字的',
      '   拼音与上一个成语末字的拼音相同',
      '3. 例如：一马当先(xiān) → 先发制人',
      '4. 每个成语在同一局中只能使用一次',
    ],
  },
  {
    title: '操作方式',
    lines: [
      '· 点击屏幕下方的汉字按键拼出成语',
      '· 点击「确认」提交你的答案',
      '· 点击「⌫ 删除」删除最后一个字',
      '· 点击「提示」查看可选成语',
    ],
  },
  {
    title: '计分规则',
    lines: [
      '· 每成功接龙一次：+100 基础分',
      '· 连续 2 次成功：1.5 倍加成',
      '· 连续 3 次成功：2 倍加成',
      '· 连续 5 次及以上：3 倍加成（MAX）',
      '· 答错或超时将重置连击数',
    ],
  },
  {
    title: '时间限制',
    lines: [
      '· 初始限时 30 秒，随接龙成功递减',
      '· 每成功一次减少 1 秒（最低 10 秒）',
      '· 成功接龙后计时器重置',
      '· 倒计时归零则游戏结束',
    ],
  },
  {
    title: '游戏结束',
    lines: [
      '以下情况游戏结束：',
      '· 倒计时归零（超时）',
      '· 词库中无可接成语（你赢了！）',
      '结束后可查看得分、接龙数和最高连击',
    ],
  },
  {
    title: '小贴士',
    lines: [
      '· 优先选择常见拼音结尾的成语',
      '· 利用「提示」功能度过难关',
      '· 连击加成是拿高分的关键！',
      '· 多玩几局，熟悉词库中的成语',
    ],
  },
]

/**
 * 主菜单场景
 */
export class MenuScene extends Scene {
  private r: CanvasRenderer
  private engine: Engine
  private titleY: number = 0
  private titleAlpha: number = 0
  private btnAlpha: number = 0

  /** 玩法说明弹窗状态 */
  private helpVisible: boolean = false
  private helpAlpha: number = 0
  private helpScale: number = 0.6
  /** 说明内容滚动偏移（像素） */
  private helpScrollY: number = 0
  /** 说明内容总高度（像素，渲染时动态计算） */
  private helpContentHeight: number = 0
  /** 触摸滚动追踪 */
  private helpTouchStartY: number = 0
  private helpScrollStartY: number = 0
  private helpDragging: boolean = false
  /** 弹窗关闭按钮 */
  private helpCloseBtn: Button | null = null
  /** 惯性滚动速度 */
  private helpVelocity: number = 0
  private helpLastTouchY: number = 0
  private helpLastTouchTime: number = 0

  constructor(engine: Engine) {
    super()
    this.engine = engine
    this.r = new CanvasRenderer(engine.ctx)
  }

  onEnter(): void {
    TweenManager.instance.clear()
    const { width, height } = this.engine
    this.titleY = height * 0.25
    this.titleAlpha = 0
    this.btnAlpha = 0
    this.helpVisible = false
    this.helpAlpha = 0
    this.helpScale = 0.6
    this.helpScrollY = 0
    this.helpVelocity = 0

    // 开始按钮
    const btnStart = new Button(
      width / 2 - 120, height * 0.52, 240, 58,
      { text: '开始游戏', fontSize: 20, bold: true, bgColor: '#e94560', borderColor: 'transparent', radius: 16 }
    ).setOnClick(() => {
      import('./GameScene').then(({ GameScene }) => {
        this.engine.switchScene(new GameScene(this.engine))
      })
    })
    this.addObject(btnStart)

    // 玩法说明按钮
    const btnHelp = new Button(
      width / 2 - 120, height * 0.52 + 74, 240, 50,
      { text: '玩法说明', fontSize: 17, bgColor: '#0f3460', borderColor: '#a8d8ea44', radius: 14 }
    ).setOnClick(() => {
      this.showHelp()
    })
    this.addObject(btnHelp)

    // 标题入场动画
    TweenManager.instance.create({
      duration: 700,
      easing: Easing.easeOutCubic,
      onUpdate: (t) => {
        this.titleAlpha = t
        this.titleY = height * 0.25 - 30 * (1 - t)
      },
    })
    // 按钮延迟淡入
    TweenManager.instance.create({
      duration: 500,
      delay: 400,
      easing: Easing.easeOutQuad,
      onUpdate: (t) => { this.btnAlpha = t },
    })

    // 触摸事件
    this.engine.input.onTap((x, y) => {
      if (this.helpVisible) {
        // 弹窗打开时只处理关闭按钮
        if (this.helpCloseBtn?.handleTap(x, y)) return
        // 点击弹窗外区域关闭
        const { width: w, height: h } = this.engine
        const panelX = w * 0.06
        const panelY = h * 0.06
        const panelW = w * 0.88
        const panelH = h * 0.88
        if (x < panelX || x > panelX + panelW || y < panelY || y > panelY + panelH) {
          this.hideHelp()
        }
        return
      }
      for (const obj of this.objects) {
        if (obj instanceof Button) obj.handleTap(x, y)
      }
    })

    // 触摸滚动（用于说明弹窗），通过 InputManager 注册避免覆盖平台单槽监听
    this.engine.input.onTouchStart((touches) => {
      if (!this.helpVisible || touches.length === 0) return
      this.helpDragging = true
      this.helpTouchStartY = touches[0].y
      this.helpScrollStartY = this.helpScrollY
      this.helpLastTouchY = touches[0].y
      this.helpLastTouchTime = Date.now()
      this.helpVelocity = 0
    })

    this.engine.input.onTouchMove((touches) => {
      if (!this.helpDragging || touches.length === 0) return
      const dy = this.helpTouchStartY - touches[0].y
      this.helpScrollY = this.clampScroll(this.helpScrollStartY + dy)

      const now = Date.now()
      const dt = now - this.helpLastTouchTime
      if (dt > 0) {
        this.helpVelocity = (this.helpLastTouchY - touches[0].y) / dt * 16
      }
      this.helpLastTouchY = touches[0].y
      this.helpLastTouchTime = now
    })

    this.engine.input.onTouchEnd(() => {
      this.helpDragging = false
    })
  }

  onExit(): void {
    super.onExit()
    this.engine.input.reset()
    TweenManager.instance.clear()
  }

  private showHelp(): void {
    this.helpVisible = true
    this.helpScrollY = 0
    this.helpVelocity = 0
    this.helpAlpha = 0
    this.helpScale = 0.6

    // 创建关闭按钮（位置在渲染时确定，先用占位）
    const { width } = this.engine
    this.helpCloseBtn = new Button(
      width * 0.06 + width * 0.88 - 48, this.engine.height * 0.06 + 8, 36, 36,
      { text: '✕', fontSize: 18, bgColor: 'transparent', borderColor: 'transparent', radius: 18 }
    ).setOnClick(() => {
      this.hideHelp()
    })

    TweenManager.instance.create({
      duration: 300,
      easing: Easing.easeOutBack,
      onUpdate: (t) => {
        this.helpScale = 0.6 + t * 0.4
        this.helpAlpha = Math.min(1, t * 1.5)
      },
    })
  }

  private hideHelp(): void {
    TweenManager.instance.create({
      duration: 200,
      easing: Easing.easeInQuad,
      onUpdate: (t) => {
        this.helpScale = 1 - t * 0.3
        this.helpAlpha = 1 - t
      },
      onComplete: () => {
        this.helpVisible = false
        this.helpCloseBtn = null
      },
    })
  }

  private clampScroll(y: number): number {
    const { height } = this.engine
    const viewH = height * 0.88 - 70
    const maxScroll = Math.max(0, this.helpContentHeight - viewH)
    return Math.max(0, Math.min(maxScroll, y))
  }

  update(_deltaTime: number): void {
    // 惯性滚动
    if (this.helpVisible && !this.helpDragging && Math.abs(this.helpVelocity) > 0.5) {
      this.helpScrollY = this.clampScroll(this.helpScrollY + this.helpVelocity)
      this.helpVelocity *= 0.92
      if (Math.abs(this.helpVelocity) < 0.5) this.helpVelocity = 0
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine
    const r = this.r

    // 背景（使用缓存渐变）
    r.fillBackground(width, height)

    // 装饰圆
    r.save()
    r.setAlpha(0.06)
    r.fillCircle(width * 0.85, height * 0.15, 120, '#e94560')
    r.fillCircle(width * 0.1, height * 0.7, 80, '#a8d8ea')
    r.resetAlpha()
    r.restore()

    // 标题
    r.save()
    r.setAlpha(this.titleAlpha)
    r.fillBoldText('成语接龙', width / 2, this.titleY, '#e94560', 52)
    r.fillText('IDIOM CHAIN', width / 2, this.titleY + 44, '#e9456077', 14)
    r.fillText('单机益智·挑战词汇量', width / 2, this.titleY + 72, '#a8d8ea88', 14)
    r.resetAlpha()
    r.restore()

    // 按钮
    r.save()
    r.setAlpha(this.btnAlpha)
    for (const obj of this.objects) {
      obj.render(ctx)
    }
    r.resetAlpha()
    r.restore()

    const bestScore = this.engine.storage.getBestScore()
    const totalGames = this.engine.storage.getTotalGames()
    if (bestScore > 0) {
      r.fillText(`最高分: ${bestScore}  共玩 ${totalGames} 局`, width / 2, height - 24, '#a8d8ea55', 12)
    } else {
      r.fillText('v0.1.0 · 成语接龙', width / 2, height - 24, '#f5f5f522', 11)
    }

    // 玩法说明弹窗
    if (this.helpVisible) {
      this.renderHelpPanel(ctx)
    }
  }

  /** 绘制玩法说明弹窗 */
  private renderHelpPanel(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine
    const r = this.r

    // 蒙层
    r.save()
    r.setAlpha(this.helpAlpha * 0.6)
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
    ctx.globalAlpha = this.helpAlpha
    ctx.translate(cx, cy)
    ctx.scale(this.helpScale, this.helpScale)
    ctx.translate(-cx, -cy)

    // 面板背景
    r.fillRoundRect(panelX, panelY, panelW, panelH, 20, 'rgba(15, 30, 60, 0.97)')
    r.strokeRoundRect(panelX, panelY, panelW, panelH, 20, '#a8d8ea33', 1)

    // 标题栏（固定）
    r.fillBoldText('玩法说明', cx, panelY + 34, '#e94560', 22)
    r.drawLine(panelX + 16, panelY + 56, panelX + panelW - 16, panelY + 56, '#a8d8ea22', 1)

    // 关闭按钮
    this.helpCloseBtn?.render(ctx)

    // 内容区域裁剪
    const contentX = panelX + 16
    const contentY = panelY + 64
    const contentW = panelW - 32
    const contentH = panelH - 70

    ctx.save()
    ctx.beginPath()
    ctx.rect(contentX, contentY, contentW, contentH)
    ctx.clip()

    // 绘制说明内容
    let curY = contentY + 8 - this.helpScrollY
    const sectionGap = 20
    const titleFontSize = 15
    const lineFontSize = 13
    const lineHeight = 22

    for (const section of HELP_SECTIONS) {
      // 段落标题装饰条
      r.fillRoundRect(contentX, curY, 4, titleFontSize + 4, 2, '#e94560')
      r.fillBoldText(section.title, contentX + 14, curY + titleFontSize / 2 + 2, '#a8d8ea', titleFontSize, undefined, 'left', 'middle')
      curY += titleFontSize + 12

      // 段落正文
      for (const line of section.lines) {
        r.fillText(line, contentX + 8, curY + lineFontSize / 2, '#d0d8e8cc', lineFontSize, undefined, 'left', 'middle')
        curY += lineHeight
      }

      curY += sectionGap
    }

    // 记录内容总高度（用于滚动限制）
    this.helpContentHeight = curY + this.helpScrollY - contentY + 20

    // 滚动条
    const viewH = contentH
    if (this.helpContentHeight > viewH) {
      const scrollBarH = Math.max(30, viewH * viewH / this.helpContentHeight)
      const scrollBarY = contentY + (this.helpScrollY / (this.helpContentHeight - viewH)) * (viewH - scrollBarH)
      r.fillRoundRect(panelX + panelW - 8, scrollBarY, 4, scrollBarH, 2, 'rgba(168, 216, 234, 0.25)')
    }

    ctx.restore()

    // 底部渐变遮罩（提示可滚动）
    const fadeH = 30
    const fadeY = panelY + panelH - fadeH
    const fadeGrad = ctx.createLinearGradient(0, fadeY, 0, fadeY + fadeH)
    fadeGrad.addColorStop(0, 'rgba(15, 30, 60, 0)')
    fadeGrad.addColorStop(1, 'rgba(15, 30, 60, 0.97)')
    ctx.fillStyle = fadeGrad
    ctx.beginPath()
    ctx.roundRect(panelX + 1, fadeY, panelW - 2, fadeH, [0, 0, 19, 19])
    ctx.fill()

    // 底部滚动提示
    if (this.helpContentHeight > contentH && this.helpScrollY < this.helpContentHeight - contentH - 10) {
      r.fillText('↓ 上滑查看更多', cx, panelY + panelH - 14, '#a8d8ea55', 11)
    }

    ctx.restore()
  }
}
