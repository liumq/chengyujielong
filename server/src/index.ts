import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { authRouter } from './routes/auth.js'

const app = express()

app.use(cors())
app.use(express.json())

// 挂载认证路由
app.use('/api/auth', authRouter)

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(config.port, () => {
  console.log(`登录服务已启动: http://localhost:${config.port}`)
})
