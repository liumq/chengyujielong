import { Scene } from '../core/Scene'
import { CanvasRenderer } from '../render/CanvasRenderer'
import { ParticleSystem } from '../render/ParticleSystem'
import { Button } from '../ui/Button'
import { IdiomChain } from '../game/IdiomChain'
import { TweenManager, Easing } from '../core/Tween'
import type { Engine } from '../core/Engine'
import type { IdiomEntry } from '../data/IdiomDatabase'

/**
 * 游戏主场景
 * 动态键盘：从可接龙的成语中提取汉字，混入干扰字后展示
 */
export class GameScene extends Scene {
  private r: CanvasRenderer
  private engine: Engine
  private chain: IdiomChain
  private particles: ParticleSystem = new ParticleSystem()

  /** 当前显示的成语（最后一条） */
  private currentIdiom: IdiomEntry | null = null
  /** 反馈消息 */
  private feedbackMsg: string = ''
  private feedbackColor: string = '#4caf50'
  private feedbackAlpha: number = 0
  /** 分数跳动动画 */
  private scoreScale: number = 1
  /** 连击文字 */
  private comboText: string = ''
  private comboAlpha: number = 0
  /** 屏幕闪烁效果 */
  private screenFlashAlpha: number = 0
  private screenFlashColor: string = '#4caf50'

  /** 动态键盘相关 */
  private keyChars: string[] = []
  private keyButtons: Button[] = []
  /** 功能按钮 */
  private deleteBtn: Button | null = null
  private hintBtn: Button | null = null
  private submitBtn: Button | null = null
  /** 退出按钮 */
  private quitBtn: Button | null = null
  /** 键盘布局常量 */
  private readonly KEYBOARD_COLS = 5
  private readonly KEY_H = 46
  private readonly KEY_GAP = 4
  /** 键盘起始 Y（在 buildKeyboard 中计算） */
  private keyboardStartY = 0
  /** 超时结算是否已触发 */
  private timeoutHandled = false
  /** 退出确认弹窗是否可见 */
  private quitDialogVisible = false
  /** 退出弹窗按钮 */
  private quitConfirmBtn: Button | null = null
  private quitCancelBtn: Button | null = null

  constructor(engine: Engine) {
    super()
    this.engine = engine
    this.r = new CanvasRenderer(engine.ctx)
    this.chain = new IdiomChain(30000)
  }

  onEnter(): void {
    TweenManager.instance.clear()

    const startIdiom = this.chain.start()
    this.currentIdiom = startIdiom
    this.timeoutHandled = false
    this.quitDialogVisible = false

    this.refreshKeyboard()

    this.engine.input.onTap((x, y) => {
      // 退出确认弹窗打开时，只处理弹窗按钮
      if (this.quitDialogVisible) {
        if (this.quitConfirmBtn?.handleTap(x, y)) {
          this.engine.audio.play('tap')
          this.quitDialogVisible = false
          this.chain.resume()
          this.chain.quit()
          setTimeout(() => this.goResult(), 300)
        }
        if (this.quitCancelBtn?.handleTap(x, y)) {
          this.engine.audio.play('tap')
          this.quitDialogVisible = false
          this.chain.resume()
        }
        return
      }

      if (this.chain.isGameOver) return

      // 退出按钮
      if (this.quitBtn?.handleTap(x, y)) {
        this.engine.audio.play('tap')
        this.showQuitDialog()
        return
      }
      // 功能键
      if (this.deleteBtn?.handleTap(x, y)) {
        this.engine.audio.play('tap')
        this.chain.deleteInput()
        return
      }
      if (this.hintBtn?.handleTap(x, y)) {
        this.engine.audio.play('tap')
        this.showHint()
        return
      }
      if (this.submitBtn?.handleTap(x, y)) {
        this.engine.audio.play('tap')
        this.doSubmit()
        return
      }
      // 汉字键
      for (const btn of this.keyButtons) {
        if (btn.handleTap(x, y)) {
          this.engine.audio.play('tap')
          if (this.chain.inputText.length < 4) {
            this.chain.appendInput((btn as unknown as { _char: string })._char)
          }
          return
        }
      }
    })
  }

