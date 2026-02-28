/**
 * 通用工具函数集合
 */

/** 将数值限制在 [min, max] 范围内 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** 线性插值 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** 生成 [min, max) 之间的随机整数 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

/** 生成 [min, max) 之间的随机浮点数 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/** 从数组中随机选取一个元素 */
export function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 数组洗牌（Fisher-Yates 算法，原地修改） */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 十六进制颜色转 RGBA 字符串 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 格式化数字，添加千位分隔符 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

/** 延迟指定毫秒 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 判断两个矩形是否相交 */
export function rectsOverlap(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number,
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
}

/** 计算两点之间的距离 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}
