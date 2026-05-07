# Skill Studio / Glade Roadmap

> 当前目标：把 v0.2 的来源管理基础打稳后，进入 v0.2.1 的主题与语言基础建设，让产品可以自然服务中英文用户，并具备完整的明暗外观。
>
> 产品方向：不做企业控制台，不做 marketplace，不做复杂账号系统。先服务个人开发者整理自己的 AI 能力库。

---

## 0. 计划 TODO

### v0.2：产品调性成型

- [x] 将主页面语义从「所有技能」调整为「技能库 / Library」
- [x] 详情页改成 **Variant-first** 信息结构
- [x] 来源区域从「按 Source 展示」调整为「按内容版本 Variant 展示」
- [x] 来源 dropdown / popover 改为按 Variant 分组
- [x] 对 20+ 来源场景做聚合展示：默认只展示版本摘要，不平铺所有来源
- [x] 在 skill 详情页添加统一操作入口：打开目录、用 IDE/编辑器打开、放入废纸篓 / 删除软链
- [x] 增加安全删除能力：只允许删除单个 Source，并优先移动到系统废纸篓
- [x] 对 symlink 删除做单独文案：只删除软链，不删除目标目录
- [x] 弱化重复的「真实文件」标签，只在软链接、异常、缺失等非默认状态时突出显示
- [x] 调整文案：减少“管理 / 警告 / 错误”，增加“来源 / 内容版本 / 保持一致”

### v0.2.0a：Variant-first reading

- [x] 左侧「所有技能」改为「技能库」
- [x] 详情页顶部突出「N 个内容版本 · M 个来源」
- [x] 来源模块按 Variant 摘要展示
- [x] 来源 dropdown / popover 按 Variant 分组
- [x] 弱化「真实文件」，只突出软链接/异常

### v0.2.0b：Source actions

- [x] 增加 Source 操作菜单：打开目录、用编辑器打开
- [x] 增加「放入废纸篓 / 删除软链」确认弹窗
- [x] 后端实现 move-to-trash
- [x] symlink 只移除链接路径，不删除目标目录
- [x] 删除后自动重新扫描并刷新详情

### v0.2.1：Dark Mode & English

- [ ] 增加黑暗模式基础：整理颜色 token，让页面、卡片、边框、弹层、菜单、代码块都从 CSS variables 派生
- [ ] 支持系统外观跟随与手动切换：浅色、深色、跟随系统，并持久化保存用户选择
- [ ] 补齐黑暗模式下的关键状态：选中、hover、accent、危险操作、modal overlay、scrollbar、Markdown preview
- [ ] 增加英文支持基础：抽离主要 UI 文案到 i18n dictionary，先支持 `zh-CN` 与 `en-US`
- [ ] 支持语言切换：中文、English、跟随系统 / 默认语言，并持久化保存用户选择
- [ ] 覆盖关键页面文案：技能库侧栏、详情页、来源切换、来源操作、设置、更新、空状态、错误提示
- [ ] 做双语与双主题验收：至少检查 4 组组合（中文浅色、中文深色、英文浅色、英文深色）

### v0.3：回访理由与轻量整理

- [ ] 增加 Since Last Visit 本地快照
- [ ] 展示上次打开后的变化：新增 skill、移除 skill、内容修改、来源变化、变体变化
- [ ] 在 Library 顶部增加轻量 Welcome / Status strip，而不是 Dashboard
- [ ] 增加轻量筛选：全部、多来源、有变体、最近变更、值得看看
- [ ] 增加 Worth a Look / Suggestions 机制
- [ ] 增加 broken symlink、内容不一致、描述缺失、SKILL.md 过长等轻量提示

### v0.4：阅读与整理体验打磨

- [ ] 为长 Markdown 详情页增加 sticky mini header
- [ ] 优化 Markdown preview 的标题、列表、代码块、frontmatter 展示
- [ ] 增加 Open in Editor / Open in IDE 配置
- [ ] 支持 Reveal SKILL.md、Copy skill path、Copy source path
- [ ] 增加 Pinned Skills / 收藏
- [ ] 增加 Recently Viewed / Recently Changed
- [ ] 对多 Variant skill 增加基础 Diff 入口

