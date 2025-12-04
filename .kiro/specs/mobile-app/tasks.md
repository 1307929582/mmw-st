# Implementation Plan

## Phase 1: 项目基础设施

- [x] 1. 初始化项目和配置
  - [x] 1.1 配置 TypeScript 和路径别名
    - 更新 tsconfig.json 配置路径映射
    - 配置 babel-plugin-module-resolver
    - _Requirements: 1.5_
  - [x] 1.2 安装核心依赖
    - 安装 Zustand 状态管理
    - 安装 React Navigation
    - 安装 expo-sqlite, expo-secure-store, expo-file-system
    - _Requirements: 1.1, 2.1_
  - [x] 1.3 配置 ESLint 和 Prettier
    - 添加 TypeScript ESLint 规则
    - 配置代码格式化
    - _Requirements: 1.5_

- [x] 2. 设置测试框架
  - [x] 2.1 配置 Jest 单元测试
    - 安装 jest 和 @types/jest
    - 配置 jest.config.js
    - _Requirements: Testing Strategy_
  - [x] 2.2 配置 fast-check 属性测试
    - 安装 fast-check
    - 创建测试工具函数
    - _Requirements: Testing Strategy_

## Phase 2: Core SDK - 类型定义和存储层

- [x] 3. 实现类型定义
  - [x] 3.1 定义核心数据类型
    - Character, ChatSession, ChatMessage 类型
    - WorldInfo, Preset, Settings 类型
    - API 相关类型
    - _Requirements: 5.1, 6.4, 8.1, 11.7_
  - [x] 3.2 编写属性测试：数据类型验证
    - **Property 2: JSON Serialization Round-Trip**
    - **Validates: Requirements 2.9, 2.10, 2.11**

- [x] 4. 实现存储层
  - [x] 4.1 实现 SQLite 数据库适配器
    - 创建数据库 schema
    - 实现 CRUD 操作
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 4.2 编写属性测试：数据存储
    - **Property 1: Data Storage Round-Trip**
    - **Validates: Requirements 2.1-2.6, 2.9, 2.10**
  - [x] 4.3 实现安全存储适配器
    - 使用 expo-secure-store 存储 API 密钥
    - _Requirements: 3.8, 24.1_
  - [x] 4.4 编写属性测试：安全存储
    - **Property 3: API Key Secure Storage Round-Trip**
    - **Validates: Requirements 3.8**
  - [x] 4.5 实现文件系统适配器
    - 头像图片存储
    - 导出文件管理
    - _Requirements: 5.8, 22.1_

- [x] 5. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Core SDK - 角色管理

- [x] 6. 实现角色卡片解析器
  - [x] 6.1 实现 V1/V2 角色卡片解析
    - JSON 格式解析
    - 字段验证和默认值
    - _Requirements: 5.4, 5.7_
  - [x] 6.2 编写属性测试：角色卡片解析
    - **Property 6: Character Card JSON Round-Trip**
    - **Property 7: Character Card V1/V2 Compatibility**
    - **Validates: Requirements 5.4, 5.6, 5.7**
  - [x] 6.3 实现 PNG 元数据嵌入/提取
    - 使用 png-chunk-text 处理 PNG 元数据
    - _Requirements: 5.3, 5.5_
  - [x] 6.4 编写属性测试：PNG 角色卡片
    - **Property 5: Character Card PNG Round-Trip**
    - **Validates: Requirements 5.3, 5.5**

- [x] 7. 实现角色管理器
  - [x] 7.1 实现角色 CRUD 操作
    - 创建、读取、更新、删除角色
    - _Requirements: 5.1, 5.2, 5.9_
  - [x] 7.2 编写属性测试：角色删除
    - **Property 8: Character Deletion Removes Data**
    - **Validates: Requirements 5.9**
  - [x] 7.3 实现角色标签和过滤
    - 标签管理
    - 按标签/收藏过滤
    - _Requirements: 5.10, 5.11_
  - [x] 7.4 编写属性测试：标签过滤
    - **Property 9: Character Tag Filtering**
    - **Validates: Requirements 5.10**
  - [x] 7.5 实现角色导入导出
    - PNG/JSON 导入
    - PNG/JSON 导出
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [x] 8. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Core SDK - 对话管理

