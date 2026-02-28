import dotenv from 'dotenv'
dotenv.config()

export const config = {
  wxGame: {
    appId: process.env.WX_GAME_APPID ?? '',
    secret: process.env.WX_GAME_SECRET ?? '',
  },
  wxH5: {
    appId: process.env.WX_H5_APPID ?? '',
    secret: process.env.WX_H5_SECRET ?? '',
  },
  jwtSecret: process.env.JWT_SECRET ?? 'dev_fallback_secret',
  /** JWT 过期时间 */
  jwtExpiresIn: '7d',
  port: parseInt(process.env.PORT ?? '3001', 10),
}
