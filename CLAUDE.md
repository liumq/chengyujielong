# CLAUDE.md

This file provides guidance to Claude Code/Cursor when working with code in this repository.

- 每次响应请带上称呼【少爷】
- 使用plan生成计划时尽可能收集有用信息，有疑问和不清楚的地方必须向我沟通确认清楚，生成的计划需要有待办列表
- 按照计划执行时必须按待办列表依次完成并更新待办状态，执行时不用再向我确认

## 项目概述

这是一个"成语接龙"H5 单机小游戏项目，适配 H5网页版 和 微信小游戏。包含前端游戏客户端和后端登录服务。

### 技术栈

- **语言**: TypeScript 5.x
- **渲染**: 原生 Canvas 2D API（零框架依赖）
- **构建**: Vite 6.x（H5）/ Vite + vite.config.wx.ts（微信小游戏）
- **后端**: Express（登录认证服务）
- **包管理**: pnpm

### 项目结构

```
src/
├── core/           # 引擎核心（Engine、Scene、GameObject、InputManager、Tween）
├── render/         # 渲染工具（CanvasRenderer、ParticleSystem、TextRenderer）
├── ui/             # UI 组件（Button、Label、Panel、UIComponent）
├── game/           # 游戏逻辑（IdiomChain、ScoreManager）
├── data/           # 数据层（IdiomDatabase、StorageManager、idioms.json 2007条成语）
├── audio/          # 音效（AudioManager，Web Audio API 程序化合成）
├── auth/           # 认证（AuthManager，微信登录状态管理）
├── config/         # 前端配置（app.ts，含 requireLogin 开关）
├── platform/       # 平台适配（Platform接口、H5Platform、WXPlatform）
├── scenes/         # 游戏场景（LoginScene、MenuScene、GameScene、ResultScene）
├── utils/          # 通用工具函数
├── main.ts         # H5 入口
└── main.wx.ts      # 微信小游戏入口
server/
├── src/
│   ├── index.ts        # Express 服务入口
│   ├── config.ts       # 服务端配置（环境变量）
│   ├── routes/auth.ts  # 认证路由（wx-login、h5-login、verify）
│   └── utils/          # JWT、微信 API 工具
├── .env.example        # 环境变量模板
└── package.json
wx/                 # 微信小游戏模板文件
```

### 关键配置

- `src/config/app.ts` — 前端应用配置，`requireLogin` 控制是否需要登录才能进入游戏
- `server/.env.example` — 服务端环境变量模板（微信 AppID/Secret、JWT 密钥等）
- `vite.config.ts` — H5 构建配置，开发时代理 `/api` 到后端 `localhost:3001`

### 开发命令

```bash
pnpm dev          # H5 开发服务器 http://localhost:3000
pnpm dev:server   # 启动后端登录服务 http://localhost:3001
pnpm build:h5     # 构建 H5 版本 → dist/h5/
pnpm build:wx     # 构建微信小游戏 → dist/wx/（用微信开发者工具打开）
```
