# 🔧 终端问题完整解决方案

## ✅ 已完成的修复

我已经将 `node-pty` 替换为 Node.js 原生的 `child_process`，因为 `node-pty` 在你的 macOS 环境下有兼容性问题（`posix_spawnp failed`）。

### 修改内容

**server.js**:
- ❌ 移除：`const pty = require('node-pty');`
- ✅ 添加：`const { spawn } = require('child_process');`
- ✅ 使用 `script` 命令创建伪终端（macOS/Linux）
- ✅ 使用 `child_process.spawn` 替代 `pty.spawn`

## 🚀 启动服务器

请在你的终端中执行以下命令：

```bash
cd ~/Desktop/project/AiToDo/qwen-code-examples/qwen-bolt-demo

# 清理旧进程
pkill -9 -f "node server.js"

# 启动服务器（前台运行，可以看到日志）
node server.js
```

你应该会看到：

```
> Ready on http://localhost:3000
> Socket.IO server running on ws://localhost:3000/api/socket/socket.io
```

**保持这个终端窗口打开**，然后：

1. 打开浏览器访问 http://localhost:3000/workspace
2. 按 `Cmd + Shift + R` 完全刷新页面
3. 点击底部的 "Terminal" 标签
4. 等待 2-3 秒

现在你应该能看到 shell 提示符（`%` 或 `$`），并且可以输入命令了！

## 🧪 测试终端

在终端中尝试输入：

```bash
echo "Hello from terminal!"
pwd
ls -la
```

如果能看到输出，说明终端已经正常工作了！

## 📝 技术细节

### 为什么 node-pty 失败？

```bash
# 测试结果
node-pty loaded successfully
Using shell: /bin/zsh
Error: posix_spawnp failed.
```

这是 `node-pty` 在某些 macOS 环境下的已知问题，可能与：
- Node.js 版本（你使用的是 v20.19.5）
- macOS 安全策略
- 编译配置

有关。

### 解决方案：使用 child_process

```javascript
// 旧代码（node-pty）
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env,
});

// 新代码（child_process + script）
const terminal = spawn('/usr/bin/script', [
  '-q',  // quiet mode
  '/dev/null',  // 不保存到文件
  process.env.SHELL || '/bin/zsh'
], {
  cwd: process.env.HOME,
  env: {
    ...process.env,
    TERM: 'xterm-256color',
  },
});
```

`script` 命令会创建一个伪终端，效果与 `node-pty` 类似。

## 🎯 下一步

终端修复后，我们可以继续实现：

1. ✅ **终端正常工作** ← 当前步骤
2. ⏭️ **项目类型检测** - 识别 React/Vue/Vite 等
3. ⏭️ **自动启动按钮** - 一键安装依赖并启动
4. ⏭️ **开发服务器代理** - 自动预览
5. ⏭️ **静态文件预览** - 纯 HTML 项目直接预览

## 🔄 如果还是不工作

如果启动服务器后，刷新浏览器，终端仍然显示错误：

1. **检查浏览器控制台**（F12）
   - 查看是否有 WebSocket 连接错误
   - 查看是否有 JavaScript 错误

2. **检查服务器日志**
   - 在运行 `node server.js` 的终端中查看输出
   - 看是否有 Socket.IO 连接日志

3. **尝试不同的浏览器**
   - Chrome
   - Firefox
   - Safari

4. **清除浏览器缓存**
   - 开发者工具 → Application → Clear storage

---

**现在请启动服务器并测试！** 🚀

如果终端能正常工作，我们就可以继续实现预览功能了！
