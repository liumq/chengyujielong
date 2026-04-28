/**
 * 缓动函数集合
 */
export const Easing = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOutCubic: (t: number) => { const u = t - 1; return u * u * u + 1 },
  easeInCubic: (t: number) => t * t * t,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutBack: (t: number) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  easeOutBounce: (t: number) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
  easeInElastic: (t: number) => {
    if (t === 0 || t === 1) return t
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3))
  },
  easeOutElastic: (t: number) => {
    if (t === 0 || t === 1) return t
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
  },
}

export type EasingFn = (t: number) => number

interface TweenOptions {
  duration: number
  easing?: EasingFn
  onUpdate: (value: number) => void
  onComplete?: () => void
  delay?: number
}

/**
 * 单个 Tween 动画
 */
export class Tween {
  private duration: number
  private easing: EasingFn
  private onUpdate: (value: number) => void
  private onComplete?: () => void
  private delay: number

  private elapsed: number = 0
  private delayElapsed: number = 0
  private _done: boolean = false
  private _paused: boolean = false

  get done(): boolean { return this._done }

  constructor(options: TweenOptions) {
    this.duration = Math.max(1, options.duration)
    this.easing = options.easing ?? Easing.easeOutQuad
    this.onUpdate = options.onUpdate
    this.onComplete = options.onComplete
    this.delay = options.delay ?? 0
  }

  /** 每帧推进，由 TweenManager 调用 */
  tick(deltaTime: number): void {
    if (this._done || this._paused) return

    // 延迟阶段
    if (this.delayElapsed < this.delay) {
      this.delayElapsed += deltaTime
      return
    }

    this.elapsed += deltaTime
    const t = Math.min(this.elapsed / this.duration, 1)
    this.onUpdate(this.easing(t))

    if (t >= 1) {
      this._done = true
      this.onComplete?.()
    }
  }

  pause(): void { this._paused = true }
  resume(): void { this._paused = false }
  /** 取消动画（标记为已完成但不触发 onComplete） */
  cancel(): void { this._done = true }

  /** 链式：完成后执行下一个 Tween */
  then(options: TweenOptions): Tween {
    const next = new Tween(options)
    const originalComplete = this.onComplete
    this.onComplete = () => {
      originalComplete?.()
      TweenManager.instance.add(next)
    }
    return next
  }
}

/**
 * Tween 全局管理器（单例），每帧批量 tick 所有活跃动画
 */
export class TweenManager {
  private static _instance: TweenManager
  static get instance(): TweenManager {
    if (!TweenManager._instance) TweenManager._instance = new TweenManager()
    return TweenManager._instance
  }

  private tweens: Set<Tween> = new Set()

  /** 添加并启动一个 Tween */
  add(tween: Tween): Tween {
    this.tweens.add(tween)
    return tween
  }

  /** 创建并启动一个 Tween（快捷方法） */
  create(options: TweenOptions): Tween {
    const tween = new Tween(options)
    return this.add(tween)
  }

  /** 每帧由引擎主循环调用 */
  update(deltaTime: number): void {
    for (const tween of this.tweens) {
      tween.tick(deltaTime)
      if (tween.done) this.tweens.delete(tween)
    }
  }

  /** 清除所有动画 */
  clear(): void {
    this.tweens.clear()
  }
}
