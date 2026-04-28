import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './config.js'
import { authRouter } from './routes/auth.js'

const app = express()

app.use(helmet())

const corsOrigin = process.env.CORS_ORIGIN
if (!corsOrigin && process.env.NODE_ENV === 'production') {
  console.error('警告：生产环境未设置 CORS_ORIGIN，将拒绝所有跨域请求')
}
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',') } : { origin: false }))
app.use(express.json({ limit: '100kb' }))

// 登录接口限流：每个 IP 每分钟最多 20 次
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
})

// 挂载认证路由
app.use('/api/auth', authLimiter, authRouter)

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// 全局错误处理中间件
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('未捕获的错误:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

app.listen(config.port, () => {
  console.log(`登录服务已启动: http://localhost:${config.port}`)
})