  onExit(): void {
    super.onExit()
    this.engine.input.destroy()
    TweenManager.instance.clear()
  }

  /**
   * 根据当前可接龙的成语，生成动态键盘字符
   * 策略：取所有可接成语的汉字去重，按难度控制候选字与干扰字的比例，打散排列
   * 难度递增：初始候选字占70%，5次后50%，10次后30%
   */
  private generateKeyChars(): string[] {
    const candidates = this.chain.getHints().length > 0
      ? this.chain.db.findNext(this.chain.currentLastPinyin_!)
      : []

    const total = 20
    const successCount = Math.max(0, this.chain.chainLength - 1)
    // 根据接龙次数调整候选字上限比例
    const candidateRatio = successCount >= 10 ? 0.3 : successCount >= 5 ? 0.5 : 0.7
    const maxCandidateChars = Math.floor(total * candidateRatio)

    // 从候选成语中提取所有唯一汉字
    const candidateChars: string[] = []
    const candidateCharSet = new Set<string>()
    for (const entry of candidates) {
      for (const ch of entry.word) {
        if (!candidateCharSet.has(ch)) {
          candidateCharSet.add(ch)
          candidateChars.push(ch)
        }
      }
    }

    // 截取候选字到上限
    const usedCandidates = candidateChars.slice(0, maxCandidateChars)
    const resultSet = new Set<string>(usedCandidates)

    // 用干扰字填满剩余位置
    const allChars = this.getAllCharsFromDB()
    while (resultSet.size < total && allChars.length > 0) {
      const idx = Math.floor(Math.random() * allChars.length)
      resultSet.add(allChars[idx])
      allChars.splice(idx, 1)
    }

    // 转数组并打散
    const chars = Array.from(resultSet)
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    return chars.slice(0, total)
  }

  /** 从词库中获取所有不重复的汉字（用于干扰字） */
  private getAllCharsFromDB(): string[] {
    return this.chain.db.getAllChars()
  }

  /** 刷新键盘：清除旧按钮，生成新字符，创建新按钮 */
  private refreshKeyboard(): void {
    this.objects = []
    this.keyButtons = []
    this.deleteBtn = null
    this.hintBtn = null
    this.submitBtn = null
    this.quitBtn = null

    this.keyChars = this.generateKeyChars()
    this.buildKeyboard()
  }

  /** 构建键盘按钮和退出按钮 */
  private buildKeyboard(): void {
    const { width, height } = this.engine
    const cols = this.KEYBOARD_COLS
    const keyW = Math.floor((width - 20) / cols)
    const keyH = this.KEY_H
    const gap = this.KEY_GAP

    const rows = Math.ceil(this.keyChars.length / cols)
    const totalKeyboardH = (rows + 1) * (keyH + gap) + 12
    this.keyboardStartY = height - totalKeyboardH - 16

    // 退出按钮（顶栏右上角）
    this.quitBtn = new Button(width - 62, 18, 48, 36, {
      text: '退出', fontSize: 12, bgColor: 'rgba(83,52,131,0.6)', borderColor: '#a8d8ea33', radius: 8,
    }).setOnClick(() => {})
    this.addObject(this.quitBtn)

    // 汉字键
    this.keyChars.forEach((ch, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = 10 + col * (keyW + 2)
      const y = this.keyboardStartY + row * (keyH + gap)
      const btn = new Button(x, y, keyW - 2, keyH, {
        text: ch, fontSize: 18, bgColor: '#0f3460', borderColor: '#a8d8ea33', radius: 8,
      }).setOnClick(() => {})
      ;(btn as unknown as { _char: string })._char = ch
      this.keyButtons.push(btn)
      this.addObject(btn)
    })

    // 功能键行
    const funcY = this.keyboardStartY + rows * (keyH + gap) + 4
    this.deleteBtn = new Button(10, funcY, keyW * 2 - 2, keyH, {
      text: '⌫ 删除', fontSize: 16, bgColor: '#533483', borderColor: 'transparent', radius: 8,
    }).setOnClick(() => {})
    this.addObject(this.deleteBtn)

    const hintText = this.getHintBtnText()
    this.hintBtn = new Button(10 + keyW * 2 + 2, funcY, keyW - 2, keyH, {
      text: hintText, fontSize: 13, bgColor: this.chain.canUseHint ? '#16213e' : '#1a1a2e', borderColor: '#a8d8ea55', radius: 8,
    }).setOnClick(() => {})
    this.addObject(this.hintBtn)

    this.submitBtn = new Button(10 + keyW * 3 + 4, funcY, keyW * 2 - 12, keyH, {
      text: '确认', fontSize: 16, bold: true, bgColor: '#e94560', borderColor: 'transparent', radius: 8,
    }).setOnClick(() => {})
    this.addObject(this.submitBtn)
  }

