import dotenv from 'dotenv'
dotenv.config()

const parsedPort = parseInt(process.env.PORT ?? '3001', 10)

export const config = {
  wxGame: {
    appId: process.env.WX_GAME_APPID ?? '',
    secret: process.env.WX_GAME_SECRET ?? '',
  },
  wxH5: {
    appId: process.env.WX_H5_APPID ?? '',
    secret: process.env.WX_H5_SECRET ?? '',
  },
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET
    if (!secret && process.env.NODE_ENV === 'production') {
      console.error('致命错误：生产环境必须设置 JWT_SECRET 环境变量')
      process.exit(1)
    }
    return secret ?? 'dev_fallback_secret'
  })(),
  /** JWT 过期时间 */
  jwtExpiresIn: '7d',
  port: Number.isFinite(parsedPort) ? parsedPort : 3001,
}
