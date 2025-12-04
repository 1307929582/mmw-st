# Requirements Document

## Introduction

本文档定义了一个基于 SillyTavern 功能的移动端独立应用的需求。这是一个全新的移动端 App，功能与 SillyTavern 保持一致，但采用全新的移动端原生架构。

**核心架构特点：**
- **无后端服务器** - App 直接调用 LLM API（OpenAI、Claude 等），不需要任何服务器
- **本地数据存储** - 所有数据（角色、对话、设置）存储在手机本地
- **独立品牌** - 可以使用自定义的 App 名称、Logo 和视觉风格
- **跨平台** - 同时支持 iOS 和 Android

**技术架构：**
```
┌─────────────────────────────────────┐
│           Mobile App (UI)           │  ← 前端界面
├─────────────────────────────────────┤
│         Core SDK (业务逻辑)          │  ← TypeScript 核心库
├─────────────────────────────────────┤
│    本地存储 (SQLite) │ LLM APIs     │  ← 数据层 & 网络层
└─────────────────────────────────────┘
```

## Glossary

- **SillyTavern Mobile**: 移动端独立应用，不依赖外部服务器运行
- **LLM API**: 大语言模型 API 服务（如 OpenAI、Claude、NovelAI、KoboldAI、Text Generation WebUI 等）
- **Character Card**: 角色卡片，包含角色设定、头像、对话示例、世界观等信息（支持 V1/V2 规范）
- **Chat Session**: 与角色的对话会话，包含完整的消息历史
- **Group Chat**: 群聊功能，多个角色参与的对话
- **World Info**: 世界观信息/Lorebook，用于增强角色扮演的背景设定
- **Preset**: 预设配置，包含 API 参数、采样设置等
- **Local Storage**: 设备本地存储，用于保存所有用户数据
- **Persona**: 用户人设，定义用户在对话中的角色
- **Author's Note**: 作者注释，用于引导 AI 生成方向
- **Instruct Mode**: 指令模式，用于格式化发送给 LLM 的提示词
- **Extension**: 扩展功能模块（TTS、翻译、表情、图像生成等）
- **Swipe**: 滑动功能，重新生成 AI 回复
- **Token**: 文本分词单位，用于计算上下文长度

## Requirements

### Requirement 1: 跨平台移动应用框架

**User Story:** 作为开发者，我希望使用跨平台框架构建应用，以便同时支持 iOS 和 Android 平台并复用代码。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL use React Native as the cross-platform framework
2. THE SillyTavern Mobile SHALL compile to native iOS and Android applications
3. THE SillyTavern Mobile SHALL provide consistent user experience across both platforms
4. THE SillyTavern Mobile SHALL support iOS 14+ and Android 8.0+ operating systems
5. THE SillyTavern Mobile SHALL use TypeScript for type safety

### Requirement 2: 本地数据存储与持久化

**User Story:** 作为用户，我希望所有数据都存储在我的设备上，以便在没有网络连接时也能访问我的角色和对话历史。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL store all character cards in device local storage using SQLite database
2. THE SillyTavern Mobile SHALL store all chat sessions in device local storage
3. THE SillyTavern Mobile SHALL store all user settings and presets in device local storage
4. THE SillyTavern Mobile SHALL store all world info/lorebook data in device local storage
5. THE SillyTavern Mobile SHALL store all persona data in device local storage
6. THE SillyTavern Mobile SHALL store all group configurations in device local storage
7. WHEN the application starts THEN THE SillyTavern Mobile SHALL load previously saved data from local storage
8. WHEN data is modified THEN THE SillyTavern Mobile SHALL persist changes to local storage within 1 second
9. THE SillyTavern Mobile SHALL serialize data to JSON format for storage and export
10. THE SillyTavern Mobile SHALL deserialize data from JSON format when loading
11. THE SillyTavern Mobile SHALL provide a JSON pretty printer for data export and round-trip validation

### Requirement 3: LLM API 集成 - Chat Completion APIs

