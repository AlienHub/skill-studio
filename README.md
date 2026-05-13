# Skill Grove

![Skill Grove hero](docs/assets/readme-hero.svg)

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

Skill Grove is a calm, local-first workspace for understanding and tending your Agent Skills.

Agent Skills are becoming a new kind of software artifact. They are not just prompts, not just workflows, and not just tool wrappers. A skill is a context package that tells an agent when to activate, what to read, what constraints to follow, and how to avoid known failure patterns.

Skill Grove exists to help people inspect, compare, and maintain these skills as long-lived Agent capabilities instead of scattered local files.

> Prompt is a one-time instruction.  
> Skill is a maintainable Agent capability asset.

Most skill libraries do not fail because they are too small. They fail because they become invisible. Skills get copied between Claude, Codex, Cursor, Gemini, and custom agents. Descriptions drift. Variants multiply. Old symlinks survive long after the intent is gone. After a while, you no longer know which version is real, which version is loaded, or why an agent behaves differently.

Skill Grove exists to make that mess legible again.

## Why Skill Governance

As agents become more capable, people will accumulate more local and shared skills across Claude, Codex, Cursor, OpenCode, Goose, Kiro, Qwen, Trae, and many other runtimes. The challenge is no longer only "where are my skills?" The deeper questions are:

- Which skills exist across my local agent environments?
- Which skills are duplicated, symlinked, stale, or inconsistent?
- Which skill descriptions are too broad and may cause routing mistakes?
- Which skills carry too much context cost for too little value?
- Which references, scripts, and assets are actually part of a reusable capability?
- How do we turn repeated agent failures into gotchas, examples, and eval cases?

Skill Grove starts from local visibility because governance starts with inventory. Before a skill can be evaluated, optimized, or trusted, it must first be discoverable, readable, comparable, and explainable.

## Why Open Skill Grove

Open Skill Grove when you want to answer questions like these:

- What skills do I actually have across all my agents?
- Which skills are duplicated, drifting, or split into multiple variants?
- Which source is the canonical one I should keep editing?
- What changed since the last time I looked?
- Which skills are likely worth reviewing because they affect routing, context, or consistency?

The goal is not to help you hoard more skills. The goal is to help you keep a personal skill ecosystem understandable.

## What Skill Grove Gives You

Skill Grove treats a skill as a living context asset, not just a `SKILL.md` file.

- It gathers local skills from common agent directories into one library.
- It groups the same skill by content variant and concrete source path.
- It highlights recent changes so you have a reason to come back.
- It helps you spot places where your library has become inconsistent.
- It lets you act safely: open a source, edit it, share it, or consolidate duplicates without destructive bulk operations.

## How To Use It

The intended loop is simple:

1. Connect your local skill directories and let Skill Grove scan them.
2. Browse your library by skill, then inspect variants and sources.
3. Review what changed, what drifted, and what looks worth a closer look.
4. Decide which source should remain canonical.
5. Open, edit, share, symlink, or remove that source safely.

Skill Grove is designed for repeated, lightweight visits. It should help you re-orient quickly, not demand a full management workflow every time.

## How We See The Agent Skill Ecosystem

We do not think the skill ecosystem needs another marketplace or team admin console.

We think it needs better local understanding.

Agent Skills live in a fragmented environment:

- Different agents discover skills differently.
- The same skill often exists in several directories at once.
- A short description can change routing behavior.
- A tiny edit can create a new variant and long-term confusion.
- Most people do not have a clear mental model of what their agents can see.

Skill Grove focuses on that gap. It helps individuals inspect the real files on disk, compare them across agents, and gradually build a cleaner mental model of their own skill library.

## Product Principles

- Local-first. No account, no cloud dependency, no forced sync.
- Calm by default. No noisy dashboard, no enterprise control center posture.
- Variant-first. Content versions matter more than a flat list of paths.
- Explain hidden structure. Skills shape agent behavior, so the product should make that legible.
- Safe actions only. Prefer reversible operations and clear source-level intent.

## What Skill Grove Is Not

Skill Grove is not:

- a skill marketplace
- a public registry
- a team governance console
- a bulk destructive cleanup tool
- a full skill authoring IDE

It is a beautiful local library and working surface for your own agent skill ecosystem.

## Roadmap

The product direction now centers on user value, repeat-open behavior, and context awareness rather than feature accumulation.

See [docs/roadmap.md](docs/roadmap.md) for the current product positioning, design principles, and phased roadmap.

## Current Capabilities

- Browse local `SKILL.md` files in a focused desktop interface.
- Auto-discover built-in skill directories when the matching app or CLI is installed.
- Group the same skill across multiple sources.
- Distinguish real files, symlink entries, and same-content variants.
- See recent changes, pin important skills, and keep recently viewed skills close at hand.
- Read long Markdown skill instructions with frontmatter and improved typography.
- Open a source in your editor or IDE of choice.
- Share a source to another local agent with symlinks or export it as a ZIP.
- Converge duplicate real copies into a symlink-backed source safely.

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

## Contributing

Issues and pull requests are welcome, especially around:

- improving the library experience for large personal skill collections
- expanding agent directory detection and source metadata
- clarifying how skills differ across providers
- polishing the product language, onboarding, and first-use guidance
- exploring quality hints for routing clarity, context cost, references, gotchas, and eval seeds

Suggested checks before submitting:

```bash
bun run typecheck
bun run build
cd src-tauri && cargo check
```

## License

This project is released under the [Apache-2.0](LICENSE) license.
