import type { IPlatform } from '../platform/Platform'

const KEYS = {
  BEST_SCORE: 'cyjl_best_score',
  BEST_COMBO: 'cyjl_best_combo',
  TOTAL_GAMES: 'cyjl_total_games',
  BGM_ENABLED: 'cyjl_bgm',
  SFX_ENABLED: 'cyjl_sfx',
  AUTH_TOKEN: 'cyjl_auth_token',
  USER_INFO: 'cyjl_user_info',
} as const

/**
 * 本地存档管理器（跨平台：H5 用 localStorage，微信用 wx.setStorageSync）
 */
export class StorageManager {
  private platform: IPlatform

  constructor(platform: IPlatform) {
    this.platform = platform
  }

  private getInt(key: string, defaultVal: number): number {
    const raw = this.platform.getStorage(key)
    if (raw === null) return defaultVal
    const n = parseInt(raw, 10)
    return isNaN(n) ? defaultVal : n
  }

  private getBool(key: string, defaultVal: boolean): boolean {
    const raw = this.platform.getStorage(key)
    if (raw === null) return defaultVal
    return raw === 'true'
  }

  /** 更新最高分（如果比历史高才更新） */
  updateBestScore(score: number): boolean {
    const current = this.getBestScore()
    if (score > current) {
      this.platform.setStorage(KEYS.BEST_SCORE, String(score))
      return true
    }
    return false
  }

  getBestScore(): number {
    return this.getInt(KEYS.BEST_SCORE, 0)
  }

  updateBestCombo(combo: number): boolean {
    const current = this.getBestCombo()
    if (combo > current) {
      this.platform.setStorage(KEYS.BEST_COMBO, String(combo))
      return true
    }
    return false
  }

  getBestCombo(): number {
    return this.getInt(KEYS.BEST_COMBO, 0)
  }

  incrementTotalGames(): void {
    const current = this.getTotalGames()
    this.platform.setStorage(KEYS.TOTAL_GAMES, String(current + 1))
  }

  getTotalGames(): number {
    return this.getInt(KEYS.TOTAL_GAMES, 0)
  }

  getBgmEnabled(): boolean {
    return this.getBool(KEYS.BGM_ENABLED, true)
  }

  setBgmEnabled(enabled: boolean): void {
    this.platform.setStorage(KEYS.BGM_ENABLED, String(enabled))
  }

  getSfxEnabled(): boolean {
    return this.getBool(KEYS.SFX_ENABLED, true)
  }

  setSfxEnabled(enabled: boolean): void {
    this.platform.setStorage(KEYS.SFX_ENABLED, String(enabled))
  }

  // === 认证相关存储 ===

  getToken(): string | null {
    return this.platform.getStorage(KEYS.AUTH_TOKEN)
  }

  setToken(token: string): void {
    this.platform.setStorage(KEYS.AUTH_TOKEN, token)
  }

  getUserInfo(): string | null {
    return this.platform.getStorage(KEYS.USER_INFO)
  }

  setUserInfo(json: string): void {
    this.platform.setStorage(KEYS.USER_INFO, json)
  }

  clearAuth(): void {
    this.platform.removeStorage(KEYS.AUTH_TOKEN)
    this.platform.removeStorage(KEYS.USER_INFO)
  }
}
