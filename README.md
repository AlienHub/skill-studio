# Skill Studio

<p>
  <a href="README.zh-CN.md">简体中文</a> | English
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

Skill Studio is a standalone Tauri v2 desktop app for browsing, comparing, and managing local Agent Skills. It scans common local skill directories, groups duplicate or symlinked skills, and shows each skill's source agent with a polished icon-driven UI.

## Table Of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Verification](#verification)
- [Packaging](#packaging)
- [Skill Directory Discovery](#skill-directory-discovery)
- [Configuration](#configuration)
- [Icons And Titlebar](#icons-and-titlebar)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- Browse local `SKILL.md` files in a compact desktop interface.
- Auto-discover existing built-in agent skill directories while preserving user-configured directories.
- Group the same skill across multiple sources, sorted by source count from high to low and then by skill name.
- Distinguish real files, symlink entries, and same-content variants.
- Render source and metadata tables with consistent 12px text, white backgrounds, and subtle borders.
- Show agent source icons with `@lobehub/icons`, with a lightning fallback for unknown sources.
- Override source icons with custom `.png` or `.svg` files that persist across refreshes.
- Use a popover source selector for skills with many sources, avoiding horizontal tab overflow.
- Package as a macOS app with a transparent native titlebar, hidden title text, and a custom app icon.

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
src-tauri/target/release/bundle/macos/Skill Studio.app
```

On macOS 26, Tauri's built-in DMG wrapper may fail during the final `create-dmg` step. If that happens, package the generated `.app` manually:

```bash
mkdir -p /tmp/skill-studio-dmg
cp -R "src-tauri/target/release/bundle/macos/Skill Studio.app" /tmp/skill-studio-dmg/
ln -s /Applications /tmp/skill-studio-dmg/Applications
hdiutil create -volname "Skill Studio" -srcfolder /tmp/skill-studio-dmg -ov -format UDZO \
  "src-tauri/target/release/bundle/dmg/Skill Studio_0.1.0_aarch64.dmg"
```

## Skill Directory Discovery

User configuration file:

```text
~/.agents/skill-manager.json
```

Directory resolution behavior:

- Without a config file, Skill Studio scans all existing built-in candidate directories.
- With a config file, user-configured directories are returned first, then existing missing built-in directories are appended.
- Directories are normalized, deduplicated, and checked for existence.
- The current version does not yet support permanently ignoring built-in directories. If an existing built-in directory is removed from the UI, it may be auto-added again on the next load.

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
- Supporting permanently ignored built-in directories.
- Improving search, sorting, and performance for large skill collections.
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
- The initial version injects skill content through the virtual state module and imports multiple icon components, so large chunk warnings are expected.