  /** 获取提示按钮的动态文案 */
  private getHintBtnText(): string {
    if (this.chain.hintRemain <= 0) return '提示(0)'
    if (this.chain.hintCooldown > 0) {
      const sec = Math.ceil(this.chain.hintCooldown / 1000)
      return `${sec}s`
    }
    return `提示(${this.chain.hintRemain})`
  }

  private doSubmit(): void {
    if (this.chain.inputText.length < 4) {
      this.showFeedback('请输入完整的4字成语', '#ff9800')
      this.engine.audio.play('wrong')
      return
    }
    const result = this.chain.submit()
    if (result.ok) {
      this.currentIdiom = result.entry
      this.showFeedback(`+${result.gained}`, '#4caf50')
      const { width } = this.engine
      this.particles.burst(width / 2, this.engine.height * 0.32, result.comboText ? 28 : 18)
      this.engine.audio.play(result.comboText ? 'combo' : 'correct')
      this.triggerScreenFlash(result.comboText ? '#ffd700' : '#4caf50')

      if (result.comboText) {
        this.comboText = result.comboText
        this.comboAlpha = 1
        TweenManager.instance.create({
          duration: 1500, delay: 500, easing: Easing.linear,
          onUpdate: (t) => { this.comboAlpha = 1 - t },
        })
      }

      TweenManager.instance.create({
        duration: 200, easing: Easing.easeOutBack,
        onUpdate: (t) => { this.scoreScale = 1 + t * 0.3 },
      }).then({
        duration: 150,
        onUpdate: (t) => { this.scoreScale = 1.3 - t * 0.3 },
        onComplete: () => { this.scoreScale = 1 },
      })

      // 刷新键盘（新的可接龙汉字）
      this.refreshKeyboard()

      if (this.chain.isGameOver) {
        setTimeout(() => this.goResult(), 1500)
      }
    } else {
      const msgMap = {
        '不在词库': '成语不存在',
        '已使用': '该成语已用过',
        '无法接龙': `需要以"${this.chain.currentLastPinyin_}"音开头`,
        '超时': '超时！',
      }
      this.showFeedback(msgMap[result.reason], '#e94560')
      this.engine.audio.play('wrong')
      this.triggerScreenFlash('#e94560')
    }
  }

  private showHint(): void {
    if (this.chain.hintRemain <= 0) {
      this.showFeedback('提示次数已用完', '#ff9800')
      this.engine.audio.play('wrong')
      return
    }
    if (this.chain.hintCooldown > 0) {
      const sec = Math.ceil(this.chain.hintCooldown / 1000)
      this.showFeedback(`冷却中(${sec}s)`, '#ff9800')
      this.engine.audio.play('wrong')
      return
    }
    const hints = this.chain.useHint()
    if (!hints || hints.length === 0) {
      this.showFeedback('暂无提示', '#ff9800')
      return
    }
    this.showFeedback(`提示：${hints[0].word}`, '#a8d8ea')
  }

