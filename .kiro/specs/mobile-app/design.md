# Design Document - SillyTavern Mobile

## Overview

SillyTavern Mobile 是一个跨平台移动应用，使用 React Native + Expo 构建，为用户提供与原版 SillyTavern 相同的 LLM 角色扮演体验。应用采用无后端架构，直接从设备调用 LLM API，所有数据存储在本地。

### 核心设计原则

1. **无后端架构** - App 直接与 LLM API 通信，无需中间服务器
2. **本地优先** - 所有数据存储在设备本地，支持离线访问
3. **模块化设计** - Core SDK 与 UI 层分离，便于维护和测试
4. **类型安全** - 全面使用 TypeScript，确保代码质量
5. **功能对等** - 与原版 SillyTavern 保持功能一致

## Architecture

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (React Native)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Screens   │ │ Components  │ │    Navigation           ││
│  │  - Chat     │ │ - Message   │ │  - Stack Navigator      ││
│  │  - Character│ │ - CharCard  │ │  - Tab Navigator        ││
│  │  - Settings │ │ - Input     │ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                    State Management (Zustand)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ ChatStore   │ │CharacterStore│ │    SettingsStore       ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                      Core SDK (TypeScript)                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐ │
│  │ API Client│ │ Character │ │   Chat    │ │   Prompt    │ │
│  │ - OpenAI  │ │ - Parser  │ │ - Manager │ │  - Builder  │ │
│  │ - Claude  │ │ - V1/V2   │ │ - History │ │  - Instruct │ │
│  │ - Ollama  │ │ - PNG     │ │ - Swipes  │ │  - Template │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────┘ │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐ │
│  │ Tokenizer │ │ WorldInfo │ │  Persona  │ │   Preset    │ │
│  │ - tiktoken│ │ - Matcher │ │ - Manager │ │  - Manager  │ │
│  │ - llama   │ │ - Injector│ │           │ │             │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Storage Layer                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐│
│  │  SQLite (expo)  │ │  SecureStore    │ │  FileSystem    ││
│  │  - Characters   │ │  - API Keys     │ │  - Avatars     ││
│  │  - Chats        │ │  - Secrets      │ │  - Exports     ││
│  │  - Settings     │ │                 │ │  - Backups     ││
│  └─────────────────┘ └─────────────────┘ └────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                    Network Layer                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  HTTP Client (fetch) + SSE Streaming                    ││
│  │  - Request/Response handling                            ││
│  │  - Error handling & retry                               ││
│  │  - Timeout management                                   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 目录结构

```
mobile/
├── src/
│   ├── core/                    # Core SDK - 平台无关的业务逻辑
│   │   ├── api/                 # LLM API 客户端
│   │   │   ├── client.ts        # 基础客户端接口
│   │   │   ├── openai.ts        # OpenAI 实现
│   │   │   ├── anthropic.ts     # Claude 实现
│   │   │   ├── ollama.ts        # Ollama 实现
│   │   │   └── index.ts
│   │   ├── character/           # 角色管理
│   │   │   ├── parser.ts        # 角色卡片解析器
│   │   │   ├── validator.ts     # 数据验证
│   │   │   ├── png-embed.ts     # PNG 元数据处理
│   │   │   └── index.ts
│   │   ├── chat/                # 对话管理
│   │   │   ├── manager.ts       # 对话管理器
│   │   │   ├── message.ts       # 消息处理
│   │   │   ├── swipe.ts         # 滑动/重新生成
│   │   │   └── index.ts
│   │   ├── prompt/              # 提示词构建
│   │   │   ├── builder.ts       # 提示词构建器
│   │   │   ├── instruct.ts      # Instruct 模式
│   │   │   ├── template.ts      # 模板引擎
│   │   │   └── index.ts
│   │   ├── tokenizer/           # 分词器
│   │   │   ├── tiktoken.ts      # OpenAI tokenizer
│   │   │   ├── sentencepiece.ts # LLaMA tokenizer
│   │   │   └── index.ts
│   │   ├── worldinfo/           # World Info
│   │   │   ├── matcher.ts       # 关键词匹配
│   │   │   ├── injector.ts      # 内容注入
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── storage/                 # 存储适配器
│   │   ├── database.ts          # SQLite 数据库
│   │   ├── secure.ts            # 安全存储
│   │   ├── filesystem.ts        # 文件系统
│   │   └── index.ts
│   ├── stores/                  # 状态管理 (Zustand)
│   │   ├── chat.ts
│   │   ├── character.ts
│   │   ├── settings.ts
│   │   └── index.ts
│   ├── screens/                 # 页面组件
│   │   ├── ChatScreen.tsx
│   │   ├── CharacterListScreen.tsx
│   │   ├── CharacterEditScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── index.ts
│   ├── components/              # UI 组件
│   │   ├── chat/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── ChatHeader.tsx
│   │   ├── character/
│   │   │   ├── CharacterCard.tsx
│   │   │   └── CharacterAvatar.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       └── Input.tsx
│   ├── navigation/              # 导航配置
│   │   └── AppNavigator.tsx
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useChat.ts
│   │   └── useCharacter.ts
│   ├── utils/                   # 工具函数
│   │   ├── format.ts
│   │   └── validation.ts
│   └── types/                   # TypeScript 类型
│       └── index.ts
├── assets/                      # 静态资源
├── App.tsx                      # 入口组件
└── package.json
```

