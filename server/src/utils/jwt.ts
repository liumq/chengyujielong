import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export interface JwtPayload {
  openid: string
  nickname: string
  avatarUrl: string
  platform: 'wx_game' | 'h5'
}

/** 签发 JWT token */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions)
}

/** 验证并解码 JWT token，失败返回 null */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload
    return decoded
  } catch {
    return null
  }
}
