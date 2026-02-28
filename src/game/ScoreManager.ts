/**
 * 计分管理器
 * - 每成功接龙一次：+基础分（根据连续接龙奖励加成）
 * - 连续接龙不中断：连击数递增，分数加成递增
 * - 超时或接错：连击清零
 */
export class ScoreManager {
  private _score: number = 0
  private _combo: number = 0
  private _bestCombo: number = 0
  /** 基础每次得分 */
  private readonly BASE_SCORE = 100

  get score(): number { return this._score }
  get combo(): number { return this._combo }
  get bestCombo(): number { return this._bestCombo }

  reset(): void {
    this._score = 0
    this._combo = 0
    this._bestCombo = 0
  }

  /** 成功接龙一次 */
  addSuccess(): number {
    this._combo++
    if (this._combo > this._bestCombo) this._bestCombo = this._combo

    // 连击加成：1x / 1.5x / 2x / 3x（最高）
    const multiplier = this._combo >= 5 ? 3 : this._combo >= 3 ? 2 : this._combo >= 2 ? 1.5 : 1
    const gained = Math.round(this.BASE_SCORE * multiplier)
    this._score += gained
    return gained
  }

  /** 失败（答错/超时） */
  onFail(): void {
    this._combo = 0
  }

  /** 获取当前连击加成描述 */
  getComboText(): string {
    if (this._combo < 2) return ''
    if (this._combo < 3) return '连击 x1.5'
    if (this._combo < 5) return '连击 x2'
    return '连击 x3 MAX!'
  }
}
