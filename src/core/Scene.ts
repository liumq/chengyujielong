import type { GameObject } from './GameObject'

/**
 * 场景基类，每个游戏场景继承此类
 */
export abstract class Scene {
  protected objects: GameObject[] = []

  /** 场景进入时调用（初始化资源、对象） */
  abstract onEnter(): void

  /** 场景退出时调用（清理资源） */
  onExit(): void {
    this.objects.forEach(obj => obj.destroy())
    this.objects = []
  }

  /** 添加游戏对象到场景 */
  addObject(obj: GameObject): void {
    this.objects.push(obj)
  }

  /** 移除游戏对象 */
  removeObject(obj: GameObject): void {
    const idx = this.objects.indexOf(obj)
    if (idx !== -1) {
      obj.destroy()
      this.objects.splice(idx, 1)
    }
  }

  /** 每帧更新所有激活对象 */
  update(deltaTime: number): void {
    for (const obj of this.objects) {
      if (obj.active) obj.update(deltaTime)
    }
  }

  /** 每帧渲染所有激活且可见的对象（UIComponent 的 visible 由自身 render 处理） */
  render(ctx: CanvasRenderingContext2D): void {
    for (const obj of this.objects) {
      if (obj.active) obj.render(ctx)
    }
  }
}

/**
 * 场景管理器，负责场景切换
 */
export class SceneManager {
  private current: Scene | null = null

  /** 切换到新场景 */
  switchTo(scene: Scene): void {
    if (this.current) {
      this.current.onExit()
    }
    this.current = scene
    this.current.onEnter()
  }

  /** 获取当前场景 */
  getCurrent(): Scene | null {
    return this.current
  }

  /** 转发 update */
  update(deltaTime: number): void {
    this.current?.update(deltaTime)
  }

  /** 转发 render */
  render(ctx: CanvasRenderingContext2D): void {
    this.current?.render(ctx)
  }
}