### v0.5：品牌与精致度

- [ ] 决定产品命名：继续 Skill Studio，或改为 Glade / Skill Grove / Grove
- [ ] 更新 README 首屏文案、截图、GIF
- [ ] 更新 app icon、空状态、onboarding
- [ ] 打磨 macOS 原生感：titlebar、scroll、hover、selected state、keyboard shortcuts
- [ ] 增加 Command Menu 或 Quick Switcher
- [ ] 准备第一个面向个人用户的 polished release

---

## 1. 产品定位

### 1.1 当前定位

Skill Studio 当前不是企业级 skill 管理平台，也不是 skill marketplace。更适合的定位是：

> 一个精致的本地 Agent Skills 资料库。

英文表达可以是：

> A beautiful local library for your Agent Skills.

更完整一点：

> Browse, inspect, compare, and keep your Agent Skills organized across Claude, Codex, Cursor, Gemini, and more.

中文表达：

> 整理、查看、比较你散落在 Claude、Codex、Cursor、Gemini 等工具里的 Agent Skills。

### 1.2 产品气质

三个关键词：

- **Beautiful**：不像 vibe coding demo，而是认真打磨过的个人 app
- **Local**：本地优先，无账号，不上传，不复杂
- **Calm**：安静、克制、可控，不做 noisy dashboard

### 1.3 不做什么

短期明确不做：

- 企业团队管理
- 审批流
- 账号系统
- 云同步
- Marketplace
- 公共 skill registry
- 批量 destructive 操作
- 复杂安全扫描平台
- SaaS 风格 Dashboard

---

## 2. 核心产品模型

当前最关键的产品抽象应该从：

```text
Skill
  -> Source
```

升级为：

```text
Skill
  -> Variant
    -> Source
```

### 2.1 Skill

Skill 是用户看到的主对象，比如：

```text
dws
ui-ux-pro-max
find-skills
release-skills
```

它代表一个聚合后的能力，而不是某个具体路径里的文件。

### 2.2 Variant

Variant 是内容版本。v0.2 阶段先以 `SKILL.md` 文件内容 hash 作为内容版本边界。

同名 skill 可能存在多个来源，但内容完全一致。此时它们应该属于同一个 Variant。

例如：

```text
dws
2 个内容版本 · 6 个来源

Variant A
- Agents
- Claude
- Codex
- Cursor
- Hermes

Variant B
- EagleClaw
```

用户真正关心的是：

```text
这个 skill 有几个内容版本？
这些版本分别分布在哪些 agent 里？
当前看到的是哪一版？
是否有内容不一致，值得看一眼？
```

### 2.3 Source

Source 是具体来源路径，例如：

```text
Claude  /Users/alien/.claude/skills/dws
Codex   /Users/alien/.codex/skills/dws
Cursor  /Users/alien/.cursor/skills/dws
```

Source 用于执行具体动作：

- 打开目录
- 用 IDE 打开
- 复制路径
- 移除此来源
- 查看软链接状态
- 查看文件存在性

---

## 3. 信息架构

### 3.1 主导航

建议主导航保持极简：

```text
Library
Sources
Preferences
```

中文：

```text
技能库
来源
偏好设置
```

其中当前的「设置 / 扫描目录」更像 Sources，而不是普通 Settings。

### 3.2 Library 页面

左侧列表建议从「所有技能」调整为：

```text
技能库                         243
81 个存在多个来源

[全部] [多来源] [有变体] [最近]

搜索名称、描述或路径
```

不要做大 Dashboard，不要做统计卡片墙。

Library 顶部可以有轻量 welcome/status：

```text
上次打开后，有 2 个技能发生变化。
[查看变化]
```

或者：

```text
你的技能库看起来很干净。
```

### 3.3 Skill 详情页

详情页推荐结构：

```text
Skill title
Description
Variant / Source summary

Sources
Overview
Content
```

示例：