**User Story:** 作为用户，我希望能够连接到各种 Chat Completion 风格的 LLM API 服务，以便使用主流 AI 模型进行对话。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support OpenAI API connections (GPT-3.5, GPT-4, GPT-4o)
2. THE SillyTavern Mobile SHALL support Claude/Anthropic API connections
3. THE SillyTavern Mobile SHALL support Google AI (Gemini) API connections
4. THE SillyTavern Mobile SHALL support OpenRouter API connections
5. THE SillyTavern Mobile SHALL support Azure OpenAI API connections
6. THE SillyTavern Mobile SHALL support Mistral AI API connections
7. THE SillyTavern Mobile SHALL support custom OpenAI-compatible API endpoints
8. WHEN a user configures an API key THEN THE SillyTavern Mobile SHALL store the key securely in encrypted storage
9. WHEN sending a request to an LLM API THEN THE SillyTavern Mobile SHALL handle network errors gracefully and display appropriate error messages
10. THE SillyTavern Mobile SHALL support streaming responses (SSE) from LLM APIs
11. THE SillyTavern Mobile SHALL support configurable request timeout settings

### Requirement 4: LLM API 集成 - Text Completion APIs

**User Story:** 作为用户，我希望能够连接到 Text Completion 风格的 API，以便使用本地或特定的 LLM 服务。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support NovelAI API connections
2. THE SillyTavern Mobile SHALL support KoboldAI API connections
3. THE SillyTavern Mobile SHALL support Text Generation WebUI (oobabooga) API connections
4. THE SillyTavern Mobile SHALL support Ollama API connections
5. THE SillyTavern Mobile SHALL support llama.cpp server API connections
6. THE SillyTavern Mobile SHALL support AI Horde API connections
7. THE SillyTavern Mobile SHALL support TabbyAPI connections
8. THE SillyTavern Mobile SHALL support vLLM API connections

### Requirement 5: 角色管理

**User Story:** 作为用户，我希望能够创建、编辑、导入和导出角色卡片，以便管理我的角色收藏。

#### Acceptance Criteria

1. WHEN a user creates a new character THEN THE SillyTavern Mobile SHALL save the character card with all standard fields (name, description, personality, scenario, first_message, mes_example, creator_notes, tags, etc.)
2. WHEN a user edits a character THEN THE SillyTavern Mobile SHALL update the character card in local storage
3. WHEN a user imports a PNG character card THEN THE SillyTavern Mobile SHALL extract and parse embedded character data from PNG metadata
4. WHEN a user imports a JSON character card THEN THE SillyTavern Mobile SHALL parse and store the character data
5. WHEN a user exports a character as PNG THEN THE SillyTavern Mobile SHALL embed character data into PNG metadata
6. WHEN a user exports a character as JSON THEN THE SillyTavern Mobile SHALL generate a valid V2 character card file
7. THE SillyTavern Mobile SHALL support both V1 and V2 character card specifications
8. THE SillyTavern Mobile SHALL display character list with avatars, names, and tags
9. WHEN a user deletes a character THEN THE SillyTavern Mobile SHALL remove the character and optionally associated chat data
10. THE SillyTavern Mobile SHALL support character tagging and filtering
11. THE SillyTavern Mobile SHALL support character favorites marking
12. THE SillyTavern Mobile SHALL support bulk character operations (delete, tag, export)

### Requirement 6: 对话功能

**User Story:** 作为用户，我希望能够与角色进行流畅的对话，以便享受角色扮演体验。

#### Acceptance Criteria

