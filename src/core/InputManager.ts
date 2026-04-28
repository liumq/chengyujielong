import type { IPlatform, TouchPoint } from '../platform/Platform'

export type TouchCallback = (touches: TouchPoint[]) => void
export type TapCallback = (x: number, y: number) => void

/**
 * 输入管理器，封装触摸/点击事件，提供 tap（轻触）检测
 */
export class InputManager {
  private platform: IPlatform
  /** 触摸开始时间，用于区分 tap 和长按 */
  private touchStartTime: number = 0
  /** 触摸开始位置，用于区分 tap 和滑动 */
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 }
  /** tap 判定：最大位移（px） */
  private readonly TAP_MAX_DISTANCE = 10
  /** tap 判定：最大持续时间（ms） */
  private readonly TAP_MAX_DURATION = 300

  private tapListeners: TapCallback[] = []
  private touchStartListeners: TouchCallback[] = []
  private touchMoveListeners: TouchCallback[] = []
  private touchEndListeners: TouchCallback[] = []

  constructor(platform: IPlatform) {
    this.platform = platform
    this.bindEvents()
  }

  private bindEvents(): void {
    this.platform.onTouchStart((touches) => {
      if (touches.length === 0) {
        this.touchStartTime = 0
        return
      }
      this.touchStartTime = Date.now()
      this.touchStartPos = { x: touches[0].x, y: touches[0].y }
      this.touchStartListeners.forEach(cb => cb(touches))
    })

    this.platform.onTouchMove((touches) => {
      this.touchMoveListeners.forEach(cb => cb(touches))
    })

    this.platform.onTouchEnd((touches) => {
      this.touchEndListeners.forEach(cb => cb(touches))
      this.detectTap(touches)
    })
  }

  /** tap 检测：短时间、小位移的触摸视为 tap */
  private detectTap(touches: TouchPoint[]): void {
    if (this.touchStartTime === 0) return
    const duration = Date.now() - this.touchStartTime
    if (duration > this.TAP_MAX_DURATION) return

    const endX = touches.length > 0 ? touches[0].x : this.touchStartPos.x
    const endY = touches.length > 0 ? touches[0].y : this.touchStartPos.y
    const dx = endX - this.touchStartPos.x
    const dy = endY - this.touchStartPos.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist <= this.TAP_MAX_DISTANCE) {
      this.tapListeners.forEach(cb => cb(this.touchStartPos.x, this.touchStartPos.y))
    }
  }

  /** 监听 tap 事件（轻触，最常用） */
  onTap(callback: TapCallback): void {
    this.tapListeners.push(callback)
  }

  /** 移除 tap 监听 */
  offTap(callback: TapCallback): void {
    this.tapListeners = this.tapListeners.filter(cb => cb !== callback)
  }

  /** 监听触摸开始 */
  onTouchStart(callback: TouchCallback): void {
    this.touchStartListeners.push(callback)
  }

  /** 监听触摸移动 */
  onTouchMove(callback: TouchCallback): void {
    this.touchMoveListeners.push(callback)
  }

  /** 监听触摸结束 */
  onTouchEnd(callback: TouchCallback): void {
    this.touchEndListeners.push(callback)
  }

  /** 重置所有回调（场景切换时调用，保留平台层监听） */
  reset(): void {
    this.tapListeners = []
    this.touchStartListeners = []
    this.touchMoveListeners = []
    this.touchEndListeners = []
  }

  /** 完全销毁，移除平台层事件监听（引擎停止时调用） */
  destroy(): void {
    this.platform.offAllTouch()
    this.reset()
  }
}
