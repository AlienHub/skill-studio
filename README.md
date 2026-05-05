# Skill Studio

Standalone Tauri v2 app for browsing local agent skills.

## Development

```bash
bun install
bun run tauri:dev
```

The Tauri window opens automatically.

## Production Preview

```bash
bun run build
bun run preview
```

Open http://127.0.0.1:5177.

## DMG Build

```bash
bun run dmg
```

The generated `.app` is written to:

```text
src-tauri/target/release/bundle/macos/Skill Studio.app
```

On macOS 26, Tauri's built-in DMG wrapper may fail during the final `create-dmg`
step. If that happens, package the generated `.app` manually:

```bash
mkdir -p /tmp/skill-studio-dmg
cp -R "src-tauri/target/release/bundle/macos/Skill Studio.app" /tmp/skill-studio-dmg/
ln -s /Applications /tmp/skill-studio-dmg/Applications
hdiutil create -volname "Skill Studio" -srcfolder /tmp/skill-studio-dmg -ov -format UDZO \
  "src-tauri/target/release/bundle/dmg/Skill Studio_0.1.0_aarch64.dmg"
```

## Skill Directories

By default, Skill Studio scans:

```text
~/.agents/skills
```

Configured directories are stored in:

```text
~/.agents/skill-manager.json
```