1. WHEN a user sends a message THEN THE SillyTavern Mobile SHALL construct the prompt using character card data, chat history, world info, and author's note
2. WHEN a user sends a message THEN THE SillyTavern Mobile SHALL send the constructed prompt to the configured LLM API
3. WHEN receiving a streaming response THEN THE SillyTavern Mobile SHALL display tokens in real-time as received
4. WHEN a response is complete THEN THE SillyTavern Mobile SHALL save the message to chat history
5. WHEN a user swipes left/right on a message THEN THE SillyTavern Mobile SHALL navigate between alternative responses
6. WHEN a user triggers regenerate THEN THE SillyTavern Mobile SHALL request a new response and add it as a swipe alternative
7. WHEN a user edits a message THEN THE SillyTavern Mobile SHALL update the message in chat history
8. WHEN a user deletes a message THEN THE SillyTavern Mobile SHALL remove the message from chat history
9. THE SillyTavern Mobile SHALL support markdown rendering in messages (bold, italic, code, etc.)
10. THE SillyTavern Mobile SHALL support message continuation (continue generating)
11. THE SillyTavern Mobile SHALL support impersonation (generate as user)
12. THE SillyTavern Mobile SHALL support message branching and chat forking

### Requirement 7: 群聊功能

**User Story:** 作为用户，我希望能够创建多角色群聊，以便体验多角色互动场景。

#### Acceptance Criteria

1. WHEN a user creates a group THEN THE SillyTavern Mobile SHALL allow selecting multiple characters to participate
2. THE SillyTavern Mobile SHALL support configurable group response generation modes (round-robin, random, etc.)
3. WHEN generating group responses THEN THE SillyTavern Mobile SHALL maintain each character's distinct personality
4. THE SillyTavern Mobile SHALL support group chat history management
5. THE SillyTavern Mobile SHALL support adding/removing characters from existing groups
6. THE SillyTavern Mobile SHALL support group-specific settings and configurations

### Requirement 8: World Info / Lorebook

**User Story:** 作为用户，我希望能够创建和管理世界观信息，以便丰富角色扮演的背景设定。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support creating world info entries with keywords, content, and conditions
2. THE SillyTavern Mobile SHALL support importing/exporting world info as JSON files
3. WHEN keywords are detected in chat context THEN THE SillyTavern Mobile SHALL inject corresponding world info content into the prompt
4. THE SillyTavern Mobile SHALL support regex-based keyword matching
5. THE SillyTavern Mobile SHALL support world info entry priority and insertion order
6. THE SillyTavern Mobile SHALL support character-embedded world info
7. THE SillyTavern Mobile SHALL support global and character-specific world info books
8. THE SillyTavern Mobile SHALL support world info scanning depth configuration

### Requirement 9: Persona 用户人设

**User Story:** 作为用户，我希望能够创建和切换不同的用户人设，以便在不同场景使用不同身份。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support creating multiple user personas with name, description, and avatar
2. THE SillyTavern Mobile SHALL support switching between personas during chat
3. WHEN a persona is active THEN THE SillyTavern Mobile SHALL include persona description in prompt construction
4. THE SillyTavern Mobile SHALL support persona-specific settings
5. THE SillyTavern Mobile SHALL support importing/exporting personas

### Requirement 10: 提示词管理

**User Story:** 作为用户，我希望能够精细控制发送给 AI 的提示词结构，以便获得更好的生成效果。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support Author's Note with configurable insertion position and depth
2. THE SillyTavern Mobile SHALL support system prompt customization
3. THE SillyTavern Mobile SHALL support Instruct Mode with customizable templates
4. THE SillyTavern Mobile SHALL support prompt manager for Chat Completion APIs (system/user/assistant message ordering)
5. THE SillyTavern Mobile SHALL support jailbreak prompts and NSFW toggles
6. THE SillyTavern Mobile SHALL support custom stopping strings
7. THE SillyTavern Mobile SHALL display token count for prompts and context

### Requirement 11: 采样参数配置

**User Story:** 作为用户，我希望能够调整 AI 生成的采样参数，以便控制输出的创造性和一致性。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support configuring temperature parameter
2. THE SillyTavern Mobile SHALL support configuring top_p (nucleus sampling) parameter
3. THE SillyTavern Mobile SHALL support configuring top_k parameter
4. THE SillyTavern Mobile SHALL support configuring repetition penalty parameters
5. THE SillyTavern Mobile SHALL support configuring max tokens/response length
6. THE SillyTavern Mobile SHALL support configuring presence and frequency penalties
7. THE SillyTavern Mobile SHALL support saving and loading parameter presets
8. THE SillyTavern Mobile SHALL support API-specific parameter configurations