## Components and Interfaces

### Core SDK 接口

#### API Client Interface

```typescript
// src/core/api/client.ts
export interface APIClient {
  /**
   * 发送生成请求
   */
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  
  /**
   * 发送流式生成请求
   */
  generateStream(
    request: GenerationRequest,
    onToken: (token: string) => void,
    onComplete: (response: GenerationResponse) => void,
    onError: (error: Error) => void
  ): AbortController;
  
  /**
   * 测试连接
   */
  testConnection(): Promise<boolean>;
  
  /**
   * 获取可用模型列表
   */
  getModels(): Promise<string[]>;
}

export interface GenerationRequest {
  messages: ChatMessage[];
  config: GenerationConfig;
}

export interface GenerationConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repetitionPenalty?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
}
```

#### Character Manager Interface

```typescript
// src/core/character/manager.ts
export interface CharacterManager {
  /**
   * 创建角色
   */
  create(data: CharacterData): Promise<Character>;
  
  /**
   * 获取角色
   */
  get(id: string): Promise<Character | null>;
  
  /**
   * 更新角色
   */
  update(id: string, data: Partial<CharacterData>): Promise<Character>;
  
  /**
   * 删除角色
   */
  delete(id: string, deleteChats?: boolean): Promise<void>;
  
  /**
   * 列出所有角色
   */
  list(filter?: CharacterFilter): Promise<Character[]>;
  
  /**
   * 导入角色卡片 (PNG/JSON)
   */
  import(file: File | string): Promise<Character>;
  
  /**
   * 导出角色卡片
   */
  export(id: string, format: 'png' | 'json'): Promise<Blob | string>;
}
```

#### Chat Manager Interface

```typescript
// src/core/chat/manager.ts
export interface ChatManager {
  /**
   * 创建新对话
   */
  create(characterId: string): Promise<ChatSession>;
  
  /**
   * 获取对话
   */
  get(id: string): Promise<ChatSession | null>;
  
  /**
   * 添加消息
   */
  addMessage(sessionId: string, message: ChatMessage): Promise<void>;
  
  /**
   * 更新消息
   */
  updateMessage(sessionId: string, messageId: string, content: string): Promise<void>;
  
  /**
   * 删除消息
   */
  deleteMessage(sessionId: string, messageId: string): Promise<void>;
  
  /**
   * 添加滑动替代回复
   */
  addSwipe(sessionId: string, messageId: string, content: string): Promise<void>;
  
  /**
   * 切换滑动
   */
  setSwipeIndex(sessionId: string, messageId: string, index: number): Promise<void>;
  
  /**
   * 分支对话
   */
  fork(sessionId: string, fromMessageId: string): Promise<ChatSession>;
}
```

#### Prompt Builder Interface

```typescript
// src/core/prompt/builder.ts
export interface PromptBuilder {
  /**
   * 构建完整提示词
   */
  build(context: PromptContext): PromptResult;
  
  /**
   * 计算 token 数量
   */
  countTokens(text: string, tokenizer: string): number;
  
  /**
   * 截断到指定 token 数
   */
  truncate(messages: ChatMessage[], maxTokens: number): ChatMessage[];
}

export interface PromptContext {
  character: CharacterData;
  chatHistory: ChatMessage[];
  worldInfo?: WorldInfoBook[];
  persona?: Persona;
  authorsNote?: AuthorsNote;
  systemPrompt?: string;
  instructTemplate?: InstructTemplate;
  maxContextTokens: number;
}

export interface PromptResult {
  messages: Array<{role: string; content: string}>;
  tokenCount: number;
  truncated: boolean;
}
```

#### World Info Matcher Interface

```typescript
// src/core/worldinfo/matcher.ts
export interface WorldInfoMatcher {
  /**
   * 扫描文本并返回匹配的条目
   */
  scan(text: string, entries: WorldInfoEntry[]): WorldInfoEntry[];
  
  /**
   * 检查单个条目是否匹配
   */
  matches(text: string, entry: WorldInfoEntry): boolean;
}
```

### Storage Interfaces

