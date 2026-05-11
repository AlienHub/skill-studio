# Skill Grove

<p>
  <a href="README.zh-CN.md">简体中文</a> | English
</p>

<p>
  <a href="https://github.com/AlienHub/skill-grove/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-blue.svg"></a>
  <img alt="Version" src="https://img.shields.io/badge/version-0.6.1-111827.svg">
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-v2-24C8DB.svg">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6.svg">
  <img alt="Bun" src="https://img.shields.io/badge/Bun-ready-000000.svg">
  <img alt="Status" src="https://img.shields.io/badge/status-initial%20release-7C3AED.svg">
</p>

**Skill Grove is an open-source local workspace for Agent Skill Governance.**

Agent Skills are becoming a new kind of software artifact. They are not just prompts, not just workflows, and not just tool wrappers. A skill is a context package that tells an agent when to activate, what to read, what constraints to follow, and how to avoid known failure patterns.

Skill Grove exists to help people design, inspect, compare, and maintain these skills as long-lived Agent capabilities instead of scattered local files. The current app is intentionally small: a local desktop workspace that makes your skill inventory visible first, then gradually evolves toward evaluation, context-cost awareness, and skill lifecycle governance.

> Prompt is a one-time instruction.  
> Skill is a maintainable Agent capability asset.

## Table Of Contents

