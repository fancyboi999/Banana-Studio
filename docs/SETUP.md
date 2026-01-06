# 项目设置指南 (Setup Guide)

欢迎来到 **Banana-Studio**！本指南将帮助您在本地搭建开发环境。

## 1. 环境准备

在开始之前，请确保您的系统满足以下要求：

- **操作系统**: macOS, Windows, 或 Linux
- **Node.js**: v20.0.0 或更高版本
- **包管理器**: 推荐使用 `npm` (随 Node.js 安装) 或 `pnpm`

## 2. 安装依赖

克隆项目代码后，在项目根目录下运行以下命令安装所有依赖包：

```bash
npm install
# 或者
pnpm install
```

## 3. 环境变量配置

本项目依赖 Google Gemini API 和 Replicate API。请在项目根目录下创建一个名为 `.env.local` 的文件，并添加以下内容：

```bash
# Google Gemini API Key (用于图像生成和编辑)
# 获取地址: https://aistudio.google.com/app/apikey
GOOGLE_API_KEY=your_google_api_key_here

# Replicate API Token (用于 Meta SAM-2 图像分割)
# 获取地址: https://replicate.com/account/api-tokens
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

> [!IMPORTANT]
> 请妥善保管您的 API 密钥，切勿将其提交到公共代码仓库。`.env.local` 已被包含在 `.gitignore` 中。

## 4. 数据库初始化

本项目使用 SQLite 存储生成历史。数据库文件 `history.db` 会在第一次运行应用时自动创建并初始化表结构。无需手动运行迁移脚本。

本地图片存储目录 `public/generate_images` 也会在生成图片时自动创建。

## 5. 启动开发服务器

一切准备就绪后，运行以下命令启动开发环境：

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可看到 Banana-Studio 界面。

## 6. 构建生产版本

如果您需要部署生产版本，请运行：

```bash
npm run build
npm start
```
