# Blue Hour · 蓝调
Markdown 驱动的静态博客

## 技术栈

- HTML / CSS / 原生 JavaScript，无框架
- Markdown → 静态 HTML，构建脚本 `build.js` 基于 `marked`
- Node 18+，唯一依赖 `marked`
- 部署到 GitHub Pages，GitHub Actions 自动构建

## 本地开发

```bash
npm install
npm run build     # 从 content/posts 生成 index.html 和 blog/
npm run dev       # 构建后启动本地服务器（端口 4000）