  /** 显示退出确认弹窗 */
  private showQuitDialog(): void {
    this.quitDialogVisible = true
    this.chain.pause()

    const { width, height } = this.engine
    const panelW = 260
    const panelH = 150
    const panelX = (width - panelW) / 2
    const panelY = (height - panelH) / 2

    this.quitConfirmBtn = new Button(panelX + 20, panelY + panelH - 56, 100, 40, {
      text: '确认退出', fontSize: 14, bold: true, bgColor: '#e94560', borderColor: 'transparent', radius: 10,
    }).setOnClick(() => {})

    this.quitCancelBtn = new Button(panelX + panelW - 120, panelY + panelH - 56, 100, 40, {
      text: '继续游戏', fontSize: 14, bgColor: '#0f3460', borderColor: '#a8d8ea55', radius: 10,
    }).setOnClick(() => {})
  }

  /** 触发全屏闪烁效果 */
  private triggerScreenFlash(color: string): void {
    this.screenFlashColor = color
    this.screenFlashAlpha = 0.2
    TweenManager.instance.create({
      duration: 350,
      easing: Easing.easeOutQuad,
      onUpdate: (t) => { this.screenFlashAlpha = 0.2 * (1 - t) },
      onComplete: () => { this.screenFlashAlpha = 0 },
    })
  }

  private showFeedback(msg: string, color: string): void {
    this.feedbackMsg = msg
    this.feedbackColor = color
    this.feedbackAlpha = 1
    TweenManager.instance.create({
      duration: 1800, delay: 400, easing: Easing.easeOutQuad,
      onUpdate: (t) => { this.feedbackAlpha = 1 - t },
    })
  }

  private goResult(): void {
    import('./ResultScene').then(({ ResultScene }) => {
      this.engine.switchScene(new ResultScene(this.engine, {
        score: this.chain.score.score,
        chainLength: this.chain.chainLength,
        bestCombo: this.chain.score.bestCombo,
        reason: this.chain.gameOverReason,
      }))
    })
  }

