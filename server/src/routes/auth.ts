import { Router, type Router as RouterType } from 'express'
import { signToken, verifyToken } from '../utils/jwt.js'
import { code2Session, getOAuthToken, getWxUserInfo } from '../utils/wx-api.js'

export const authRouter: RouterType = Router()

/**
 * 微信小游戏登录
 * POST /api/auth/wx-login { code: string }
 */
authRouter.post('/wx-login', async (req, res) => {
  try {
    const { code } = req.body ?? {}
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: '缺少 code 参数' })
      return
    }

    const sessionData = await code2Session(code)
    if (!sessionData.openid) {
      res.status(502).json({ error: '微信接口返回数据异常' })
      return
    }
    const user = {
      openid: sessionData.openid,
      nickname: '',
      avatarUrl: '',
      platform: 'wx_game' as const,
    }
    const token = signToken(user)

    res.json({
      token,
      user: { openid: user.openid, nickname: user.nickname, avatarUrl: user.avatarUrl },
    })
  } catch (err) {
    console.error('微信小游戏登录失败:', err)
    res.status(500).json({ error: '登录失败' })
  }
})

/**
 * H5 微信网页授权登录
 * POST /api/auth/h5-login { code: string }
 */
authRouter.post('/h5-login', async (req, res) => {
  try {
    const { code } = req.body ?? {}
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: '缺少 code 参数' })
      return
    }

    const tokenData = await getOAuthToken(code)
    const wxUser = await getWxUserInfo(tokenData.access_token, tokenData.openid)
    if (!wxUser.openid) {
      res.status(502).json({ error: '微信接口返回数据异常' })
      return
    }
    const user = {
      openid: wxUser.openid,
      nickname: wxUser.nickname || '',
      avatarUrl: wxUser.headimgurl || '',
      platform: 'h5' as const,
    }
    const token = signToken(user)

    res.json({
      token,
      user: { openid: user.openid, nickname: user.nickname, avatarUrl: user.avatarUrl },
    })
  } catch (err) {
    console.error('H5 微信登录失败:', err)
    res.status(500).json({ error: '登录失败' })
  }
})

/**
 * 验证 token 有效性
 * GET /api/auth/verify  Header: Authorization: Bearer <token>
 */
authRouter.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ valid: false, error: '未提供 token' })
    return
  }

  const token = authHeader.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({ valid: false, error: 'token 无效或已过期' })
    return
  }

  res.json({
    valid: true,
    user: { openid: payload.openid, nickname: payload.nickname, avatarUrl: payload.avatarUrl },
  })
})
