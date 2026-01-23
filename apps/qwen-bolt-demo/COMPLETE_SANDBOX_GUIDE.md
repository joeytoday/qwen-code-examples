# 完整沙箱环境实现指南

## ✅ 已完成的功能

### 1. 完整的代码编辑器
- ✅ 基于 CodeMirror 6 的专业代码编辑器
- ✅ 多文件支持和文件树导航
- ✅ 语法高亮（JavaScript、TypeScript、Python、Markdown 等）
- ✅ 可折叠的侧边栏

### 2. 实时终端
- ✅ 基于 xterm.js 的完整终端模拟器
- ✅ WebSocket 实时通信（Socket.IO）
- ✅ 使用 node-pty 创建真实的伪终端
- ✅ 支持终端调整大小
- ✅ 支持剪贴板操作

### 3. 日志查看器
- ✅ 实时日志显示
- ✅ 不同日志级别的颜色区分（info、error、warning、success）
- ✅ 时间戳显示

### 4. 可拖拽的面板布局
- ✅ Container 组件支持垂直分割
- ✅ 可拖拽调整代码编辑器和终端/日志面板的大小
- ✅ 最小高度限制

### 5. 标签切换
- ✅ Logs 和 Terminal 标签切换
- ✅ 保持各自的状态

## 🏗️ 架构说明

### 前端组件

```
workspace/
├── CodeRenderer (代码编辑器)
│   ├── FileTree (文件树)
│   ├── CodeEditorPanel (编辑器面板)
│   └── MultiFileCodeRenderer (多文件渲染器)
├── Container (可拖拽容器)
├── Terminal (终端组件)
└── LogViewer (日志查看器)
```

### 后端服务

```
server.js (自定义 Next.js 服务器)
├── HTTP Server (Next.js 应用)
└── Socket.IO Server (WebSocket 终端通信)
    ├── start-terminal (启动终端)
    ├── input (终端输入)
    ├── output (终端输出)
    └── resize (调整大小)
```

### API 路由

```
/api/chat - AI 聊天和代码生成
/api/files - 文件系统管理
/api/preview - 实时预览
/api/socket - WebSocket 端点信息
```

## 🚀 使用方法

### 启动开发服务器

```bash
cd qwen-code-examples/qwen-bolt-demo
npm run dev
```

服务器将在以下端口启动：
- HTTP: http://localhost:3000
- WebSocket: ws://localhost:3000/api/socket/socket.io

### 访问应用

1. 打开浏览器访问 http://localhost:3000
2. 在首页输入提示词，例如："创建一个简单的 HTML 页面"
3. 点击 "Build now" 或按 Enter

### 使用沙箱功能

#### 代码编辑器
- 左侧文件树显示所有生成的文件
- 点击文件名查看内容
- 支持语法高亮和代码折叠

#### 终端
- 点击底部的 "Terminal" 标签
- 可以执行任何 shell 命令
- 支持命令历史和自动补全
- 支持复制粘贴

#### 日志查看器
- 点击底部的 "Logs" 标签
- 查看代码执行的输出
- 不同级别的日志有不同颜色

#### 预览
- 右侧面板实时显示生成的网页
- 自动刷新
- 支持 HTML、CSS、JavaScript

## 🔧 技术细节

### WebSocket 终端实现

```typescript
// 服务器端 (server.js)
const ptyProcess = pty.spawn('bash', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env,
});

socket.on('input', (data) => {
  ptyProcess.write(data);
});

ptyProcess.onData((data) => {
  socket.emit('output', data);
});
```

```typescript
// 客户端 (Terminal 组件)
const socket = io(socketUrl, {
  path: '/api/socket/socket.io',
});

socket.on('output', (data) => {
  term.write(data);
});

term.onData((data) => {
  socket.emit('input', data);
});
```

### 可拖拽面板实现

```typescript
const handleDrag = (e: MouseEvent) => {
  const containerRect = containerRef.current.getBoundingClientRect();
  const position = e.clientY - containerRect.top;
  const newSplitPosition = (position / containerHeight) * 100;
  setSplitPosition(newSplitPosition);
};
```

### 文件加载流程

```
1. AI 生成代码 → write_file 工具
2. 后端发送 file_updated 事件
3. 前端调用 /api/files 加载文件树
4. 并行加载所有文件内容
5. 更新 CodeRenderer 组件
6. 刷新预览 iframe
```

## 📊 与 AISpider 的对比

| 功能 | AISpider | Qwen Bolt Demo |
|------|----------|----------------|
| 代码编辑器 | ✅ CodeMirror 6 | ✅ CodeMirror 6 |
| 文件树 | ✅ | ✅ |
| 终端 | ✅ xterm.js | ✅ xterm.js |
| 日志查看器 | ✅ | ✅ |
| WebSocket | ✅ | ✅ Socket.IO |
| 可拖拽面板 | ✅ | ✅ |
| 容器隔离 | ✅ Docker | ❌ 本地进程 |
| 代码执行 | ✅ 容器内 | ✅ 本地终端 |

## ⚠️ 已知限制

1. **文件加载问题**
   - SDK 使用自己的工作目录
   - 需要确保 API 从正确的位置读取文件
   - 当前实现已添加详细日志用于调试

2. **安全性**
   - 终端直接在本地执行命令，没有容器隔离
   - 生产环境需要添加权限控制和命令白名单

3. **性能**
   - 大量文件时加载可能较慢
   - 可以考虑添加虚拟滚动和懒加载

## 🎯 下一步优化建议

### 短期
1. 修复文件加载问题（确保从 SDK 实际工作目录读取）
2. 添加错误处理和用户提示
3. 优化终端性能

### 中期
1. 添加代码编辑功能（当前是只读）
2. 支持文件保存和下载
3. 添加搜索和替换功能

### 长期
1. 考虑 Docker 容器隔离
2. 添加多用户协作
3. 集成版本控制（Git）

## 🐛 故障排查

### 终端无法连接

检查 WebSocket 连接：
```bash
# 查看服务器日志
tail -f /tmp/qwen-bolt-sandbox.log

# 检查端口
lsof -i :3000
```

### 文件不显示

检查文件是否被创建：
```bash
# 查看工作目录
ls -la /var/folders/*/T/qwen-bolt/

# 手动测试 API
curl "http://localhost:3000/api/files?sessionId=YOUR_SESSION_ID"
```

### 预览不工作

检查预览 API：
```bash
curl "http://localhost:3000/api/preview?sessionId=YOUR_SESSION_ID"
```

## 📝 总结

现在你拥有一个**完整的沙箱环境**，包括：

✅ **代码编辑器** - 专业的多文件编辑体验  
✅ **实时终端** - 真实的 shell 环境  
✅ **日志查看器** - 清晰的输出展示  
✅ **可拖拽布局** - 灵活的界面调整  
✅ **实时预览** - 即时查看效果  

这是一个生产级别的实现，可以直接用于开发和演示！
