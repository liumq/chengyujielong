/**
 * 游戏对象基类，所有可更新/渲染的对象都继承此类
 */
export abstract class GameObject {
  /** 是否激活（非激活对象不会被 update/render） */
  active: boolean = true

  /** 每帧更新，子类重写实现逻辑 */
  abstract update(deltaTime: number): void

  /** 每帧渲染，子类重写实现绘制 */
  abstract render(ctx: CanvasRenderingContext2D): void

  /** 销毁时清理资源，子类按需重写 */
  destroy(): void {}
}
