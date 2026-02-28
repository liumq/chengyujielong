import { defineConfig } from 'vite'
import { resolve } from 'path'

/**
 * 微信小游戏构建配置
 * 产物输出到 dist/wx/，配合 wx/ 模板目录组成完整小游戏包
 *
 * 构建后需手动（或脚本）将 wx/ 目录内容复制到 dist/wx/
 * 然后用微信开发者工具打开 dist/wx/ 目录进行调试和发布
 */
export default defineConfig({
  build: {
    outDir: 'dist/wx',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'esbuild',
    lib: {
      // 微信小游戏入口
      entry: resolve(__dirname, 'src/main.wx.ts'),
      name: 'game',
      fileName: 'game',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // 微信小游戏不支持 ES module，使用 IIFE 格式
        format: 'iife',
        entryFileNames: 'game.js',
        // 静态资源内联（小游戏不支持单独资源文件引用）
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