```text
dws
管理钉钉产品能力...
2 个内容版本 · 6 个来源

来源
版本 A · 5 个来源 · 当前
Agents · Claude · Codex · Cursor · Hermes

版本 B · 1 个来源
EagleClaw

[查看来源]

概览
名称        dws
描述        管理钉钉产品能力...
CLI 版本    >=1.0.15

说明
Markdown Preview
```

---

## 4. 来源与变体设计

### 4.1 为什么不能横向展示所有来源

有些 skill 会出现 20+ 来源。如果直接横向展示 source chip，会导致界面拥挤、难读、失控。

所以正确策略是：

> 横向展示内容版本摘要，不横向展示所有来源。

完整来源列表仍然通过 dropdown / popover / drawer 展示。

### 4.2 来源模块推荐状态

#### 单版本，多来源

```text
来源
24 个来源 · 内容一致
这个 skill 在多个 Agent 中保持同步。

当前来源：Claude
[查看来源]
```

#### 多版本，多来源

```text
来源
3 个内容版本 · 24 个来源
有几个来源的内容不一致，值得看一眼。

版本 A · 18 个来源 · 当前
版本 B · 5 个来源
版本 C · 1 个来源

[查看来源]
```

### 4.3 Dropdown / Popover 分组

来源 dropdown 不再平铺，而是按 Variant 分组：

```text
搜索 Agent 或路径

版本 A · 18 个来源 · 当前内容
  Agents        当前
  Claude
  Codex
  Cursor
  Hermes
  显示全部 18 个

版本 B · 5 个来源
  EagleClaw
  OpenClaw

版本 C · 1 个来源
  Custom
```

这样即使来源很多，用户也先理解版本分布，再进入具体路径。

### 4.4 展示规则

建议规则：

```text
1-5 个来源：可以展示 source chips
6-12 个来源：展示前几个 + “+N”
12+ 个来源：只展示 Variant 摘要，来源列表放入 popover
```

更重要的是：

```text
来源数量越多，越要抽象。
内容版本数量越多，越要提示用户值得看一眼。
```

---

## 5. 删除设计

### 5.1 是否要做删除

要做，但不要做成粗暴的「删除 Skill」。

正确语义是：

> 移除此来源 / Move this source to Trash

因为当前产品模型是：

```text
Skill
  -> Variant
    -> Source
```

所以直接说「删除 skill」会有歧义：

- 是删除当前来源？
- 是删除当前 Variant 的所有来源？
- 是删除所有 agent 里的同名 skill？
- 是隐藏扫描结果？
- 是删除软链接，还是删除软链接指向的真实目录？

### 5.2 v0.2 删除范围

第一版只做最安全的删除：

- 只删除当前选中的 Source
- 只移动到系统废纸篓
- 不做永久删除
- 不做批量删除
- 不做删除整个 Skill group
- 不做删除整个 Variant
- 删除后自动重新扫描

### 5.3 操作入口

不要在左侧聚合 skill 列表上直接放删除。

推荐放在详情页当前 Source 操作菜单里：

```text
[打开目录] [...]

更多菜单：
- 用编辑器打开
- 在文件管理器中显示
- 复制路径
- 移除此来源...
```

也可以放在来源 popover 的每一行：

```text
Claude
/Users/alien/.claude/skills/dws
[打开] [...]

更多：
- 用编辑器打开
- 复制路径
- 移除此来源...
```

### 5.4 普通真实目录确认文案

```text
将这个来源移到废纸篓？

dws
Claude
/Users/alien/.claude/skills/dws

只会移除 Claude 中的这个来源。
其他 5 个来源不会受影响。
```

按钮：

```text
取消
移到废纸篓
```

### 5.5 Symlink 确认文案

```text
移除这个软链接？

这只会移除 Cursor 中的软链接：
/Users/alien/.cursor/skills/dws

不会删除它指向的真实目录：
/Users/alien/.agents/skills/dws
```

按钮：

```text
取消
移除软链接
```

### 5.6 被其他软链接引用时

如果当前真实目录被其他 source 的 symlink 指向，删除时需要提醒：

