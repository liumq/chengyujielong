import { IdiomDatabase } from '../data/IdiomDatabase'
import type { IdiomEntry } from '../data/IdiomDatabase'
import { ScoreManager } from './ScoreManager'

export type ChainResult =
  | { ok: true; entry: IdiomEntry; gained: number; comboText: string }
  | { ok: false; reason: '不在词库' | '已使用' | '无法接龙' | '已结束' }

/**
 * 接龙核心逻辑
 */
export class IdiomChain {
  readonly db: IdiomDatabase
  readonly score: ScoreManager

  /** 接龙历史（当局） */
  private history: IdiomEntry[] = []
  /** 当前需要接的末字拼音（null 表示首轮） */
  private currentLastPinyin: string | null = null
  /** 玩家输入字段 */
  private _inputText: string = ''
  /** 倒计时（毫秒），null 表示不限时 */
  private _timeLeft: number | null = null
  private _timeLimitMs: number
  /** 当前回合实际限时（随难度递减） */
  private _currentTimeLimit: number = 30000

  /** 游戏是否结束 */
  private _gameOver: boolean = false
  /** 结束原因 */
  private _gameOverReason: string = ''

  /** 暂停状态（弹窗时暂停倒计时） */
  private _paused: boolean = false

  /** 提示剩余次数 */
  private _hintRemain: number = 3
  /** 提示冷却时间（毫秒） */
  private _hintCooldown: number = 0
  private readonly HINT_COOLDOWN_MS = 5000
  /** 最低倒计时限制（毫秒） */
  private readonly MIN_TIME_LIMIT = 10000

  get inputText(): string { return this._inputText }
  get timeLeft(): number | null { return this._timeLeft }
  get currentTimeLimit(): number { return this._currentTimeLimit }
  get currentLastPinyin_(): string | null { return this.currentLastPinyin }
  get historyList(): IdiomEntry[] { return [...this.history] }
  get chainLength(): number { return this.history.length }
  get isGameOver(): boolean { return this._gameOver }
  get gameOverReason(): string { return this._gameOverReason }
  get paused(): boolean { return this._paused }
  get hintRemain(): number { return this._hintRemain }
  get hintCooldown(): number { return this._hintCooldown }
  get canUseHint(): boolean { return this._hintRemain > 0 && this._hintCooldown <= 0 }

  constructor(timeLimitMs = 30000) {
    this.db = new IdiomDatabase()
    this.score = new ScoreManager()
    this._timeLimitMs = timeLimitMs
    this._currentTimeLimit = timeLimitMs
  }

  /** 开始新一局 */
  start(): IdiomEntry {
    this.db.reset()
    this.score.reset()
    this.history = []
    this._inputText = ''
    this._gameOver = false
    this._gameOverReason = ''
    this._paused = false
    this._hintRemain = 3
    this._hintCooldown = 0
    this._currentTimeLimit = this._timeLimitMs

    // 随机选择起始成语（电脑先手）
    const start = this.db.getRandomStart()
    this.db.markUsed(start.word)
    this.history.push(start)
    this.currentLastPinyin = start.last
    this.resetTimer()
    return start
  }

  /** 重置倒计时（随接龙次数递减，每次减少1秒，最低 MIN_TIME_LIMIT） */
  resetTimer(): void {
    const successCount = Math.max(0, this.history.length - 1)
    const maxReduction = Math.max(0, this._timeLimitMs - this.MIN_TIME_LIMIT)
    const reduction = Math.min(successCount * 1000, maxReduction)
    this._currentTimeLimit = this._timeLimitMs - reduction
    this._timeLeft = this._currentTimeLimit
  }

  /** 暂停倒计时 */
  pause(): void { this._paused = true }

  /** 恢复倒计时 */
  resume(): void { this._paused = false }

  /** 主动退出游戏 */
  quit(): void {
    if (this._gameOver) return
    this._gameOver = true
    this._gameOverReason = '主动退出'
  }

  /** 每帧更新倒计时和提示冷却 */
  update(deltaTime: number): void {
    if (this._gameOver || this._timeLeft === null || this._paused) return

    // 更新提示冷却时间
    if (this._hintCooldown > 0) {
      this._hintCooldown = Math.max(0, this._hintCooldown - deltaTime)
    }

    this._timeLeft -= deltaTime
    if (this._timeLeft <= 0) {
      this._timeLeft = 0
      this.score.onFail()
      this._gameOver = true
      this._gameOverReason = '超时！'
    }
  }

  /**
   * 消耗一次提示机会，返回提示列表；不可用时返回 null
   */
  useHint(): IdiomEntry[] | null {
    if (!this.canUseHint) return null
    const hints = this.getHints()
    if (hints.length === 0) return null
    this._hintRemain--
    this._hintCooldown = this.HINT_COOLDOWN_MS
    return hints
  }

  /** 玩家输入字符 */
  appendInput(char: string): void {
    if (this._gameOver) return
    this._inputText += char
  }

  /** 删除最后一个输入字符 */
  deleteInput(): void {
    this._inputText = this._inputText.slice(0, -1)
  }

  /** 删除指定位置的输入字符 */
  deleteInputAt(index: number): void {
    if (index < 0 || index >= this._inputText.length) return
    this._inputText = this._inputText.slice(0, index) + this._inputText.slice(index + 1)
  }

  /** 清空输入 */
  clearInput(): void {
    this._inputText = ''
  }

  /**
   * 提交当前输入，尝试接龙
   */
  submit(): ChainResult {
    if (this._gameOver) return { ok: false, reason: '已结束' }
    const word = this._inputText.trim()
    this._inputText = ''

    if (!this.db.exists(word)) {
      this.score.onFail()
      return { ok: false, reason: '不在词库' }
    }
    if (this.db.isUsed(word)) {
      this.score.onFail()
      return { ok: false, reason: '已使用' }
    }
    if (!this.db.canFollow(word, this.currentLastPinyin)) {
      this.score.onFail()
      return { ok: false, reason: '无法接龙' }
    }

    const entry = this.db.find(word)
    if (!entry) return { ok: false, reason: '不在词库' }
    this.db.markUsed(word)
    this.history.push(entry)
    this.currentLastPinyin = entry.last
    this.resetTimer()

    const gained = this.score.addSuccess()
    const comboText = this.score.getComboText()

    // 检查是否还有成语可接
    const nextOptions = this.db.findNext(entry.last)
    if (nextOptions.length === 0) {
      this._gameOver = true
      this._gameOverReason = '无成语可接，你赢了！'
    }

    return { ok: true, entry, gained, comboText }
  }

  /**
   * 获取提示（当前可接的成语列表，数量随接龙次数递减）
   * 前5次最多3个，5-10次最多2个，10次以上最多1个
   */
  getHints(): IdiomEntry[] {
    if (!this.currentLastPinyin) return []
    const successCount = Math.max(0, this.history.length - 1)
    const maxHints = successCount >= 10 ? 1 : successCount >= 5 ? 2 : 3
    return this.db.findNext(this.currentLastPinyin).slice(0, maxHints)
  }
}
