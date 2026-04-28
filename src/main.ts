import { Engine } from './core/Engine'
import { H5Platform } from './platform/H5Platform'
import { MenuScene } from './scenes/MenuScene'
import { LoginScene } from './scenes/LoginScene'
import { appConfig } from './config/app'

async function main(): Promise<void> {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
  if (!canvas) throw new Error('找不到 #game-canvas 元素')

  const platform = new H5Platform(canvas)
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
    const code = platform.getWxAuthCode()
    if (code) {
      const ok = await engine.auth.loginH5(code)
      engine.start(ok ? new MenuScene(engine) : new LoginScene(engine))
    } else {
      engine.start(new LoginScene(engine))
    }
  }
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="color:red;padding:20px">启动失败: ${err instanceof Error ? err.message : err}</pre>`
})
