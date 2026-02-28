/**
 * 触摸点数据结构
 */
export interface TouchPoint {
  /** Canvas 内的 x 坐标（CSS 像素） */
  x: number
  /** Canvas 内的 y 坐标（CSS 像素） */
  y: number
  /** 触摸标识符（多点触控区分） */
  id: number
}

/**
 * 平台能力接口，H5 和微信小游戏分别实现
 */
export interface IPlatform {
  /** 获取屏幕尺寸（CSS 像素） */
  getScreenSize(): { width: number; height: number }

  /** 获取设备像素比 */
  getDevicePixelRatio(): number

  /** 注册触摸/点击开始事件 */
  onTouchStart(callback: (touches: TouchPoint[]) => void): void

  /** 注册触摸/点击移动事件 */
  onTouchMove(callback: (touches: TouchPoint[]) => void): void

  /** 注册触摸/点击结束事件 */
  onTouchEnd(callback: (touches: TouchPoint[]) => void): void

  /** 移除所有触摸事件监听 */
  offAllTouch(): void

  /** 注册窗口尺寸变化事件 */
  onResize(callback: () => void): void

  /** 移除窗口尺寸变化事件 */
  offResize(): void

  /** 本地存储：读取 */
  getStorage(key: string): string | null

  /** 本地存储：写入 */
  setStorage(key: string, value: string): void

  /** 本地存储：删除 */
  removeStorage(key: string): void

  /** 创建离屏 Canvas（用于缓存渲染等） */
  createCanvas(width: number, height: number): HTMLCanvasElement

  /** 加载图片资源 */
  loadImage(src: string): Promise<HTMLImageElement>

  /** 播放音频文件（简单场景用，复杂场景推荐 AudioManager） */
  playAudio(src: string): void

  /** 分享（可选，微信平台实现） */
  shareGame?(title: string, imageUrl?: string): void

  /** 微信登录：获取临时登录 code（微信小游戏平台实现） */
  wxLogin?(): Promise<string>

  /** H5 微信网页授权：从当前 URL 中获取 code 参数 */
  getWxAuthCode?(): string | null

  /** H5 微信网页授权：跳转到微信授权页面 */
  redirectToWxAuth?(redirectUrl: string, appId: string): void
}
