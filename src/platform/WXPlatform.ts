import type { IPlatform, TouchPoint } from './Platform'

// 微信小游戏全局 API 类型声明（仅此文件使用）
declare const wx: {
  getSystemInfoSync(): { windowWidth: number; windowHeight: number; pixelRatio: number }
  onTouchStart(cb: (e: { touches: WXTouch[] }) => void): void
  onTouchMove(cb: (e: { touches: WXTouch[] }) => void): void
  onTouchEnd(cb: (e: { changedTouches: WXTouch[] }) => void): void
  offTouchStart(cb?: unknown): void
  offTouchMove(cb?: unknown): void
  offTouchEnd(cb?: unknown): void
  onWindowResize(cb: () => void): void
  offWindowResize(cb?: unknown): void
  getStorageSync(key: string): string | undefined
  setStorageSync(key: string, value: string): void
  removeStorageSync(key: string): void
  shareAppMessage(options: { title: string; imageUrl?: string }): void
  createCanvas(): HTMLCanvasElement
  createImage(): HTMLImageElement
  createInnerAudioContext(): WXInnerAudioContext
  login(options: { success: (res: { code: string }) => void; fail: (err: unknown) => void }): void
}

interface WXInnerAudioContext {
  src: string
  autoplay: boolean
  play(): void
  destroy(): void
  onEnded(cb: () => void): void
}

interface WXTouch {
  identifier: number
  clientX: number
  clientY: number
}

/**
 * 微信小游戏平台适配器，使用 wx.* API 实现 IPlatform 接口
 */
export class WXPlatform implements IPlatform {
  private touchStartCb: ((e: { touches: WXTouch[] }) => void) | null = null
  private touchMoveCb: ((e: { touches: WXTouch[] }) => void) | null = null
  private touchEndCb: ((e: { changedTouches: WXTouch[] }) => void) | null = null
  private resizeCb: (() => void) | null = null

  private sysInfo = wx.getSystemInfoSync()

  getScreenSize(): { width: number; height: number } {
    return { width: this.sysInfo.windowWidth, height: this.sysInfo.windowHeight }
  }

  getDevicePixelRatio(): number {
    return this.sysInfo.pixelRatio
  }

  onTouchStart(callback: (touches: TouchPoint[]) => void): void {
    this.touchStartCb = (e) => callback(this.normalize(e.touches))
    wx.onTouchStart(this.touchStartCb)
  }

  onTouchMove(callback: (touches: TouchPoint[]) => void): void {
    this.touchMoveCb = (e) => callback(this.normalize(e.touches))
    wx.onTouchMove(this.touchMoveCb)
  }

  onTouchEnd(callback: (touches: TouchPoint[]) => void): void {
    this.touchEndCb = (e) => callback(this.normalize(e.changedTouches))
    wx.onTouchEnd(this.touchEndCb)
  }

  offAllTouch(): void {
    if (this.touchStartCb) { wx.offTouchStart(this.touchStartCb); this.touchStartCb = null }
    if (this.touchMoveCb) { wx.offTouchMove(this.touchMoveCb); this.touchMoveCb = null }
    if (this.touchEndCb) { wx.offTouchEnd(this.touchEndCb); this.touchEndCb = null }
  }

  onResize(callback: () => void): void {
    this.resizeCb = callback
    wx.onWindowResize(callback)
  }

  offResize(): void {
    if (this.resizeCb) { wx.offWindowResize(this.resizeCb); this.resizeCb = null }
  }

  getStorage(key: string): string | null {
    const val = wx.getStorageSync(key)
    return val !== undefined ? String(val) : null
  }

  setStorage(key: string, value: string): void {
    wx.setStorageSync(key, value)
  }

  removeStorage(key: string): void {
    wx.removeStorageSync(key)
  }

  shareGame(title: string, imageUrl?: string): void {
    wx.shareAppMessage({ title, imageUrl })
  }

  createCanvas(width: number, height: number): HTMLCanvasElement {
    const c = wx.createCanvas()
    c.width = width
    c.height = height
    return c
  }

  loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = wx.createImage()
      img.onload = () => resolve(img)
      img.onerror = (e: unknown) => reject(e)
      img.src = src
    })
  }

  playAudio(src: string): void {
    try {
      const audio = wx.createInnerAudioContext()
      audio.src = src
      audio.autoplay = true
      audio.onEnded(() => audio.destroy())
    } catch {
      // 音频播放失败时静默忽略
    }
  }

  async wxLogin(): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => resolve(res.code),
        fail: (err) => reject(err),
      })
    })
  }

  private normalize(touches: WXTouch[]): TouchPoint[] {
    return touches.map(t => ({ id: t.identifier, x: t.clientX, y: t.clientY }))
  }
}