- [Why Skill Governance](#why-skill-governance)
- [What Skill Grove Does Today](#what-skill-grove-does-today)
- [Design Principles](#design-principles)
- [Roadmap Direction](#roadmap-direction)
- [Quick Start](#quick-start)
- [Verification](#verification)
- [Packaging](#packaging)
- [Skill Directory Discovery](#skill-directory-discovery)
- [Configuration](#configuration)
- [Icons And Titlebar](#icons-and-titlebar)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Why Skill Governance

As agents become more capable, teams will accumulate more local and shared skills across Claude, Codex, Cursor, OpenCode, Goose, Kiro, Qwen, Trae, and many other runtimes. The challenge is no longer only "where are my skills?" The deeper questions are:

- Which skills exist across my local agent environments?
- Which skills are duplicated, symlinked, stale, or inconsistent?
- Which skill descriptions are too broad and may cause routing mistakes?
- Which skills carry too much context cost for too little value?
- Which references, scripts, and assets are actually part of a reusable capability?
- How do we turn repeated agent failures into gotchas, examples, and eval cases?

Skill Grove starts from local visibility because governance starts with inventory. Before a skill can be evaluated, optimized, or trusted, it must first be discoverable, readable, comparable, and explainable.

## What Skill Grove Does Today

Skill Grove is currently a standalone Tauri v2 desktop app for browsing and tending local Agent Skills. It focuses on the first layer of Skill Governance: making local skill assets visible and understandable.

Current capabilities:

- Browse local `SKILL.md` files in a compact desktop interface.
- Auto-discover built-in agent skill directories only when the matching app or CLI is installed, while preserving user-configured directories.
- Group the same skill across multiple sources, sorted by source count from high to low and then by skill name.
- Distinguish real files, symlink entries, and same-content variants.
- See recent library changes, pin important skills, and keep recently viewed skills near the top.
- Read long Markdown skill instructions with a sticky mini header, tuned typography, and visible frontmatter.
- Render source and metadata tables with consistent 12px text, white backgrounds, and subtle borders.
- Choose a default editor or IDE open target for source actions.
- Show agent source icons with `@lobehub/icons`, with a lightning fallback for unknown sources.
- Override source icons with custom `.png` or `.svg` files that persist across refreshes.
- Use a popover source selector for skills with many sources, avoiding horizontal tab overflow.
- Package as a macOS app with a transparent native titlebar, hidden title text, and a custom app icon.

## Design Principles

Skill Grove is guided by a few product ideas:

### 1. Skills are assets, not snippets

A useful skill is not only a Markdown file. It may include routing descriptions, instructions, references, scripts, examples, assets, and gotchas. Skill Grove treats a skill as a capability package that deserves inventory, review, and lifecycle management.

### 2. Every skill has a context cost

More skills do not automatically make an agent better. Every skill description adds index cost, every loaded `SKILL.md` adds context cost, and every unclear reference increases execution uncertainty. Skill Grove aims to make those costs visible over time.

### 3. Routing is part of quality

A good skill is not just well written. It should be loaded at the right time, avoided at the wrong time, and clear about what files or references should be read. Future versions will focus more on routing clarity, overlap detection, and negative examples.

### 4. Gotchas are the smallest unit of skill evolution

Agent failures should not disappear into chat history. Repeated mistakes can become gotchas, examples, evals, or patches to the skill itself. Skill Grove will explore how to turn failure memory into maintainable skill improvements.

### 5. Local-first before platform-first

Skills often live across personal workstations, IDEs, CLIs, and agent runtimes. Skill Grove starts local-first so users can understand their own skill environment before introducing heavier collaboration or platform features.

## Roadmap Direction

Skill Grove is still early. The near-term direction is to move from a skill browser toward a small but opinionated Agent Skill Governance workspace.

Planned areas:

- **Skill Quality Hints**: detect broad descriptions, missing examples, missing gotchas, unused references, and oversized instructions.
- **Context Cost Analysis**: estimate index cost, loaded-body cost, and reference footprint.
- **Routing Conflict Review**: identify overlapping skill descriptions and potential misfire risks.
- **Gotcha Capture**: help users turn real agent failures into candidate gotchas and skill patches.
- **Eval Seeds**: generate positive and negative routing cases from existing skills and user feedback.
- **Invocation Analytics**: connect skill usage traces when agent runtimes expose them.

The goal is not to build a heavy enterprise console. The goal is to make Agent Skill Engineering tangible, local, and practical.

## Quick Start

Install dependencies:

```bash
bun install
```

Run the Tauri desktop app:

```bash
bun run tauri:dev
```

Run the Vite browser app only:

```bash
bun run dev
```

Open:

```text
http://127.0.0.1:5176
```

## Verification

```bash
bun run typecheck
bun run build
cd src-tauri && cargo check
```

Production preview runs on port `5177`:

```bash
bun run preview
```

## Packaging

Build a DMG:

```bash
bun run dmg
```

Generated `.app` path:

```text
src-tauri/target/release/bundle/macos/Skill Grove.app
```

On macOS 26, Tauri's built-in DMG wrapper may fail during the final `create-dmg` step. If that happens, package the generated `.app` manually:

```bash
mkdir -p /tmp/skill-grove-dmg
cp -R "src-tauri/target/release/bundle/macos/Skill Grove.app" /tmp/skill-grove-dmg/
ln -s /Applications /tmp/skill-grove-dmg/Applications
hdiutil create -volname "Skill Grove" -srcfolder /tmp/skill-grove-dmg -ov -format UDZO \
  "src-tauri/target/release/bundle/dmg/Skill Grove_0.6.1_aarch64.dmg"
```

## Skill Directory Discovery

User configuration file:

```text
~/.agents/skill-manager.json
```

Directory resolution behavior:

- User-configured directories are always normalized, deduplicated, and scanned when they exist.
- Built-in candidate directories are shown separately in settings as installed or unavailable agents.
- A built-in directory is scanned only when the matching app or CLI is detected and the skill directory exists.
- Existing built-in directories for unavailable agents are not included in skill counts.

Current built-in candidate directories:

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

## Configuration

Example `~/.agents/skill-manager.json`:

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

Fields:

- `skillDirectories`: User-configured skill root directories.
- `sourceIcons`: Mapping from normalized source directories to custom icons.
- Custom icons take priority over built-in `@lobehub/icons` mappings.

## Icons And Titlebar

Browser favicon source:

```text
public/app-icon.svg
```

Tauri bundle icon directory:

```text
src-tauri/icons
```

Regenerate bundle icons from a square SVG or PNG:

```bash
bun tauri icon /path/to/icon.svg --output src-tauri/icons
```

The macOS window uses a transparent native titlebar:

```json
{
  "titleBarStyle": "Transparent",
  "hiddenTitle": true,
  "backgroundColor": "#fafafa"
}
```

This keeps the native macOS traffic-light controls while avoiding a duplicate frontend titlebar.

## Project Structure

```text
index.html                  Browser shell and favicon reference
public/app-icon.svg         Browser favicon source
src/pages/SkillManagerPage.tsx
                            Main React page
src/vite-env.d.ts           Virtual module types
vite.config.ts              Vite plugin, dev/preview API, local scanner
src-tauri/src/lib.rs        Tauri commands and production scanner
src-tauri/tauri.conf.json   Tauri window and bundle config
src-tauri/icons             Generated app icons
```

## Contributing

Issues and pull requests are welcome, especially around:

- Adding new agent skill directory candidates.
- Adding `@lobehub/icons` mappings for more agent sources.
- Improving skill inventory, source grouping, and local workspace ergonomics.
- Exploring quality hints for routing clarity, context cost, references, examples, gotchas, and eval seeds.
- Verifying packaging on more platforms.

Suggested checks before submitting:

```bash
bun run typecheck
bun run build
cd src-tauri && cargo check
```

## License

This project is released under the [Apache-2.0](LICENSE) license.

## Notes

- Dev and preview modes expose the local scanner through `/__skill_manager__`.
- Production uses Tauri commands for scanning, saving directories, and saving source icons.
- The current version injects skill content through the virtual state module and imports multiple icon components, so large chunk warnings are expected.
