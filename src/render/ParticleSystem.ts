interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number    // 剩余生命（0~1）
  decay: number   // 每帧衰减速度
  size: number
  color: string
  gravity: number
}

/**
 * 轻量级粒子系统，用于正确接龙时的爆炸特效
 */
export class ParticleSystem {
  private particles: Particle[] = []
  private readonly COLORS = ['#e94560', '#ffd700', '#a8d8ea', '#f5f5f5', '#ff9800']

  /** 在指定位置爆发粒子 */
  burst(x: number, y: number, count = 18): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 80 + Math.random() * 120
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.018 + Math.random() * 0.012,
        size: 3 + Math.random() * 5,
        color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
        gravity: 80 + Math.random() * 60,
      })
    }
  }

  /** 在顶部飘出庆祝彩屑 */
  confetti(canvasWidth: number, count = 30): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvasWidth,
        y: -10,
        vx: (Math.random() - 0.5) * 60,
        vy: 60 + Math.random() * 80,
        life: 1,
        decay: 0.008 + Math.random() * 0.006,
        size: 4 + Math.random() * 6,
        color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
        gravity: 20,
      })
    }
  }

  update(deltaTime: number): void {
    const dt = deltaTime / 1000
    for (const p of this.particles) {
      p.vy += p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= p.decay
    }
    this.particles = this.particles.filter(p => p.life > 0)
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save()
      ctx.globalAlpha = p.life * 0.9
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  get count(): number {
    return this.particles.length
  }
}