  update(deltaTime: number): void {
    super.update(deltaTime)
    this.chain.update(deltaTime)
    this.particles.update(deltaTime)

    // 动态更新提示按钮文案和样式
    if (this.hintBtn) {
      this.hintBtn.text = this.getHintBtnText()
      this.hintBtn.bgColor = this.chain.canUseHint ? '#16213e' : '#1a1a2e'
    }

    if (this.chain.isGameOver && this.chain.gameOverReason === '超时！' && !this.timeoutHandled) {
      this.timeoutHandled = true
      setTimeout(() => this.goResult(), 500)
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine
    const r = this.r

    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#16213e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // === 顶栏：分数 & 接龙数 ===
    r.fillRoundRect(10, 10, width - 20, 54, 12, 'rgba(15,52,96,0.7)')
    r.fillText('分数', width / 4, 26, '#a8d8ea88', 12)
    ctx.save()
    ctx.translate(width / 4, 46)
    ctx.scale(this.scoreScale, this.scoreScale)
    r.fillBoldText(`${this.chain.score.score}`, 0, 0, '#e94560', 22)
    ctx.restore()

    r.fillText('接龙数', width * 2 / 4, 26, '#a8d8ea88', 12)
    r.fillBoldText(`${this.chain.chainLength}`, width * 2 / 4, 46, '#f5f5f5', 22)

    // 退出按钮
    this.quitBtn?.render(ctx)

    // === 倒计时进度条（使用动态时间上限） ===
    const currentLimit = this.chain.currentTimeLimit
    const timeLeft = this.chain.timeLeft ?? currentLimit
    const barW = width - 20
    const barProgress = timeLeft / currentLimit
    const barColor = barProgress > 0.5 ? '#4caf50' : barProgress > 0.25 ? '#ff9800' : '#e94560'
    r.fillRoundRect(10, 68, barW, 6, 3, '#ffffff11')
    r.fillRoundRect(10, 68, Math.max(0, barW * barProgress), 6, 3, barColor)

    // === 难度信息：当前限时 ===
    const timeLimitSec = Math.round(currentLimit / 1000)
    r.fillText(`限时 ${timeLimitSec}s`, width - 40, 80, '#a8d8ea66', 10)

    // === 当前成语展示（固定位置，只显示最后一条） ===
    const idiomY = 88
    if (this.currentIdiom) {
      r.fillRoundRect(10, idiomY, width - 20, 56, 10, 'rgba(233,69,96,0.15)')
      r.strokeRoundRect(10, idiomY, width - 20, 56, 10, '#e9456044', 1)
      r.fillBoldText(this.currentIdiom.word, width / 2, idiomY + 20, '#f5f5f5', 22)
      r.fillText(this.currentIdiom.pinyin, width / 2, idiomY + 42, '#a8d8ea88', 11)
    }

    // === 接龙提示 ===
    const hintLineY = idiomY + 64
    const lastPinyin = this.chain.currentLastPinyin_
    if (lastPinyin) {
      r.fillText(
        `请接「${lastPinyin}」音开头的成语`, width / 2, hintLineY, '#a8d8eaaa', 13,
      )
    }

    // === 输入框（固定在键盘上方） ===
    const inputBoxY = this.keyboardStartY - 62
    const inputWord = this.chain.inputText
    r.fillRoundRect(10, inputBoxY, width - 20, 52, 12, 'rgba(83,52,131,0.4)')
    r.strokeRoundRect(10, inputBoxY, width - 20, 52, 12, '#a8d8ea55', 1)

    if (inputWord) {
      const charSpacing = 28
      const totalW = (inputWord.length - 1) * charSpacing
      const startX = width / 2 - totalW / 2
      for (let i = 0; i < inputWord.length; i++) {
        r.fillBoldText(inputWord[i], startX + i * charSpacing, inputBoxY + 26, '#f5f5f5', 22)
      }
      for (let i = inputWord.length; i < 4; i++) {
        const cx = startX + i * charSpacing
        r.strokeRoundRect(cx - 11, inputBoxY + 10, 22, 32, 4, '#a8d8ea33', 1)
      }
    } else {
      r.fillText(
        lastPinyin ? `点击下方汉字拼出成语` : '请输入成语',
        width / 2, inputBoxY + 26, '#a8d8ea55', 14,
      )
    }

    // === 反馈消息 ===
    if (this.feedbackAlpha > 0) {
      r.save()
      r.setAlpha(this.feedbackAlpha)
      r.fillBoldText(this.feedbackMsg, width / 2, inputBoxY - 16, this.feedbackColor, 16)
      r.resetAlpha()
      r.restore()
    }

    // === 连击文字 ===
    if (this.comboAlpha > 0) {
      r.save()
      r.setAlpha(this.comboAlpha)
      r.fillBoldText(this.comboText, width - 60, 50, '#ffd700', 13)
      r.resetAlpha()
      r.restore()
    }

    // === 键盘按钮 ===
    for (const btn of this.keyButtons) {
      btn.render(ctx)
    }
    this.deleteBtn?.render(ctx)
    this.hintBtn?.render(ctx)
    this.submitBtn?.render(ctx)

    // === 粒子特效 ===
    this.particles.render(ctx)

    // === 屏幕闪烁效果 ===
    if (this.screenFlashAlpha > 0) {
      r.save()
      r.setAlpha(this.screenFlashAlpha)
      r.fillRect(0, 0, width, height, this.screenFlashColor)
      r.resetAlpha()
      r.restore()
    }

    // === 退出确认弹窗 ===
    if (this.quitDialogVisible) {
      this.renderQuitDialog(ctx)
    }
  }

  /** 绘制退出确认弹窗 */
  private renderQuitDialog(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine
    const r = this.r

    // 半透明蒙层
    r.fillRect(0, 0, width, height, 'rgba(0,0,0,0.55)')

    // 弹窗面板
    const panelW = 260
    const panelH = 150
    const panelX = (width - panelW) / 2
    const panelY = (height - panelH) / 2

    r.fillRoundRect(panelX, panelY, panelW, panelH, 16, 'rgba(15, 30, 60, 0.97)')
    r.strokeRoundRect(panelX, panelY, panelW, panelH, 16, '#a8d8ea33', 1)

    r.fillBoldText('确认退出？', width / 2, panelY + 30, '#f5f5f5', 18)
    r.fillText('退出后将结算当前成绩', width / 2, panelY + 58, '#a8d8ea88', 13)

    // 弹窗按钮
    this.quitConfirmBtn?.render(ctx)
    this.quitCancelBtn?.render(ctx)
  }
}