### Requirement 12: Tokenizer 分词器

**User Story:** 作为用户，我希望应用能够准确计算 token 数量，以便管理上下文长度。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support multiple tokenizer implementations (tiktoken for OpenAI, sentencepiece for LLaMA, etc.)
2. THE SillyTavern Mobile SHALL display real-time token count for input and context
3. THE SillyTavern Mobile SHALL support configurable context size limits
4. WHEN context exceeds limit THEN THE SillyTavern Mobile SHALL truncate older messages appropriately

### Requirement 13: 扩展功能 - TTS 语音合成

**User Story:** 作为用户，我希望 AI 回复能够被朗读出来，以便获得更沉浸的体验。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support text-to-speech for AI responses
2. THE SillyTavern Mobile SHALL support multiple TTS providers (system TTS, ElevenLabs, etc.)
3. THE SillyTavern Mobile SHALL support configurable voice selection
4. THE SillyTavern Mobile SHALL support auto-play TTS on new messages (optional)

### Requirement 14: 扩展功能 - 翻译

**User Story:** 作为用户，我希望能够翻译消息内容，以便与使用不同语言的 AI 模型交流。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support message translation
2. THE SillyTavern Mobile SHALL support multiple translation providers
3. THE SillyTavern Mobile SHALL support auto-translate incoming/outgoing messages (optional)
4. THE SillyTavern Mobile SHALL support configurable source and target languages

### Requirement 15: 扩展功能 - 图像生成

**User Story:** 作为用户，我希望能够在对话中生成图像，以便增强视觉体验。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support Stable Diffusion API integration
2. THE SillyTavern Mobile SHALL support image generation from chat context
3. THE SillyTavern Mobile SHALL support configurable image generation parameters
4. THE SillyTavern Mobile SHALL display generated images inline in chat

### Requirement 16: 扩展功能 - 角色表情

**User Story:** 作为用户，我希望角色能够显示不同的表情图像，以便增强角色的表现力。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support character expression/sprite images
2. THE SillyTavern Mobile SHALL support automatic expression detection from message content
3. THE SillyTavern Mobile SHALL support manual expression selection
4. THE SillyTavern Mobile SHALL support importing expression image packs

### Requirement 17: 扩展功能 - Quick Reply 快捷回复

**User Story:** 作为用户，我希望能够设置快捷回复按钮，以便快速发送常用消息。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support creating quick reply buttons with custom text
2. THE SillyTavern Mobile SHALL support quick reply sets for different scenarios
3. THE SillyTavern Mobile SHALL support quick reply macros and variables
4. WHEN a quick reply is tapped THEN THE SillyTavern Mobile SHALL send the configured message

### Requirement 18: 扩展功能 - Regex 脚本

**User Story:** 作为用户，我希望能够使用正则表达式处理消息，以便自定义消息显示和处理。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support regex-based message transformation
2. THE SillyTavern Mobile SHALL support regex scripts for input and output processing
3. THE SillyTavern Mobile SHALL support importing/exporting regex scripts

### Requirement 19: 扩展功能 - 向量数据库/记忆

**User Story:** 作为用户，我希望 AI 能够记住更长的对话历史，以便保持对话的连贯性。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support vector embedding for chat messages
2. THE SillyTavern Mobile SHALL support semantic search in chat history
3. THE SillyTavern Mobile SHALL support injecting relevant past messages into context
4. THE SillyTavern Mobile SHALL support local vector storage

### Requirement 20: 用户界面 - 主界面

