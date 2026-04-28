/**
 * 微信小游戏入口文件
 * 由 weapp-adapter 负责模拟基础 DOM/BOM API
 * 本文件负责创建 Canvas、注入 WXPlatform、启动引擎
 */
import { Engine } from './core/Engine'
import { WXPlatform } from './platform/WXPlatform'
import { MenuScene } from './scenes/MenuScene'
import { LoginScene } from './scenes/LoginScene'
import { appConfig } from './config/app'

async function main(): Promise<void> {
  const canvas = (globalThis as unknown as { canvas: HTMLCanvasElement }).canvas
  if (!canvas) throw new Error('未找到微信小游戏 Canvas')

  const platform = new WXPlatform()
  const engine = new Engine(canvas, platform)

  if (!appConfig.requireLogin) {
    engine.start(new MenuScene(engine))
    return
  }

  // 需要登录：尝试恢复登录态
  const restored = await engine.auth.tryRestore()

  if (restored) {
    engine.start(new MenuScene(engine))
  } else {
    engine.start(new LoginScene(engine))
  }
}

main().catch(() => {
  // 微信小游戏环境下静默处理启动异常
})