- [x] 9. 实现对话管理器
  - [x] 9.1 实现对话 CRUD 操作
    - 创建、获取、删除对话
    - _Requirements: 6.4_
  - [x] 9.2 实现消息管理
    - 添加、编辑、删除消息
    - _Requirements: 6.4, 6.7, 6.8_
  - [x] 9.3 编写属性测试：消息操作
    - **Property 11: Message Edit Persistence**
    - **Property 12: Message Deletion Removes Message**
    - **Validates: Requirements 6.7, 6.8**
  - [x] 9.4 实现滑动/重新生成功能
    - 添加滑动替代回复
    - 切换滑动索引
    - _Requirements: 6.5, 6.6_
  - [x] 9.5 编写属性测试：滑动导航
    - **Property 13: Swipe Navigation Bounds**
    - **Validates: Requirements 6.5**
  - [x] 9.6 实现对话分支
    - 从指定消息分支
    - _Requirements: 6.12_
  - [x] 9.7 编写属性测试：对话分支
    - **Property 14: Chat Fork Preserves History**
    - **Validates: Requirements 6.12**

- [x] 10. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Core SDK - 提示词构建

- [x] 11. 实现提示词构建器
  - [x] 11.1 实现基础提示词构建
    - 组合角色信息、对话历史
    - _Requirements: 6.1_
  - [x] 11.2 编写属性测试：提示词构建
    - **Property 10: Prompt Construction Completeness**
    - **Validates: Requirements 6.1**
  - [x] 11.3 实现 Instruct 模式
    - 模板解析和应用
    - _Requirements: 10.3_
  - [x] 11.4 实现 Author's Note 注入
    - 可配置插入位置和深度
    - _Requirements: 10.1_

- [x] 12. 实现分词器
  - [x] 12.1 集成 tiktoken (OpenAI)
    - 使用 js-tiktoken 或 tiktoken-node
    - _Requirements: 12.1_
  - [x] 12.2 实现上下文截断
    - 按 token 限制截断
    - 保留最近消息
    - _Requirements: 12.3, 12.4_
  - [x] 12.3 编写属性测试：上下文截断
    - **Property 17: Context Truncation Respects Limit**
    - **Property 18: Context Truncation Preserves Recent**
    - **Validates: Requirements 12.4**

- [x] 13. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Core SDK - World Info

- [ ] 14. 实现 World Info 引擎
  - [ ] 14.1 实现关键词匹配器
    - 普通关键词匹配
    - 正则表达式匹配
    - _Requirements: 8.3, 8.4_
  - [ ] 14.2 编写属性测试：关键词匹配
    - **Property 15: World Info Keyword Matching**
    - **Property 16: World Info Regex Matching**
    - **Validates: Requirements 8.3, 8.4**
  - [ ] 14.3 实现内容注入器
    - 按优先级和位置注入
    - _Requirements: 8.5_
  - [ ] 14.4 实现 World Info 管理
    - CRUD 操作
    - 导入导出
    - _Requirements: 8.1, 8.2_

- [ ] 15. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Core SDK - API 客户端

- [ ] 16. 实现 API 客户端基础
  - [ ] 16.1 实现基础 HTTP 客户端
    - 请求/响应处理
    - 错误处理
    - _Requirements: 3.9_
  - [ ] 16.2 编写属性测试：错误处理
    - **Property 4: Network Error Handling**
    - **Validates: Requirements 3.9**
  - [ ] 16.3 实现 SSE 流式响应处理
    - 解析 SSE 事件
    - 回调处理
    - _Requirements: 3.10_

- [ ] 17. 实现 OpenAI 客户端
  - [ ] 17.1 实现 Chat Completion API
    - 请求构建
    - 响应解析
    - _Requirements: 3.1_
  - [ ] 17.2 实现流式响应
    - SSE 处理
    - _Requirements: 3.10_

- [ ] 18. 实现 Anthropic 客户端
  - [ ] 18.1 实现 Messages API
    - 请求构建
    - 响应解析
    - _Requirements: 3.2_

- [ ] 19. 实现 Ollama 客户端
  - [ ] 19.1 实现 Chat API
    - 本地 API 调用
    - _Requirements: 4.4_

- [ ] 20. 实现其他 API 客户端
  - [ ] 20.1 实现 OpenRouter 客户端
    - _Requirements: 3.4_
  - [ ] 20.2 实现 Google AI 客户端
    - _Requirements: 3.3_
  - [ ] 20.3 实现自定义 OpenAI 兼容客户端
    - _Requirements: 3.7_