```text
这个目录被 3 个来源引用。

删除后，这些来源可能会失效：
- Cursor
- Codex
- Hermes
```

第一版可以选择保守策略：

```text
这个来源被其他软链接引用，请先移除相关软链接。
```

这样可以避免误删和复杂恢复逻辑。

---

## 6. 打开方式设计

Skill 详情页已经加入通过文件管理器 / IDE / 编辑器打开的能力，这个是很关键的整理闭环。

推荐统一为：

```text
Open Folder
Open in Editor
Reveal SKILL.md
Copy Path
Remove This Source
```

中文：

```text
打开目录
用编辑器打开
显示 SKILL.md
复制路径
移除此来源
```

建议主按钮只放一个：

```text
打开目录
```

其他动作放进更多菜单：

```text
...
```

保持界面干净。

---

## 7. Since Last Visit

### 7.1 目标

增加回访理由，但不做 Dashboard。

用户打开 app 时看到的是轻量状态，而不是数据面板。

示例：

```text
上次打开后，有 2 个技能发生变化。
```

或者：

```text
新增 3 个技能，1 个来源发生变化。
```

### 7.2 需要记录的快照字段

本地保存 scan snapshot：

```json
{
  "lastScanAt": "2026-xx-xxTxx:xx:xxZ",
  "skills": [
    {
      "name": "ui-review",
      "description": "...",
      "variants": [
        {
          "hash": "...",
          "sources": [
            {
              "agent": "Claude",
              "path": "/Users/alien/.claude/skills/ui-review",
              "isSymlink": false,
              "targetPath": null
            }
          ]
        }
      ]
    }
  ]
}
```

### 7.3 变化类型

第一版可以检测：

- 新增 skill
- 移除 skill
- 新增 source
- 移除 source
- 内容 hash 变化
- Variant 数量变化
- symlink 状态变化

展示文案：

```text
Since last visit
+ 2 个新技能
~ 1 个技能内容发生变化
- 1 个来源被移除
```

中文 UI 可以不出现英文标题，改成：

```text
上次打开后
```

---

## 8. Worth a Look / Suggestions

### 8.1 目标

提供轻量整理建议，不制造焦虑。

不使用：

```text
Errors
Warnings
Alerts
Problems
```

使用：

```text
Worth a look
Suggestions
值得看看
建议
```

### 8.2 第一批规则

可以先做非常轻的规则：

- 有多个 Variant
- 某个 source 是 broken symlink
- 同名 skill 内容不一致
- 缺少 description
- description 过于泛化
- SKILL.md 过长
- 引用了不存在的 supporting file
- 包含 shell 脚本或明显危险命令
- 来源路径来自自定义目录，且没有 provenance metadata

### 8.3 文案示例

```text
dws 有 2 个内容版本，值得看一眼。
```

```text
ui-review 在 Claude 和 Codex 中内容不一致。
```

```text
deploy-helper 包含 shell 命令，编辑前建议确认来源。
```

```text
pdf skill 的说明较长，可以考虑拆分 supporting files。
```

---

## 9. UI / UX 调性

### 9.1 首页不是 Dashboard

不要做：

- 统计卡片墙
- 环形图
- 趋势图
- 告警墙
- 复杂运营指标

要做：

- Library 默认页
- 顶部轻量 welcome/status
- 清爽列表
- 明确的当前 skill 详情
- 温和的建议

### 9.2 文案风格

避免：

```text
管理
控制
警告
错误
冲突
危险
```

优先：

```text
整理
来源
内容版本
保持一致
值得看看
最近变化
移除此来源
```

### 9.3 Badge 规则

当前每行都有紫色来源 badge，容易有点噪。建议：

- 单来源不显示 badge，或显示极弱灰色
- 多来源显示弱提示
- 多 Variant 才使用更明显的紫色
- 当前选中项可强化 badge

### 9.4 「真实文件」标签

「真实文件」是默认状态，不需要每行都突出。

建议只突出非默认状态：

- 软链接
- 断开的软链接
- 缺失
- 不可读
- 自定义来源

默认真实文件可以不显示，或者在详情 tooltip 中显示。

