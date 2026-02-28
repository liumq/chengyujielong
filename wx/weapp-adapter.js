/**
 * 微信小游戏适配器
 * 模拟浏览器环境中的部分 DOM/BOM API，使基于 Canvas 的代码可在微信小游戏中运行
 */

// 获取微信主 Canvas（首次调用 wx.createCanvas() 返回的即为主 Canvas）
const canvas = wx.createCanvas()

// 挂载到全局，供游戏入口文件使用
GameGlobal.canvas = canvas

// 模拟 window 对象的基本属性
const systemInfo = wx.getSystemInfoSync()

GameGlobal.window = GameGlobal.window || {}
GameGlobal.window.innerWidth = systemInfo.windowWidth
GameGlobal.window.innerHeight = systemInfo.windowHeight
GameGlobal.window.devicePixelRatio = systemInfo.pixelRatio

// 模拟 requestAnimationFrame / cancelAnimationFrame
if (typeof GameGlobal.requestAnimationFrame === 'undefined') {
  GameGlobal.requestAnimationFrame = function (callback) {
    return canvas.requestAnimationFrame(callback)
  }
}

if (typeof GameGlobal.cancelAnimationFrame === 'undefined') {
  GameGlobal.cancelAnimationFrame = function (id) {
    return canvas.cancelAnimationFrame(id)
  }
}

// 模拟 performance.now
if (typeof GameGlobal.performance === 'undefined') {
  let initTime = Date.now()
  GameGlobal.performance = {
    now: function () {
      return Date.now() - initTime
    },
  }
}

// 模拟 HTMLCanvasElement
if (typeof GameGlobal.HTMLCanvasElement === 'undefined') {
  GameGlobal.HTMLCanvasElement = canvas.constructor
}

// 模拟 Image 构造函数
if (typeof GameGlobal.Image === 'undefined') {
  GameGlobal.Image = function () {
    return wx.createImage()
  }
}

// 模拟 AudioContext（微信小游戏使用 wx.createInnerAudioContext）
if (typeof GameGlobal.AudioContext === 'undefined') {
  GameGlobal.AudioContext = function () {
    const innerCtx = wx.createInnerAudioContext()
    return {
      state: 'running',
      destination: {},
      currentTime: 0,
      createOscillator: function () {
        return {
          type: 'sine',
          frequency: { value: 440 },
          connect: function () {},
          start: function () {},
          stop: function () {},
        }
      },
      createGain: function () {
        return {
          gain: {
            value: 1,
            setValueAtTime: function () {},
            exponentialRampToValueAtTime: function () {},
          },
          connect: function () {},
        }
      },
      resume: function () {
        return Promise.resolve()
      },
      suspend: function () {
        return Promise.resolve()
      },
      _innerCtx: innerCtx,
    }
  }
}

// 模拟 document（部分 API）
if (typeof GameGlobal.document === 'undefined') {
  GameGlobal.document = {
    createElement: function (tagName) {
      if (tagName === 'canvas') {
        return wx.createCanvas()
      }
      return {}
    },
    getElementById: function () {
      return canvas
    },
    documentElement: {
      style: {},
    },
    body: {
      style: {},
    },
  }
}

// 模拟 navigator
if (typeof GameGlobal.navigator === 'undefined') {
  GameGlobal.navigator = {
    userAgent: 'MiniGame',
    language: systemInfo.language || 'zh_CN',
    platform: systemInfo.platform || 'WeChat',
  }
}

// 将模拟的全局对象绑定到 globalThis
if (typeof globalThis !== 'undefined') {
  globalThis.canvas = canvas
  globalThis.requestAnimationFrame = GameGlobal.requestAnimationFrame
  globalThis.cancelAnimationFrame = GameGlobal.cancelAnimationFrame
  globalThis.performance = globalThis.performance || GameGlobal.performance
  globalThis.Image = globalThis.Image || GameGlobal.Image
  globalThis.AudioContext = globalThis.AudioContext || GameGlobal.AudioContext
  globalThis.document = globalThis.document || GameGlobal.document
  globalThis.navigator = globalThis.navigator || GameGlobal.navigator
  globalThis.window = globalThis.window || GameGlobal.window
}