**User Story:** 作为用户，我希望应用界面适合移动设备使用，以便在手机上获得良好的使用体验。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL provide a responsive layout optimized for mobile screens
2. THE SillyTavern Mobile SHALL support both portrait and landscape orientations
3. THE SillyTavern Mobile SHALL provide touch-friendly controls with minimum 44pt tap target sizes
4. THE SillyTavern Mobile SHALL support dark and light themes
5. THE SillyTavern Mobile SHALL support custom theme colors
6. WHEN the keyboard appears THEN THE SillyTavern Mobile SHALL adjust the layout to keep the input field visible
7. THE SillyTavern Mobile SHALL provide smooth scrolling for chat history
8. THE SillyTavern Mobile SHALL support pull-to-refresh for chat reload
9. THE SillyTavern Mobile SHALL support swipe gestures for navigation

### Requirement 21: 用户界面 - 设置面板

**User Story:** 作为用户，我希望能够方便地访问和修改各种设置，以便自定义应用行为。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL provide organized settings categories (API, Generation, UI, Extensions)
2. THE SillyTavern Mobile SHALL support settings search functionality
3. THE SillyTavern Mobile SHALL provide setting descriptions and tooltips
4. WHEN settings are changed THEN THE SillyTavern Mobile SHALL apply changes immediately or prompt for restart if required

### Requirement 22: 数据导入导出

**User Story:** 作为用户，我希望能够备份和恢复我的数据，以便在设备之间迁移或防止数据丢失。

#### Acceptance Criteria

1. WHEN a user exports data THEN THE SillyTavern Mobile SHALL create a backup file containing all characters, chats, settings, and world info
2. WHEN a user imports a backup file THEN THE SillyTavern Mobile SHALL restore all data from the backup
3. THE SillyTavern Mobile SHALL support importing data from the original SillyTavern format
4. THE SillyTavern Mobile SHALL support selective import (choose which data to import)
5. IF a backup file is corrupted THEN THE SillyTavern Mobile SHALL display an error message and preserve existing data
6. THE SillyTavern Mobile SHALL support cloud backup integration (iCloud/Google Drive) as optional feature

### Requirement 23: 离线功能

**User Story:** 作为用户，我希望在没有网络连接时仍能访问我的角色和历史对话，以便随时查看。

#### Acceptance Criteria

1. WHEN the device is offline THEN THE SillyTavern Mobile SHALL allow browsing existing characters and chat history
2. WHEN the device is offline THEN THE SillyTavern Mobile SHALL allow editing characters, settings, and world info
3. WHEN the device is offline and a user attempts to send a message THEN THE SillyTavern Mobile SHALL display a clear offline status indicator
4. WHEN network connectivity is restored THEN THE SillyTavern Mobile SHALL automatically detect and enable API features

### Requirement 24: 安全性

**User Story:** 作为用户，我希望我的 API 密钥和对话数据得到保护，以便确保隐私安全。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL store API keys using platform-specific secure storage (Keychain on iOS, Keystore on Android)
2. THE SillyTavern Mobile SHALL encrypt sensitive data at rest
3. THE SillyTavern Mobile SHALL use HTTPS for all API communications
4. WHEN the app is backgrounded THEN THE SillyTavern Mobile SHALL protect sensitive content from appearing in app switcher screenshots
5. THE SillyTavern Mobile SHALL support optional app lock with biometric authentication

### Requirement 25: 性能优化

**User Story:** 作为用户，我希望应用运行流畅，以便获得良好的使用体验。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL load character list within 2 seconds for up to 1000 characters
2. THE SillyTavern Mobile SHALL render chat messages with smooth 60fps scrolling
3. THE SillyTavern Mobile SHALL implement lazy loading for images and long chat histories
4. THE SillyTavern Mobile SHALL minimize memory usage through efficient data structures
5. THE SillyTavern Mobile SHALL support background message generation without blocking UI

### Requirement 26: 国际化

**User Story:** 作为用户，我希望应用支持多种语言，以便使用我熟悉的语言。

#### Acceptance Criteria

1. THE SillyTavern Mobile SHALL support multiple UI languages (English, Chinese, Japanese, Korean, etc.)
2. THE SillyTavern Mobile SHALL detect and use system language by default
3. THE SillyTavern Mobile SHALL allow manual language selection
4. THE SillyTavern Mobile SHALL support right-to-left (RTL) languages
