import { SceneManager } from './Scene'
import { InputManager } from './InputManager'
import { TweenManager } from './Tween'
import { StorageManager } from '../data/StorageManager'
import { AudioManager } from '../audio/AudioManager'
import { AuthManager } from '../auth/AuthManager'
import type { Scene } from './Scene'
import type { IPlatform } from '../platform/Platform'


/**
 * 游戏引擎，管理主循环、Canvas 上下文、场景和输入
 */
export class Engine {
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  readonly sceneManager: SceneManager
  readonly input: InputManager
  readonly platform: IPlatform
  readonly storage: StorageManager
  readonly audio: AudioManager
  readonly auth: AuthManager

  /** Canvas 逻辑宽度（CSS 像素，供场景使用） */
  private _logicWidth: number = 0
  /** Canvas 逻辑高度（CSS 像素，供场景使用） */
  private _logicHeight: number = 0

  get width(): number { return this._logicWidth }
  get height(): number { return this._logicHeight }

  private lastTime: number = 0
  private running: boolean = false
  private rafId: number = 0

  constructor(canvas: HTMLCanvasElement, platform: IPlatform) {
    this.canvas = canvas
    this.platform = platform

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法获取 Canvas 2D 上下文')
    this.ctx = ctx

    this.sceneManager = new SceneManager()
    this.input = new InputManager(platform)
    this.storage = new StorageManager(platform)
    this.audio = new AudioManager(this.storage.getSfxEnabled())
    this.auth = new AuthManager(platform, this.storage)

    // 监听窗口 resize，自动重新适配
    platform.onResize(() => {
      this.resizeCanvas()
    })

    this.resizeCanvas()
  }

  /** 启动引擎，切换到初始场景（重复调用时先停止已有循环） */
  start(initialScene: Scene): void {
    if (this.running) {
      cancelAnimationFrame(this.rafId)
    }
    this.sceneManager.switchTo(initialScene)
    this.running = true
    this.lastTime = 0
    this.rafId = requestAnimationFrame((t) => this.loop(t))
  }

  /** 停止引擎 */
  stop(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.sceneManager.clear()
    TweenManager.instance.clear()
    this.input.destroy()
    this.platform.offResize()
  }

  /** 切换场景 */
  switchScene(scene: Scene): void {
    this.sceneManager.switchTo(scene)
  }

  /** 根据屏幕尺寸重新设置 Canvas 大小（竖屏 9:16） */
  resizeCanvas(): void {
    const dpr = this.platform.getDevicePixelRatio()
    const { width: screenW, height: screenH } = this.platform.getScreenSize()
    const maxWidth = 450

    let w = Math.min(screenW, maxWidth)
    let h = Math.round(w * 16 / 9)
    if (h > screenH) {
      h = screenH
      w = Math.round(h * 9 / 16)
    }

    this._logicWidth = w
    this._logicHeight = h

    this.canvas.style.width = `${w}px`
    this.canvas.style.height = `${h}px`
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)

    // 重置变换矩阵后设置 DPR 缩放，避免多次 resize 导致 scale 累乘
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /** 主循环 */
  private loop(timestamp: number): void {
    if (!this.running) return

    const deltaTime = this.lastTime === 0 ? 0 : Math.min(timestamp - this.lastTime, 100)
    this.lastTime = timestamp

    this.update(deltaTime)
    this.draw()

    this.rafId = requestAnimationFrame((t) => this.loop(t))
  }

  private update(deltaTime: number): void {
    TweenManager.instance.update(deltaTime)
    this.sceneManager.update(deltaTime)
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.sceneManager.render(this.ctx)
  }
}
