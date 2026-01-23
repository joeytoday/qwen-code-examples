# Qwen Bolt Demo - AISpider Sandbox 集成指南

## 概述

本项目成功集成了 AISpider 的 sandbox 沙箱机制，实现了在网页端使用 @qwen-code/sdk 创建项目代码、实时生成并预览的完整功能。

## 核心功能

### 1. 沙箱代码编辑器
- **多文件支持**：支持多文件项目的创建和编辑
- **文件树导航**：可视化的文件树结构，支持文件夹展开/折叠
- **语法高亮**：基于 CodeMirror 6 的代码编辑器，支持多种语言
- **实时同步**：AI 生成的代码实时映射到编辑器

### 2. AI 代码生成
- **流式响应**：实时显示 AI 生成过程
- **工具调用**：支持 write_file、create_file 等文件操作工具
- **会话管理**：每个会话独立的工作目录

### 3. 实时预览
- **自动预览**：代码生成后自动刷新预览
- **iframe 隔离**：安全的沙箱环境
- **多格式支持**：支持 HTML、CSS、JavaScript 等

## 技术架构

### 前端组件

#### CodeRenderer 组件
位置：`src/components/CodeRenderer/`

核心文件：
- `index.tsx` - 主入口组件
- `MultiFileCodeRenderer.tsx` - 多文件渲染器
- `FileTree.tsx` - 文件树组件
- `CodeEditorPanel.tsx` - 代码编辑面板
- `utils.ts` - 工具函数（文件树构建、语言识别等）

特性：
- 基于 CodeMirror 6 的代码编辑器
- 支持 TypeScript、JavaScript、Python、Markdown 等多种语言
- 可拖拽的侧边栏
- 只读/可编辑模式切换

#### Workspace 页面
位置：`src/app/workspace/page.tsx`

布局：
- **左侧**：聊天区域（消息列表 + 输入框）
- **中间**：代码编辑器（文件树 + 编辑器）
- **右侧**：实时预览（iframe）

### 后端 API

#### Chat API
位置：`src/app/api/chat/route.ts`

功能：
- 接收用户消息并调用 @qwen-code/sdk
- 流式返回 AI 响应
- 监听文件操作工具调用
- 通知前端文件更新

关键实现：
```typescript
// 工具权限配置
canUseTool: async (toolName, input) => {
  const allowedTools = [
    'write_file', 'create_file', 'edit_file', 
    'file_replace', 'read_file', 'shell',
    'search_file', 'file_grep', 'codebase_search'
  ];
  return allowedTools.includes(toolName.toLowerCase())
    ? { behavior: 'allow', updatedInput: input }
    : { behavior: 'deny', message: `Tool ${toolName} is not allowed` };
}
```

#### Files API
位置：`src/app/api/files/route.ts`

功能：
- 获取会话工作目录的文件树
- 读取指定文件内容
- 支持递归目录遍历

#### Preview API
位置：`src/app/api/preview/route.ts`

功能：
- 查找 HTML 入口文件
- 自动注入 CSS 和 JavaScript
- 返回可预览的 HTML

## 工作流程

### 1. 用户输入提示词
```
用户在聊天框输入：创建一个简单的待办事项应用
```

### 2. AI 生成代码
```
SDK 调用工具创建文件：
- index.html
- styles.css
- app.js
```

### 3. 实时同步
```
前端监听 file_updated 事件
→ 调用 /api/files 加载所有文件
→ 更新 CodeRenderer 组件
→ 刷新预览 iframe
```

### 4. 预览展示
```
/api/preview 读取文件
→ 合并 HTML/CSS/JS
→ 返回完整页面
→ iframe 渲染
```

## 使用方法

### 启动开发服务器
```bash
cd qwen-code-examples/qwen-bolt-demo
npm install
npm run dev
```

### 访问应用
打开浏览器访问：http://localhost:3000

### 开始使用
1. 在首页输入你想要创建的应用描述
2. 点击 "Build now" 或按 Enter
3. 在 workspace 页面查看 AI 生成的代码
4. 右侧实时预览生成的应用

## 核心依赖

```json
{
  "@qwen-code/sdk": "^0.1.1",
  "codemirror": "^6.0.1",
  "@codemirror/commands": "^6.8.1",
  "@codemirror/lang-javascript": "^6.2.3",
  "@codemirror/lang-python": "^6.2.0",
  "@codemirror/lang-markdown": "^6.3.2",
  "@codemirror/language": "^6.11.0",
  "@codemirror/state": "^6.5.2",
  "@codemirror/theme-one-dark": "^6.1.2",
  "@codemirror/view": "^6.36.6"
}
```

## 与 AISpider 的对比

### 相似之处
- 都使用 CodeMirror 作为代码编辑器
- 都支持多文件项目管理
- 都有文件树导航
- 都支持实时预览

### 差异
- **AISpider**：使用 WebSocket 实时通信，支持容器化沙箱
- **Qwen Bolt Demo**：使用 Server-Sent Events (SSE)，基于本地文件系统

### 优势
- 更轻量级，无需容器环境
- 更简单的部署流程
- 更快的响应速度
- 完全基于 @qwen-code/sdk

## 扩展建议

### 1. 添加代码编辑功能
目前是只读模式，可以添加：
- 手动编辑代码
- 保存修改到文件系统
- 版本控制集成

### 2. 增强预览功能
- 支持 React/Vue 等框架的实时编译
- 添加移动端预览模式
- 支持多页面应用

### 3. 协作功能
- 多用户实时协作
- 代码分享链接
- 项目导出/导入

### 4. AI 增强
- 代码解释和注释生成
- 错误修复建议
- 性能优化建议

## 故障排查

### 问题：文件未显示
**解决方案**：检查 sessionId 是否正确传递，查看浏览器控制台日志

### 问题：预览不更新
**解决方案**：点击预览区域的刷新按钮，或检查 /api/preview 是否返回正确内容

### 问题：代码编辑器空白
**解决方案**：确保 CodeMirror 依赖已正确安装，检查浏览器控制台是否有错误

## 总结

本项目成功实现了一个类似 Bolt.new 的 AI 代码生成和预览平台，核心特点是：

✅ **完整的沙箱机制**：从 AISpider 学习并简化实现  
✅ **实时代码生成**：基于 @qwen-code/sdk 的流式响应  
✅ **即时预览**：代码生成后立即可视化  
✅ **良好的用户体验**：类似 Bolt.new 的界面设计  

项目已经可以正常运行，可以通过 http://localhost:3000 访问体验完整功能。
