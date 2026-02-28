import type { IPlatform, TouchPoint } from './Platform'

/**
 * H5 平台适配器，使用浏览器原生 DOM API 实现 IPlatform 接口
 */
export class H5Platform implements IPlatform {
  private canvas: HTMLCanvasElement
  private touchStartHandler: ((e: TouchEvent | MouseEvent) => void) | null = null
  private touchMoveHandler: ((e: TouchEvent | MouseEvent) => void) | null = null
  private touchEndHandler: ((e: TouchEvent | MouseEvent) => void) | null = null
  private resizeHandler: (() => void) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  getScreenSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }

  getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1
  }

  onTouchStart(callback: (touches: TouchPoint[]) => void): void {
    this.touchStartHandler = (e: TouchEvent | MouseEvent) => {
      e.preventDefault()
      callback(this.normalizeTouches(e))
    }
    this.canvas.addEventListener('touchstart', this.touchStartHandler as EventListener, { passive: false })
    this.canvas.addEventListener('mousedown', this.touchStartHandler as EventListener)
  }

  onTouchMove(callback: (touches: TouchPoint[]) => void): void {
    this.touchMoveHandler = (e: TouchEvent | MouseEvent) => {
      e.preventDefault()
      callback(this.normalizeTouches(e))
    }
    this.canvas.addEventListener('touchmove', this.touchMoveHandler as EventListener, { passive: false })
    this.canvas.addEventListener('mousemove', this.touchMoveHandler as EventListener)
  }

  onTouchEnd(callback: (touches: TouchPoint[]) => void): void {
    this.touchEndHandler = (e: TouchEvent | MouseEvent) => {
      e.preventDefault()
      callback(this.normalizeTouches(e))
    }
    this.canvas.addEventListener('touchend', this.touchEndHandler as EventListener, { passive: false })
    this.canvas.addEventListener('mouseup', this.touchEndHandler as EventListener)
  }

  offAllTouch(): void {
    if (this.touchStartHandler) {
      this.canvas.removeEventListener('touchstart', this.touchStartHandler as EventListener)
      this.canvas.removeEventListener('mousedown', this.touchStartHandler as EventListener)
      this.touchStartHandler = null
    }
    if (this.touchMoveHandler) {
      this.canvas.removeEventListener('touchmove', this.touchMoveHandler as EventListener)
      this.canvas.removeEventListener('mousemove', this.touchMoveHandler as EventListener)
      this.touchMoveHandler = null
    }
    if (this.touchEndHandler) {
      this.canvas.removeEventListener('touchend', this.touchEndHandler as EventListener)
      this.canvas.removeEventListener('mouseup', this.touchEndHandler as EventListener)
      this.touchEndHandler = null
    }
  }

  onResize(callback: () => void): void {
    this.resizeHandler = callback
    window.addEventListener('resize', callback)
  }

  offResize(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }
  }

  getStorage(key: string): string | null {
    return localStorage.getItem(key)
  }

  setStorage(key: string, value: string): void {
    localStorage.setItem(key, value)
  }

  removeStorage(key: string): void {
    localStorage.removeItem(key)
  }

  createCanvas(width: number, height: number): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    return c
  }

  loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = src
    })
  }

  playAudio(src: string): void {
    try {
      const audio = new Audio(src)
      audio.play().catch(() => {})
    } catch {
      // 音频播放失败时静默忽略
    }
  }

  getWxAuthCode(): string | null {
    const url = new URL(window.location.href)
    return url.searchParams.get('code')
  }

  redirectToWxAuth(redirectUrl: string, appId: string): void {
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`
    window.location.href = authUrl
  }

  /**
   * 将浏览器原生 Touch/Mouse 事件统一转换为 TouchPoint 数组
   * 坐标转换为相对于 Canvas 的 CSS 像素坐标
   */
  private normalizeTouches(e: TouchEvent | MouseEvent): TouchPoint[] {
    const rect = this.canvas.getBoundingClientRect()
    // CSS 像素与 canvas 逻辑坐标的缩放比
    const scaleX = parseInt(this.canvas.style.width || '0') / rect.width || 1
    const scaleY = parseInt(this.canvas.style.height || '0') / rect.height || 1

    if (e instanceof TouchEvent) {
      // touchend 时 touches 为空，用 changedTouches
      const list = e.touches.length > 0 ? e.touches : e.changedTouches
      return Array.from(list).map((t) => ({
        id: t.identifier,
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
      }))
    } else {
      return [
        {
          id: 0,
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        },
      ]
    }
  }
}
