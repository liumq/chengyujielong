type SoundName = 'correct' | 'wrong' | 'combo' | 'gameover' | 'tap'

/**
 * 音效管理器（Web Audio API 程序化合成音效）
 */
export class AudioManager {
  private audioCtx: AudioContext | null = null
  private enabled: boolean = true

  constructor(enabled = true) {
    this.enabled = enabled
  }

  private getCtx(): AudioContext | null {
    if (!this.enabled) return null
    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioContext()
      } catch {
        return null
      }
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }
    return this.audioCtx
  }

  play(name: SoundName): void {
    const ctx = this.getCtx()
    if (!ctx) return

    try {
      switch (name) {
        case 'tap': this.playTap(ctx); break
        case 'correct': this.playSuccess(ctx); break
        case 'wrong': this.playWrong(ctx); break
        case 'combo': this.playCombo(ctx); break
        case 'gameover': this.playGameOver(ctx); break
      }
    } catch {
      // 静默忽略
    }
  }

  /** 单音符，可指定波形 */
  private playTone(
    ctx: AudioContext, freq: number, duration: number, volume: number,
    type: OscillatorType = 'sine', startTime = 0,
  ): void {
    const t0 = ctx.currentTime + startTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = type
    gain.gain.setValueAtTime(volume, t0)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
    osc.start(t0)
    osc.stop(t0 + duration)
  }

  /** 点击音：清脆短促的双音叠加 */
  private playTap(ctx: AudioContext): void {
    this.playTone(ctx, 880, 0.04, 0.04, 'sine')
    this.playTone(ctx, 1320, 0.03, 0.02, 'triangle')
  }

  /** 正确音：明快上升琶音 + 和弦尾音 */
  private playSuccess(ctx: AudioContext): void {
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      this.playTone(ctx, freq, 0.15, 0.07, 'sine', i * 0.07)
    })
    // 和弦尾音
    this.playTone(ctx, 523, 0.3, 0.03, 'triangle', 0.28)
    this.playTone(ctx, 784, 0.3, 0.03, 'triangle', 0.28)
    this.playTone(ctx, 1047, 0.3, 0.03, 'triangle', 0.28)
  }

  /** 错误音：不和谐下行 + 嗡鸣 */
  private playWrong(ctx: AudioContext): void {
    this.playTone(ctx, 370, 0.12, 0.06, 'sawtooth')
    this.playTone(ctx, 277, 0.15, 0.05, 'sawtooth', 0.08)
    // 低频嗡鸣
    this.playTone(ctx, 110, 0.2, 0.04, 'sine', 0.05)
  }

  /** 连击音：华丽快速音阶 + 闪亮高音 */
  private playCombo(ctx: AudioContext): void {
    const scale = [523, 659, 784, 988, 1175, 1318]
    scale.forEach((freq, i) => {
      this.playTone(ctx, freq, 0.1, 0.06, 'sine', i * 0.045)
    })
    // 闪亮高音叠加
    this.playTone(ctx, 2093, 0.25, 0.03, 'triangle', 0.25)
    this.playTone(ctx, 1568, 0.3, 0.02, 'sine', 0.27)
  }

  /** 游戏结束音：庄重下行 + 低鸣收尾 */
  private playGameOver(ctx: AudioContext): void {
    const descent = [523, 440, 349, 262]
    descent.forEach((freq, i) => {
      this.playTone(ctx, freq, 0.25, 0.07, 'sine', i * 0.18)
    })
    // 低鸣收尾
    this.playTone(ctx, 131, 0.6, 0.05, 'triangle', 0.72)
    this.playTone(ctx, 165, 0.5, 0.03, 'sine', 0.72)
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled && this.audioCtx) {
      this.audioCtx.suspend().catch(() => {})
    } else if (enabled && this.audioCtx) {
      this.audioCtx.resume().catch(() => {})
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }
}