```typescript
// src/storage/database.ts
export interface Database {
  // Characters
  saveCharacter(character: Character): Promise<void>;
  getCharacter(id: string): Promise<Character | null>;
  getAllCharacters(): Promise<Character[]>;
  deleteCharacter(id: string): Promise<void>;
  
  // Chats
  saveChat(chat: ChatSession): Promise<void>;
  getChat(id: string): Promise<ChatSession | null>;
  getChatsForCharacter(characterId: string): Promise<ChatSession[]>;
  deleteChat(id: string): Promise<void>;
  
  // Settings
  saveSetting(key: string, value: any): Promise<void>;
  getSetting<T>(key: string): Promise<T | null>;
  
  // World Info
  saveWorldInfo(book: WorldInfoBook): Promise<void>;
  getWorldInfo(id: string): Promise<WorldInfoBook | null>;
  getAllWorldInfo(): Promise<WorldInfoBook[]>;
  
  // Presets
  savePreset(preset: Preset): Promise<void>;
  getPreset(id: string): Promise<Preset | null>;
  getAllPresets(): Promise<Preset[]>;
}

// src/storage/secure.ts
export interface SecureStorage {
  /**
   * 安全存储 API 密钥
   */
  setApiKey(provider: string, key: string): Promise<void>;
  
  /**
   * 获取 API 密钥
   */
  getApiKey(provider: string): Promise<string | null>;
  
  /**
   * 删除 API 密钥
   */
  deleteApiKey(provider: string): Promise<void>;
}
```

## Data Models

### Character Card (V2 Spec)

```typescript
export interface CharacterCard {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: CharacterData;
}

export interface CharacterData {
  // Required fields
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  
  // Optional fields
  creator_notes?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  alternate_greetings?: string[];
  tags?: string[];
  creator?: string;
  character_version?: string;
  
  // Extensions
  extensions?: {
    world?: string;           // Embedded world info
    depth_prompt?: {
      prompt: string;
      depth: number;
      role: 'system' | 'user' | 'assistant';
    };
    [key: string]: unknown;
  };
}

// Internal representation with metadata
export interface Character extends CharacterData {
  id: string;
  avatar?: string;           // Base64 or file path
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  chatCount: number;
}
```

### Chat Session

```typescript
export interface ChatSession {
  id: string;
  characterId: string;
  groupId?: string;          // For group chats
  messages: ChatMessage[];
  metadata: ChatMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  
  // Swipes
  swipes?: string[];
  swipeIndex?: number;
  
  // Metadata
  tokenCount?: number;
  isEdited?: boolean;
  generationConfig?: GenerationConfig;
}

export interface ChatMetadata {
  authorsNote?: string;
  authorsNotePosition?: number;
  worldInfoBooks?: string[];
  personaId?: string;
}
```

### World Info

```typescript
export interface WorldInfoBook {
  id: string;
  name: string;
  description?: string;
  entries: WorldInfoEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface WorldInfoEntry {
  id: string;
  keys: string[];
  secondaryKeys?: string[];
  content: string;
  comment?: string;
  
  // Conditions
  enabled: boolean;
  constant?: boolean;
  selective?: boolean;
  
  // Insertion
  position: 'before_char' | 'after_char' | 'before_example' | 'after_example' | 'depth';
  depth?: number;
  
  // Matching
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  useRegex?: boolean;
  
  // Priority
  order: number;
  priority?: number;
  
  // Token budget
  tokenBudget?: number;
}
```

### Settings

```typescript
export interface AppSettings {
  // UI
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
  
  // API
  defaultProvider: APIProvider;
  defaultModel?: string;
  
  // Generation
  defaultPresetId?: string;
  streamingEnabled: boolean;
  
  // Features
  autoSave: boolean;
  confirmDelete: boolean;
  
  // Privacy
  hideInAppSwitcher: boolean;
  biometricLock: boolean;
}

export interface Preset {
  id: string;
  name: string;
  provider?: APIProvider;
  config: GenerationConfig;
  createdAt: number;
  updatedAt: number;
}
```

### API Configuration