---

## 10. 阅读体验

### 10.1 Markdown Preview

当前 Markdown preview 是产品的重要体验之一，应该继续打磨。

建议增强：

- 标题层级
- 列表间距
- code block 样式
- frontmatter 可折叠展示
- supporting files 列表
- 长文阅读宽度控制

### 10.2 Sticky Mini Header

当用户滚动长 SKILL.md 时，右侧顶部应该保留轻量上下文：

```text
ui-ux-pro-max · 5 个来源 · 当前：Claude
```

或者：

```text
ui-ux-pro-max · 2 个内容版本
```

这样用户不会在长文阅读中丢失当前 skill 信息。

---

## 11. 命名方向

当前名字 Skill Studio 可以继续使用，但从产品气质看略偏 builder / 平台。

可选方向：

### 11.1 Skill Grove

```text
Skill Grove
A beautiful local library for your Agent Skills.
```

优点：

- 看得出和 skill 有关
- 有个人 skill garden 的感觉
- 比 Studio 更安静

### 11.2 Glade

```text
Glade
A calm local library for your Agent Skills.
```

优点：

- 更像精致独立 app
- 更轻、更安静
- 品牌感强

缺点：

- 单独看不够直观，需要 subtitle 解释

### 11.3 Grove

```text
Grove
A local home for your Agent Skills.
```

优点：

- 品牌感强
- 可以从 Skill Grove 逐步演化而来

缺点：

- 单独看解释成本较高

### 11.4 推荐排序

如果优先可理解性：

```text
Skill Grove > Glade > Grove
```

如果优先品牌感：

```text
Glade > Grove > Skill Grove
```

---

## 12. README 首屏建议

如果继续叫 Skill Studio：

```markdown
# Skill Studio

A beautiful local library for your Agent Skills.

Browse, inspect, compare, and keep your skills organized across Claude, Codex, Cursor, Gemini, and more.
```

如果改名为 Glade：

```markdown
# Glade

A calm local library for your Agent Skills.

Browse your local skills, understand their variants, and keep your AI workflow clean across Claude, Codex, Cursor, Gemini, and more.
```

中文：

```markdown
# Glade

一个安静的本地 Agent Skills 资料库。

整理、查看、比较你散落在 Claude、Codex、Cursor、Gemini 等工具里的 Agent Skills。
```

---

## 13. 开发原则

### 13.1 小步快跑

这是个人项目，不追求一次性做全。

优先顺序：

```text
Detect -> Explain -> Suggest -> Safe Action -> Reversible Action
```

不要一开始做大量自动修改。

### 13.2 所有 destructive 操作必须可恢复

第一阶段所有删除都应该进入系统废纸篓。

需要避免：

```text
rm -rf
批量删除
删除聚合 skill
删除所有来源
```

### 13.3 先做好阅读和理解，再做编辑和同步

用户先要能理解：

```text
这个 skill 是什么？
有哪些版本？
来自哪里？
当前看到哪一版？
```

然后才需要：

```text
编辑
删除
同步
合并
```

---

## 14. 下一步最小执行清单

v0.2.0 已完成，下一步建议收敛在 v0.2.1：

- [ ] 先整理主题 token，避免黑暗模式靠逐个 class 硬改
- [ ] 增加 Theme 设置：浅色、深色、跟随系统
- [ ] 抽出第一版 i18n dictionary，覆盖当前主要界面文案
- [ ] 增加 Language 设置：中文、English、默认语言
- [ ] 用 4 组组合做视觉验收：中文浅色、中文深色、英文浅色、英文深色

完成 v0.2.1 后，Skill Studio 会从「中文单主题的本地工具」升级为「可长期打磨的双语、双主题桌面应用」。

---

## 15. 一句话目标

v0.2.1 的核心目标：

> 让用户可以用自己舒服的语言和外观打开 Skill Studio：白天清爽，夜里不刺眼，中文和英文都像原生写出来的产品。

长期目标：

> 让个人开发者愿意反复打开它，整理自己的 AI 能力库，并获得一种“干净、安静、可控”的感觉。
