---
name: oss-styles
description: |
  为开源项目生成专业宣传视频，传入 {owner}/{repo} 参数
  Triggers on "生成开源视频", "宣传视频", "oss video", "remotion video".
metadata:
  version: 1.0.0
---

# OSS Styles Skill

自动克隆 oss-video-skill 项目并触发其中的 SKILL.md 执行流程，为开源项目生成专业宣传视频。

## Goal

根据用户提供的 GitHub 仓库，生成带有统计数据动画的专业宣传视频。

## Workflow

### Step 1: 克隆项目
**输入**: 用户意图
**输出**: 项目代码
**完成条件**: `{WORKSPACE_DIR}/oss-video-skill` 目录存在且包含 `.qoder/skills/oss-video/SKILL.md`
**是否阻塞**: 否

```bash
cd {WORKSPACE_DIR}
git clone git@github.com:heimanba/oss-video-skill.git
```

### Step 2: 触发项目内的 SKILL
**输入**: 克隆完成的项目
**输出**: 加载项目内的 SKILL.md
**完成条件**: 成功读取 `{WORKSPACE_DIR}/oss-video-skill/.qoder/skills/oss-video/SKILL.md`
**是否阻塞**: 否

项目克隆完成后，触发执行 `{WORKSPACE_DIR}/oss-video-skill/.qoder/skills/oss-video/SKILL.md` 中定义的 Workflow。

### Step 3: 执行项目 SKILL 流程
**输入**: 项目内的 SKILL.md
**输出**: 按照该项目 SKILL 的定义执行后续步骤
**完成条件**: 完成项目 SKILL 中定义的所有步骤
**是否阻塞**: 根据项目 SKILL 中的定义

项目内的 SKILL 通常包含以下步骤：
1. 安装依赖
2. 配置目标仓库
3. 启动预览
4. 渲染视频

## Constraints

**MUST**:
- 必须将项目克隆到 `{WORKSPACE_DIR}/oss-video-skill`
- 克隆完成后必须触发项目内的 SKILL.md
- 按照项目内 SKILL 的定义执行后续流程

**MUST NOT**:
- 不要跳过项目内的 SKILL.md 直接执行命令
- 不要修改项目内 SKILL 的定义

## 完整流程

```bash
# 1. 克隆项目
cd {WORKSPACE_DIR}
git clone git@github.com:heimanba/oss-video-skill.git

# 2. 触发项目内的 SKILL.md 执行
# 读取并执行 {WORKSPACE_DIR}/oss-video-skill/.qoder/skills/oss-video/SKILL.md
```

## 项目说明

- **仓库地址**: https://github.com/heimanba/oss-video-skill
- **技术栈**: Remotion + React + TypeScript + Tailwind CSS
- **功能**: 自动获取 GitHub 仓库数据，生成带动画的开源项目宣传视频
- **内部 SKILL 路径**: `{WORKSPACE_DIR}/oss-video-skill/.qoder/skills/oss-video/SKILL.md`
