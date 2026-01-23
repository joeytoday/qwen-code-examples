# 🔧 终端问题修复指南

## 当前问题

终端显示 `[Error starting terminal: Error: posix_spawnp failed.]` 并且无法输入。

## 🎯 立即解决方案

### 方法 1: 刷新浏览器（最简单）

1. **完全刷新页面**
   - 按 `Cmd + Shift + R` (Mac) 或 `Ctrl + Shift + R` (Windows/Linux)
   - 这会清除缓存并重新连接到服务器

2. **如果还是不行，清除浏览器缓存**
   - 打开开发者工具 (F12)
   - 右键点击刷新按钮
   - 选择"清空缓存并硬性重新加载"

### 方法 2: 重启服务器

在你的终端中执行：

```bash
cd ~/Desktop/project/AiToDo/qwen-code-examples/qwen-bolt-demo

# 1. 停止所有 node 进程
pkill -f "node server.js"

# 2. 等待 2 秒
sleep 2

# 3. 启动服务器
npm run dev
```

然后刷新浏览器页面。

### 方法 3: 检查服务器状态

```bash
# 检查服务器是否运行
ps aux | grep "node server.js"

# 检查端口
lsof -i :3000

# 查看日志
tail -f /tmp/qwen-bolt-clean-restart.log
```

## 📋 关于预览问题

### 为什么右侧无法预览？

当前生成的是一个 **React + Vite 项目**，需要：

1. **安装依赖**
2. **启动开发服务器**
3. **系统自动检测并代理**

### 正确的使用流程

#### 步骤 1: 确保终端可用

刷新浏览器后，点击底部的 "Terminal" 标签，应该能看到 shell 提示符（如 `$` 或 `%`）。

#### 步骤 2: 进入项目目录

```bash
cd my-react-counter
```

#### 步骤 3: 安装依赖

```bash
npm install
```

这可能需要 1-2 分钟。

#### 步骤 4: 启动开发服务器

```bash
npm run dev
```

#### 步骤 5: 等待自动检测

当你看到类似这样的输出：

```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

系统会自动：
1. 检测到 Vite 服务器
2. 在终端显示：`✓ Detected Vite dev server on port 5173`
3. 预览面板显示绿色标签：`Vite • Port 5173`
4. 右侧自动加载应用！

## 🐛 常见问题

### Q1: 终端一直显示错误

**A:** 完全刷新浏览器（Cmd+Shift+R）

### Q2: 刷新后终端是空白的

**A:** 等待 2-3 秒，终端会自动连接并显示提示符

### Q3: 预览一直显示 "No Preview Available"

**A:** 这是正常的！你需要：
1. 在终端中进入项目目录
2. 运行 `npm install`
3. 运行 `npm run dev`
4. 等待系统自动检测

### Q4: npm install 很慢

**A:** 这是正常的，第一次安装依赖需要下载很多包。耐心等待。

### Q5: 端口被占用

**A:** 如果看到 "port already in use"，可以：
```bash
# 使用不同的端口
npm run dev -- --port 5174
```

## 🎯 完整示例

假设你已经生成了一个 React 项目 `my-react-counter`：

```bash
# 1. 刷新浏览器 (Cmd+Shift+R)

# 2. 在终端中执行：
cd my-react-counter
npm install
npm run dev

# 3. 等待输出：
#    ✓ Detected Vite dev server on port 5173
#    Preview will update automatically

# 4. 右侧预览自动显示应用！
```

## 📊 系统架构

```
浏览器
  ↓
[终端组件] ←→ WebSocket ←→ [服务器]
                              ↓
                         [node-pty]
                              ↓
                          真实 Shell
                              ↓
                        执行命令
                              ↓
                      启动 Vite/React
                              ↓
                    [开发服务器检测]
                              ↓
                       [HTTP 代理]
                              ↓
                      [预览面板]
```

## ✅ 验证清单

- [ ] 服务器正在运行 (`ps aux | grep "node server.js"`)
- [ ] 浏览器已完全刷新 (Cmd+Shift+R)
- [ ] 终端显示 shell 提示符
- [ ] 可以在终端中输入命令
- [ ] 项目依赖已安装 (`npm install`)
- [ ] 开发服务器已启动 (`npm run dev`)
- [ ] 系统检测到服务器（终端显示绿色消息）
- [ ] 预览面板显示框架标签
- [ ] 右侧显示应用

## 🚀 快速命令

```bash
# 一键重启服务器
cd ~/Desktop/project/AiToDo/qwen-code-examples/qwen-bolt-demo && \
pkill -f "node server.js" && \
sleep 2 && \
npm run dev &

# 然后刷新浏览器！
```

---

**记住：刷新浏览器是解决大多数问题的第一步！** 🔄
