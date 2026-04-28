import type { IPlatform } from '../platform/Platform'
import type { StorageManager } from '../data/StorageManager'

export interface UserInfo {
  openid: string
  nickname: string
  avatarUrl: string
}

interface LoginResponse {
  token: string
  user: UserInfo
}

interface VerifyResponse {
  valid: boolean
  user?: UserInfo
}

/**
 * 认证管理器，统一管理微信登录状态
 * 支持 H5 网页授权和微信小游戏两种登录方式
 */
export class AuthManager {
  private platform: IPlatform
  private storage: StorageManager
  private _token: string | null = null
  private _user: UserInfo | null = null
  private apiBase: string
  /** 离线降级标记：网络异常时使用本地缓存恢复，token 未经服务端验证 */
  private _offline: boolean = false

  get isLoggedIn(): boolean { return !!this._token }
  get isOffline(): boolean { return this._offline }
  get user(): UserInfo | null { return this._user }
  get token(): string | null { return this._token }

  constructor(platform: IPlatform, storage: StorageManager, apiBase = '/api') {
    this.platform = platform
    this.storage = storage
    this.apiBase = apiBase
  }

  /** 尝试用本地缓存的 token 恢复登录态 */
  async tryRestore(): Promise<boolean> {
    const token = this.storage.getToken()
    if (!token) return false

    try {
      const res = await fetch(`${this.apiBase}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        this.storage.clearAuth()
        return false
      }
      const data = await res.json() as VerifyResponse
      if (data.valid && data.user) {
        this._token = token
        this._user = data.user
        return true
      }
    } catch {
      // 网络异常时使用本地缓存作为临时降级，标记为离线态
      const cached = this.storage.getUserInfo()
      if (cached && token) {
        try {
          this._token = token
          this._user = JSON.parse(cached) as UserInfo
          this._offline = true
          return true
        } catch { /* 解析失败则放弃 */ }
      }
    }

    this.storage.clearAuth()
    return false
  }

  /** 微信小游戏登录 */
  async loginWX(): Promise<boolean> {
    if (!this.platform.wxLogin) return false

    try {
      const code = await this.platform.wxLogin()
      const res = await fetch(`${this.apiBase}/auth/wx-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) return false

      const data = await res.json() as LoginResponse
      this.saveLogin(data.token, data.user)
      return true
    } catch {
      return false
    }
  }

  /** H5 微信网页授权登录 */
  async loginH5(code: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBase}/auth/h5-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) return false

      const data = await res.json() as LoginResponse
      this.saveLogin(data.token, data.user)

      // 登录成功后清除 URL 中的 code 参数，避免刷新重复使用
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        window.history.replaceState({}, '', url.toString())
      }

      return true
    } catch {
      return false
    }
  }

  /** 登出，清除本地缓存 */
  logout(): void {
    this._token = null
    this._user = null
    this.storage.clearAuth()
  }

  private saveLogin(token: string, user: UserInfo): void {
    this._token = token
    this._user = user
    this._offline = false
    this.storage.setToken(token)
    this.storage.setUserInfo(JSON.stringify(user))
  }
}
