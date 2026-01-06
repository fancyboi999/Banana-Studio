# 开发指南 (Development Guide)

本指南旨在帮助开发者理解 **Banana-Studio** 的架构设计和代码规范。

## 📂 目录结构

```
src/
├── app/                 # Next.js App Router 路由与页面
│   ├── [locale]/        # 国际化路由包裹层
│   └── actions/         # Server Actions (后端逻辑入口)
├── components/          # React 组件
│   ├── studio/          # 编辑器核心组件 (Canvas, LayerList, ControlPanel)
│   └── ui/              # 通用 UI 组件 (Button, Slider 等)
├── lib/                 # 工具库与核心逻辑
│   ├── db.ts            # SQLite 数据库连接与操作
│   ├── imageUtils.ts    # 图像处理工具函数
│   └── constants.ts     # 常量定义
├── messages/            # 国际化翻译文件 (en.json, zh.json)
└── i18n/                # next-intl 配置
```

## 🏗️ 核心架构

### Server Actions
本项目大量使用 **Server Actions** (`src/app/actions/gemini.ts`) 来处理后端逻辑，如调用 AI API、数据库读写等。这使得前端组件 (Client Components) 可以直接调用后端函数，无需手动编写 API Routes。

### 状态管理
由于图像编辑器交互复杂，我们主要依赖 React 的 `useState` 和 `useReducer` (在复杂场景下) 在组件树中传递状态。核心状态（如图层列表、当前选中图层）主要提升至 `Page` 组件 (`src/app/[locale]/page.tsx`) 管理，并通过 Props 传递给子组件。

### 数据库设计
我们使用 SQLite 存储轻量级的用户生成历史。
**Schema**:
- `image_history`: 存储生成/编辑记录 (prompt, model, image_path, timestamp)。

## 🌍 国际化 (i18n)

本项目使用 `next-intl` 进行国际化。
- **添加新语言**: 在 `src/messages` 下创建对应的 `.json` 文件，并在 `src/i18n/request.ts` (如果有) 或 `middleware.ts` 中配置 locale。
- **使用翻译**: 在组件中使用 `useTranslations('Namespace')` hook。

## 🎨 样式指南

我们使用 **Tailwind CSS v4** 进行样式开发。
- 尽量使用 Utility Classes。
- 对于复杂的组件样式，可以使用 `@apply` 或提取为单独的类，但保持适度。
- 遵循移动优先的响应式设计原则。

## 🔒 安全性注意事项

- **API Key**: 严禁在客户端代码中暴露 API Key。所有涉及 API Key 的操作必须在 Server Actions 中进行。
- **输入验证**: 在 Server Actions 中始终验证用户输入（如 Prompt 长度、图片格式）。虽然是 Demo 项目，但养成好习惯很重要。
