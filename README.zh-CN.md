# Skill Studio

<p>
  简体中文 | <a href="README.md">English</a>
</p>

<p>
  <a href="https://github.com/AlienHub/skill-studio/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue.svg"></a>
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.0-111827.svg">
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-v2-24C8DB.svg">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6.svg">
  <img alt="Bun" src="https://img.shields.io/badge/Bun-ready-000000.svg">
  <img alt="Status" src="https://img.shields.io/badge/status-initial%20release-7C3AED.svg">
</p>

Skill Studio 是一个独立的 Tauri v2 桌面应用，用来浏览、对比和管理本机 Agent Skills。它会扫描常见 Agent 的 skill 目录，合并重复或软链接来源，并用精致的来源图标展示每个 skill 来自哪个 Agent 应用。

## 目录

- [特性](#特性)
- [快速开始](#快速开始)
- [验证](#验证)
- [打包](#打包)
- [Skill 目录扫描](#skill-目录扫描)
- [配置文件](#配置文件)
- [图标与标题栏](#图标与标题栏)
- [项目结构](#项目结构)
- [贡献](#贡献)
- [许可证](#许可证)

## 特性

- 本地浏览 `SKILL.md`，适合作为 Agent skill 的桌面索引与检查器。
- 仅在检测到对应 app 或 CLI 已安装时扫描内置 Agent skill 目录，同时保留用户手动配置的目录。
- 多来源 skill 自动聚合：默认按来源数量从多到少排序，数量相同按 skill 名称排序。
- 区分真实文件、软链接入口和内容一致的变体，方便判断 skill 的实际来源。
- 来源表格和元数据表格使用统一 12px 字体、白色背景和细边框。
- 基于 `@lobehub/icons` 展示 Agent 来源图标，未知来源使用闪电 fallback。
- 支持为来源目录上传自定义 `.png` / `.svg` 图标，并持久化保存。
- 多来源 skill 使用弹层式来源选择器，避免横向 tab 在来源过多时挤占页面。
- macOS app 使用 Tauri 原生透明标题栏，隐藏重复标题，并配置自定义 app logo。

## 快速开始

安装依赖：

```bash
bun install
```

启动 Tauri 桌面应用：

```bash
bun run tauri:dev
```

只启动 Vite 浏览器版本：

```bash
bun run dev
```

浏览器地址：

```text
http://127.0.0.1:5176
```

## 验证

```bash
bun run typecheck
bun run build
cd src-tauri && cargo check
```

生产预览使用 `5177` 端口：

```bash
bun run preview
```

## 打包

构建 DMG：

```bash
bun run dmg
```

生成的 `.app` 位置：

```text
src-tauri/target/release/bundle/macos/Skill Studio.app
```

在 macOS 26 上，Tauri 内置 DMG wrapper 可能会在最后的 `create-dmg` 阶段失败。如果发生这种情况，可以手动把已生成的 `.app` 打成 DMG：

```bash
mkdir -p /tmp/skill-studio-dmg
cp -R "src-tauri/target/release/bundle/macos/Skill Studio.app" /tmp/skill-studio-dmg/
ln -s /Applications /tmp/skill-studio-dmg/Applications
hdiutil create -volname "Skill Studio" -srcfolder /tmp/skill-studio-dmg -ov -format UDZO \
  "src-tauri/target/release/bundle/dmg/Skill Studio_0.1.0_aarch64.dmg"
```

## Skill 目录扫描

Skill Studio 的用户配置文件位于：

```text
~/.agents/skill-manager.json
```

目录读取策略：

- 用户配置目录始终会经过规范化和去重，目录存在时参与扫描。
- 内置候选目录会在设置页中区分为已安装 Agent 与不可用 Agent。
- 内置目录只有在检测到对应 app 或 CLI 已安装，并且 skill 目录存在时才参与扫描。
- 不可用 Agent 即使留下了内置目录，也不会计入 skill 统计。

当前内置候选目录：

```text
~/.agents/skills
~/.codex/skills
~/.claude/skills
~/.cursor/skills
~/.config/opencode/skills
~/.gemini/antigravity/skills
~/.config/agents/skills
~/.kilocode/skills
~/.roo/skills
~/.config/goose/skills
~/.gemini/skills
~/.copilot/skills
~/.openclaw/skills
~/.factory/skills
~/.codeium/windsurf/skills
~/.trae/skills
~/.deepagents/agent/skills
~/.firebender/skills
~/.augment/skills
~/.bob/skills
~/.codebuddy/skills
~/.commandcode/skills
~/.snowflake/cortex/skills
~/.config/crush/skills
~/.iflow/skills
~/.junie/skills
~/.kiro/skills
~/.kode/skills
~/.mcpjam/skills
~/.vibe/skills
~/.mux/skills
~/.neovate/skills
~/.openhands/skills
~/.pi/agent/skills
~/.pochi/skills
~/.qoder/skills
~/.qwen/skills
~/.trae-cn/skills
~/.zencoder/skills
~/.adal/skills
~/.hermes/skills
```

## 配置文件

示例 `~/.agents/skill-manager.json`：

```json
{
  "skillDirectories": [
    "/Users/you/.agents/skills",
    "/Users/you/.codex/skills"
  ],
  "sourceIcons": {
    "/Users/you/.agents/skills": {
      "type": "dataUrl",
      "value": "data:image/svg+xml;base64,..."
    }
  }
}
```

字段说明：

- `skillDirectories`：用户手动配置的 skill 根目录。
- `sourceIcons`：来源目录到自定义图标的映射，key 为规范化后的来源目录。
- 自定义图标优先级高于内置 `@lobehub/icons` 映射。

## 图标与标题栏

浏览器 favicon 源文件：

```text
public/app-icon.svg
```

Tauri bundle 图标目录：

```text
src-tauri/icons
```

从 SVG 或 PNG 重新生成 bundle 图标：

```bash
bun tauri icon /path/to/icon.svg --output src-tauri/icons
```

macOS 窗口使用原生透明标题栏：

```json
{
  "titleBarStyle": "Transparent",
  "hiddenTitle": true,
  "backgroundColor": "#fafafa"
}
```

这样可以保留 macOS 原生红黄绿按钮，同时避免前端重复绘制标题栏。

## 项目结构

```text
index.html                  浏览器 shell 与 favicon 引用
public/app-icon.svg         浏览器 favicon 源文件
src/pages/SkillManagerPage.tsx
                            主 React 页面
src/vite-env.d.ts           virtual module 类型定义
vite.config.ts              Vite 插件、dev/preview API、本地扫描器
src-tauri/src/lib.rs        Tauri commands 与生产扫描器
src-tauri/tauri.conf.json   Tauri 窗口与 bundle 配置
src-tauri/icons             生成后的 app 图标资源
```

## 贡献

欢迎通过 Issue 或 Pull Request 讨论下面这些方向：

- 增加新的 Agent skill 目录候选项。
- 为更多 Agent 来源补充 `@lobehub/icons` 映射。
- 增加“永久忽略内置目录”配置。
- 优化大规模 skill 集合下的搜索、排序和性能。
- 增加更多平台的打包验证。

提交前建议运行：

```bash
bun run typecheck
bun run build
cd src-tauri && cargo check
```

## 许可证

本项目基于 [Apache-2.0](LICENSE) 许可证开源。

## 备注

- dev 和 preview 模式通过 `/__skill_manager__` 暴露本地扫描 API。
- 生产模式使用 Tauri commands 完成扫描、保存目录和保存来源图标。
- 当前初版会把 skill 内容注入 virtual state module，并引入多个 icon 组件，因此构建时出现 large chunk warning 是预期现象。
