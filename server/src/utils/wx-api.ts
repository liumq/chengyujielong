import { config } from '../config.js'

/** 微信小游戏 code2Session 返回 */
interface Code2SessionResult {
  openid: string
  session_key: string
  errcode?: number
  errmsg?: string
}

/** 微信 H5 OAuth access_token 返回 */
interface OAuthTokenResult {
  access_token: string
  openid: string
  errcode?: number
  errmsg?: string
}

/** 微信 H5 用户信息返回 */
interface WxUserInfo {
  openid: string
  nickname: string
  headimgurl: string
  errcode?: number
  errmsg?: string
}

/**
 * 微信小游戏：用 code 换取 openid + session_key
 */
export async function code2Session(code: string): Promise<Code2SessionResult> {
  const { appId, secret } = config.wxGame
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
  const res = await fetch(url)
  const data = await res.json() as Code2SessionResult
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`code2Session 失败: ${data.errmsg} (${data.errcode})`)
  }
  return data
}

/**
 * H5 微信网页授权：用 code 换取 access_token + openid
 */
export async function getOAuthToken(code: string): Promise<OAuthTokenResult> {
  const { appId, secret } = config.wxH5
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`
  const res = await fetch(url)
  const data = await res.json() as OAuthTokenResult
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`获取 OAuth token 失败: ${data.errmsg} (${data.errcode})`)
  }
  return data
}

/**
 * H5 微信网页授权：用 access_token + openid 获取用户信息
 */
export async function getWxUserInfo(accessToken: string, openid: string): Promise<WxUserInfo> {
  const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
  const res = await fetch(url)
  const data = await res.json() as WxUserInfo
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`获取用户信息失败: ${data.errmsg} (${data.errcode})`)
  }
  return data
}