- [ ] 21. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: 状态管理

- [ ] 22. 实现 Zustand Stores
  - [ ] 22.1 实现 CharacterStore
    - 角色列表状态
    - 当前选中角色
    - _Requirements: 5.8_
  - [ ] 22.2 实现 ChatStore
    - 当前对话状态
    - 消息列表
    - 生成状态
    - _Requirements: 6.3, 6.4_
  - [ ] 22.3 实现 SettingsStore
    - 应用设置
    - API 配置
    - _Requirements: 21.4_

## Phase 9: UI 组件

- [ ] 23. 实现导航结构
  - [ ] 23.1 配置 React Navigation
    - Stack Navigator
    - Tab Navigator
    - _Requirements: 20.9_

- [ ] 24. 实现聊天界面
  - [ ] 24.1 实现 ChatScreen
    - 消息列表
    - 输入框
    - _Requirements: 20.1, 20.7_
  - [ ] 24.2 实现 MessageBubble 组件
    - 用户/AI 消息样式
    - Markdown 渲染
    - _Requirements: 6.9_
  - [ ] 24.3 实现 MessageInput 组件
    - 文本输入
    - 发送按钮
    - _Requirements: 20.3, 20.6_
  - [ ] 24.4 实现滑动手势
    - 左右滑动切换回复
    - _Requirements: 6.5, 20.9_

- [ ] 25. 实现角色列表界面
  - [ ] 25.1 实现 CharacterListScreen
    - 角色卡片网格/列表
    - 搜索和过滤
    - _Requirements: 5.8, 5.10_
  - [ ] 25.2 实现 CharacterCard 组件
    - 头像、名称、标签
    - _Requirements: 5.8_

- [ ] 26. 实现角色编辑界面
  - [ ] 26.1 实现 CharacterEditScreen
    - 表单字段
    - 头像选择
    - _Requirements: 5.1, 5.2_

- [ ] 27. 实现设置界面
  - [ ] 27.1 实现 SettingsScreen
    - 分类设置列表
    - _Requirements: 21.1_
  - [ ] 27.2 实现 API 配置界面
    - API 密钥输入
    - 模型选择
    - _Requirements: 3.8_
  - [ ] 27.3 实现采样参数界面
    - 温度、top_p 等滑块
    - _Requirements: 11.1-11.6_

- [ ] 28. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: 数据导入导出

- [ ] 29. 实现备份功能
  - [ ] 29.1 实现完整备份导出
    - 打包所有数据为 ZIP
    - _Requirements: 22.1_
  - [ ] 29.2 实现备份导入
    - 解析 ZIP 并恢复数据
    - _Requirements: 22.2_
  - [ ] 29.3 编写属性测试：备份
    - **Property 19: Backup Round-Trip**
    - **Property 20: Corrupted Backup Preservation**
    - **Validates: Requirements 22.1, 22.2, 22.5**
  - [ ] 29.4 实现原版 SillyTavern 格式导入
    - 兼容原版数据格式
    - _Requirements: 22.3_

## Phase 11: 主题和国际化

- [ ] 30. 实现主题系统
  - [ ] 30.1 实现深色/浅色主题
    - 主题 Context
    - 样式变量
    - _Requirements: 20.4_
  - [ ] 30.2 实现系统主题跟随
    - 检测系统主题
    - _Requirements: 20.4_

- [ ] 31. 实现国际化
  - [ ] 31.1 配置 i18n
    - 安装 i18next
    - 配置语言文件
    - _Requirements: 26.1_
  - [ ] 31.2 添加中英文翻译
    - 提取所有文本
    - 翻译文件
    - _Requirements: 26.1_

## Phase 12: 最终集成和优化

- [ ] 32. 性能优化
  - [ ] 32.1 实现列表虚拟化
    - 使用 FlashList
    - _Requirements: 25.2, 25.3_
  - [ ] 32.2 实现图片懒加载
    - 头像懒加载
    - _Requirements: 25.3_

- [ ] 33. 安全性增强
  - [ ] 33.1 实现应用切换隐藏
    - 后台时隐藏内容
    - _Requirements: 24.4_
  - [ ] 33.2 实现生物识别锁定（可选）
    - 指纹/面容解锁
    - _Requirements: 24.5_

- [ ] 34. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
