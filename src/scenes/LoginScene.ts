import { Scene } from '../core/Scene'
import { CanvasRenderer } from '../render/CanvasRenderer'
import { Button } from '../ui/Button'
import { TweenManager, Easing } from '../core/Tween'
import type { Engine } from '../core/Engine'
import { appConfig } from '../config/app'

/**
 * 登录场景 - 微信授权登录入口
 * 风格与 MenuScene 保持一致的深色主题
 */
export class LoginScene extends Scene {
  private r: CanvasRenderer
  private engine: Engine
  private titleY: number = 0
  private titleAlpha: number = 0
  private btnAlpha: number = 0
  /** 登录状态提示 */
  private statusMsg: string = ''
  private statusColor: string = '#a8d8ea88'
  /** 是否正在登录中 */
  private logging: boolean = false
  /** 延迟跳转定时器 */
  private pendingTimer: ReturnType<typeof setTimeout> | null = null

  constructor(engine: Engine) {
    super()
    this.engine = engine
    this.r = new CanvasRenderer(engine.ctx)
  }

  onEnter(): void {
    TweenManager.instance.clear()
    const { width, height } = this.engine
    this.titleY = height * 0.25
    this.titleAlpha = 0
    this.btnAlpha = 0
    this.statusMsg = ''
    this.logging = false

    // 微信登录按钮
    const btnLogin = new Button(
      width / 2 - 120, height * 0.55, 240, 58,
      { text: '微信登录', fontSize: 20, bold: true, bgColor: '#07c160', borderColor: 'transparent', radius: 16 },
    ).setOnClick(() => {
      if (!this.logging) this.doLogin()
    })
    this.addObject(btnLogin)

    // 标题入场动画
    TweenManager.instance.create({
      duration: 700,
      easing: Easing.easeOutCubic,
      onUpdate: (t) => {
        this.titleAlpha = t
        this.titleY = this.engine.height * 0.25 - 30 * (1 - t)
      },
    })

    // 按钮延迟淡入
    TweenManager.instance.create({
      duration: 500,
      delay: 400,
      easing: Easing.easeOutQuad,
      onUpdate: (t) => { this.btnAlpha = t },
    })

    this.engine.input.onTap((x, y) => {
      for (const obj of this.objects) {
        if (obj instanceof Button) obj.handleTap(x, y)
      }
    })
  }

  onExit(): void {
    super.onExit()
    this.engine.input.reset()
    TweenManager.instance.clear()
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer)
      this.pendingTimer = null
    }
  }

  private async doLogin(): Promise<void> {
    this.logging = true
    this.statusMsg = '登录中...'
    this.statusColor = '#a8d8ea88'

    const platform = this.engine.platform
    let success = false

    if (platform.wxLogin) {
      // 微信小游戏环境
      success = await this.engine.auth.loginWX()
    } else if (platform.getWxAuthCode) {
      // H5 环境：检查 URL 是否已有 code
      const code = platform.getWxAuthCode()
      if (code) {
        success = await this.engine.auth.loginH5(code)
      } else if (platform.redirectToWxAuth) {
        if (!appConfig.wxH5AppId) {
          this.statusMsg = '未配置微信 AppID'
          this.statusColor = '#e94560'
          this.logging = false
          return
        }
        this.statusMsg = '跳转微信授权...'
        platform.redirectToWxAuth(window.location.href, appConfig.wxH5AppId)
        return
      }
    }

    if (success) {
      this.statusMsg = '登录成功！'
      this.statusColor = '#4caf50'
      this.pendingTimer = setTimeout(() => this.goMenu(), 500)
    } else {
      this.statusMsg = '登录失败，请重试'
      this.statusColor = '#e94560'
      this.logging = false
    }
  }

  private goMenu(): void {
    import('./MenuScene').then(({ MenuScene }) => {
      this.engine.switchScene(new MenuScene(this.engine))
    })
  }

  update(deltaTime: number): void {
    super.update(deltaTime)
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine
    const r = this.r

    // 背景（使用缓存渐变）
    r.fillBackground(width, height)

    // 装饰圆
    r.save()
    r.setAlpha(0.06)
    r.fillCircle(width * 0.85, height * 0.15, 120, '#07c160')
    r.fillCircle(width * 0.1, height * 0.7, 80, '#a8d8ea')
    r.resetAlpha()
    r.restore()

    // 标题
    r.save()
    r.setAlpha(this.titleAlpha)
    r.fillBoldText('成语接龙', width / 2, this.titleY, '#e94560', 52)
    r.fillText('IDIOM CHAIN', width / 2, this.titleY + 44, '#e9456077', 14)
    r.fillText('请登录以开始游戏', width / 2, this.titleY + 80, '#a8d8ea88', 14)
    r.resetAlpha()
    r.restore()

    // 按钮
    r.save()
    r.setAlpha(this.btnAlpha)
    for (const obj of this.objects) {
      obj.render(ctx)
    }
    r.resetAlpha()
    r.restore()

    // 状态提示
    if (this.statusMsg) {
      r.fillText(this.statusMsg, width / 2, height * 0.70, this.statusColor, 14)
    }

    // 底部版本号
    r.fillText('v0.1.0 · 成语接龙', width / 2, height - 24, '#f5f5f522', 11)
  }
}