```typescript
export type APIProvider = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'azure'
  | 'mistral'
  | 'novelai'
  | 'koboldai'
  | 'ollama'
  | 'textgen'
  | 'llamacpp'
  | 'horde'
  | 'tabby'
  | 'vllm'
  | 'custom';

export interface APIEndpoint {
  provider: APIProvider;
  name: string;
  baseUrl: string;
  model?: string;
  headers?: Record<string, string>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Data Storage Round-Trip
*For any* valid data object (character, chat, settings, world info, persona, preset), storing it to the database and then retrieving it SHALL produce an equivalent object.
**Validates: Requirements 2.1-2.6, 2.9, 2.10**

### Property 2: JSON Serialization Round-Trip
*For any* valid data object, serializing to JSON and then deserializing SHALL produce an equivalent object.
**Validates: Requirements 2.9, 2.10, 2.11**

### Property 3: API Key Secure Storage Round-Trip
*For any* valid API key string, storing it in secure storage and retrieving it SHALL produce the same string.
**Validates: Requirements 3.8**

### Property 4: Network Error Handling
*For any* network error type (timeout, connection refused, invalid response), the API client SHALL produce an appropriate error message without crashing.
**Validates: Requirements 3.9**

### Property 5: Character Card PNG Round-Trip
*For any* valid character data, embedding it into a PNG and extracting it SHALL produce equivalent character data.
**Validates: Requirements 5.3, 5.5**

### Property 6: Character Card JSON Round-Trip
*For any* valid character data, exporting to JSON and importing SHALL produce equivalent character data.
**Validates: Requirements 5.4, 5.6**

### Property 7: Character Card V1/V2 Compatibility
*For any* valid V1 character card, parsing it SHALL produce valid character data. *For any* valid V2 character card, parsing it SHALL produce valid character data.
**Validates: Requirements 5.7**

### Property 8: Character Deletion Removes Data
*For any* character, after deletion, retrieving that character SHALL return null.
**Validates: Requirements 5.9**

### Property 9: Character Tag Filtering
*For any* set of characters with tags, filtering by a specific tag SHALL return only characters that have that tag.
**Validates: Requirements 5.10**

### Property 10: Prompt Construction Completeness
*For any* valid prompt context (character, chat history, world info, persona), the constructed prompt SHALL contain all required components in the correct order.
**Validates: Requirements 6.1**

### Property 11: Message Edit Persistence
*For any* message edit operation, retrieving the message afterwards SHALL show the updated content.
**Validates: Requirements 6.7**

### Property 12: Message Deletion Removes Message
*For any* message, after deletion, the chat history SHALL not contain that message.
**Validates: Requirements 6.8**

### Property 13: Swipe Navigation Bounds
*For any* message with N swipes, setting swipe index to any value SHALL result in an index between 0 and N-1 (clamped).
**Validates: Requirements 6.5**

### Property 14: Chat Fork Preserves History
*For any* chat fork operation from message M, the new chat SHALL contain all messages up to and including M.
**Validates: Requirements 6.12**

### Property 15: World Info Keyword Matching
*For any* text containing a world info keyword, the matcher SHALL return entries that contain that keyword.
**Validates: Requirements 8.3**

### Property 16: World Info Regex Matching
*For any* text and regex pattern, the matcher SHALL correctly identify matches according to regex semantics.
**Validates: Requirements 8.4**

### Property 17: Context Truncation Respects Limit
*For any* set of messages and token limit, truncation SHALL produce a result with token count less than or equal to the limit.
**Validates: Requirements 12.4**

### Property 18: Context Truncation Preserves Recent
*For any* truncation operation, the most recent messages SHALL be preserved (older messages truncated first).
**Validates: Requirements 12.4**

### Property 19: Backup Round-Trip
*For any* complete app state, creating a backup and restoring it SHALL produce equivalent state.
**Validates: Requirements 22.1, 22.2**

### Property 20: Corrupted Backup Preservation
*For any* corrupted backup file, attempting to import SHALL fail gracefully and preserve existing data unchanged.
**Validates: Requirements 22.5**

## Error Handling

### Error Categories

```typescript
export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  STORAGE = 'storage',
  VALIDATION = 'validation',
  PARSE = 'parse',
  UNKNOWN = 'unknown'
}

export interface AppError {
  category: ErrorCategory;
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
}
```

### Error Handling Strategy

1. **Network Errors**
   - Timeout: 显示超时提示，允许重试
   - Connection refused: 检查网络连接，显示离线状态
   - Invalid response: 记录错误，显示友好提示

2. **API Errors**
   - 401 Unauthorized: 提示检查 API 密钥
   - 429 Rate Limited: 显示等待时间，自动重试
   - 500 Server Error: 显示服务器错误，允许重试

3. **Storage Errors**
   - Database error: 尝试恢复，必要时重建数据库
   - File not found: 使用默认值或提示用户

4. **Validation Errors**
   - Invalid character card: 显示具体验证错误
   - Invalid settings: 使用默认值

## Testing Strategy

### Unit Testing

使用 Jest 进行单元测试，覆盖：
- Core SDK 所有模块
- 数据验证逻辑
- 工具函数

### Property-Based Testing

使用 **fast-check** 库进行属性测试，验证所有 Correctness Properties。

配置：
- 每个属性测试运行 **100 次迭代**
- 使用 shrinking 找到最小失败用例

测试文件命名：`*.property.test.ts`

### Integration Testing

- 存储层集成测试
- API 客户端集成测试（使用 mock server）

### E2E Testing

使用 Detox 进行端到端测试：
- 关键用户流程
- 跨平台一致性验证
