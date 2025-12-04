# SillyTavern Mobile

LLM 角色扮演聊天应用 - iOS & Android

## 功能特点

- 🚀 无需后端服务器，直接调用 LLM API
- 💾 所有数据本地存储
- 🎭 完整的角色卡片支持 (V1/V2)
- 💬 流式响应、滑动切换、消息分支
- 🌍 World Info / Lorebook 支持
- 👥 群聊功能
- 🔒 API 密钥安全存储

## 支持的 API

- OpenAI (GPT-3.5, GPT-4, GPT-4o)
- Claude / Anthropic
- Google Gemini
- OpenRouter
- NovelAI
- KoboldAI
- Ollama
- Text Generation WebUI
- 更多...

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# iOS
npm run ios

# Android
npm run android
```

## 项目结构

```
mobile/
├── src/
│   ├── core/           # 核心业务逻辑 SDK
│   │   ├── api/        # LLM API 客户端
│   │   ├── character/  # 角色管理
│   │   ├── chat/       # 对话管理
│   │   ├── prompt/     # 提示词构建
│   │   ├── tokenizer/  # 分词器
│   │   └── worldinfo/  # World Info
│   ├── components/     # UI 组件
│   ├── screens/        # 页面
│   ├── storage/        # 存储适配器
│   └── types/          # TypeScript 类型
├── assets/             # 图片、字体等资源
└── app.json            # Expo 配置
```

## License

AGPL-3.0
