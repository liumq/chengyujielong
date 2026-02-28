import type { Engine } from '../core/Engine'

export type GameState = 'menu' | 'playing' | 'result'

export interface GameResultData {
  score: number
  chainLength: number
  bestCombo: number
  reason: string
}

/**
 * 游戏流程管理器，负责场景间切换和全局状态协调
 * 将场景切换逻辑集中管理，避免场景之间直接耦合
 */
export class GameManager {
  private engine: Engine
  private _state: GameState = 'menu'

  get state(): GameState { return this._state }

  constructor(engine: Engine) {
    this.engine = engine
  }

  /** 进入主菜单 */
  async goMenu(): Promise<void> {
    this._state = 'menu'
    const { MenuScene } = await import('../scenes/MenuScene')
    this.engine.switchScene(new MenuScene(this.engine))
  }

  /** 开始游戏 */
  async startGame(): Promise<void> {
    this._state = 'playing'
    const { GameScene } = await import('../scenes/GameScene')
    this.engine.switchScene(new GameScene(this.engine))
  }

  /** 进入结算页 */
  async showResult(data: GameResultData): Promise<void> {
    this._state = 'result'
    this.engine.audio.play('gameover')
    this.engine.storage.incrementTotalGames()
    const isNewRecord = this.engine.storage.updateBestScore(data.score)
    this.engine.storage.updateBestCombo(data.bestCombo)
    const historyBestScore = this.engine.storage.getBestScore()

    const { ResultScene } = await import('../scenes/ResultScene')
    this.engine.switchScene(new ResultScene(this.engine, {
      ...data,
      isNewRecord,
      historyBestScore,
    }))
  }

  /** 再来一局 */
  async replay(): Promise<void> {
    await this.startGame()
  }
}
