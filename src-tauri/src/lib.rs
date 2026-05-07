use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::{
    collections::{HashMap, HashSet},
    fs,
    hash::{Hash, Hasher},
    path::{Path, PathBuf},
    process::Command,
};

#[derive(Clone, Debug, Deserialize, Serialize)]
struct SourceIcon {
    #[serde(rename = "type")]
    icon_type: String,
    value: String,
}

#[derive(Debug, Serialize)]
struct LocalSkill {
    id: String,
    slug: String,
    name: String,
    description: String,
    content: String,
    location: String,
    #[serde(rename = "sourceDirectory")]
    source_directory: String,
    #[serde(rename = "skillDirectory")]
    skill_directory: String,
    #[serde(rename = "resolvedSourceDirectory")]
    resolved_source_directory: String,
    #[serde(rename = "resolvedSkillDirectory")]
    resolved_skill_directory: String,
    #[serde(rename = "contentHash")]
    content_hash: String,
    #[serde(rename = "agentId")]
    agent_id: String,
    #[serde(rename = "agentName")]
    agent_name: String,
    #[serde(rename = "agentIcon")]
    agent_icon: Option<SourceIcon>,
    metadata: Map<String, Value>,
}

#[derive(Debug, Serialize)]
struct BuiltInDirectoryState {
    #[serde(rename = "agentId")]
    agent_id: String,
    #[serde(rename = "agentName")]
    agent_name: String,
    directory: String,
    installed: bool,
    #[serde(rename = "directoryExists")]
    directory_exists: bool,
    #[serde(rename = "scanEnabled")]
    scan_enabled: bool,
}

#[derive(Debug, Clone, Serialize)]
struct DirectoryOpenTarget {
    id: String,
    label: String,
    category: String,
    #[serde(rename = "appPath")]
    app_path: Option<String>,
    #[serde(rename = "bundleId")]
    bundle_id: Option<String>,
    icon: Option<SourceIcon>,
}

#[derive(Debug, Serialize)]
struct SkillManagerState {
    #[serde(rename = "configuredDirectories")]
    configured_directories: Vec<String>,
    #[serde(rename = "userConfiguredDirectories")]
    user_configured_directories: Vec<String>,
    #[serde(rename = "builtInDirectories")]
    built_in_directories: Vec<BuiltInDirectoryState>,
    #[serde(rename = "discoveredDirectories")]
    discovered_directories: Vec<String>,
    #[serde(rename = "sourceIcons")]
    source_icons: HashMap<String, SourceIcon>,
    #[serde(rename = "openDirectoryTargets")]
    open_directory_targets: Vec<DirectoryOpenTarget>,
    skills: Vec<LocalSkill>,
}

#[derive(Debug, Deserialize)]
struct SkillManagerConfig {
    #[serde(rename = "skillDirectories")]
    skill_directories: Option<Vec<String>>,
    #[serde(rename = "sourceIcons")]
    source_icons: Option<HashMap<String, SourceIcon>>,
}

struct BuiltInSkillDirectory {
    path: PathBuf,
    agent_id: &'static str,
    agent_name: &'static str,
    commands: &'static [&'static str],
    app_names: &'static [&'static str],
}

struct OpenAppCandidate {
    id: &'static str,
    label: &'static str,
    category: &'static str,
    app_name: &'static str,
}

fn home_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

fn config_path() -> PathBuf {
    home_dir().join(".agents").join("skill-manager.json")
}

fn open_app_candidates() -> Vec<OpenAppCandidate> {
    vec![
        OpenAppCandidate {
            id: "vscode",
            label: "Visual Studio Code",
            category: "ide",
            app_name: "Visual Studio Code",
        },
        OpenAppCandidate {
            id: "cursor",
            label: "Cursor",
            category: "ide",
            app_name: "Cursor",
        },
        OpenAppCandidate {
            id: "antigravity",
            label: "Antigravity",
            category: "ide",
            app_name: "Antigravity",
        },
        OpenAppCandidate {
            id: "xcode",
            label: "Xcode",
            category: "ide",
            app_name: "Xcode",
        },
        OpenAppCandidate {
            id: "typora",
            label: "Typora",
            category: "editor",
            app_name: "Typora",
        },
        OpenAppCandidate {
            id: "zed",
            label: "Zed",
            category: "editor",
            app_name: "Zed",
        },
        OpenAppCandidate {
            id: "sublime_text",
            label: "Sublime Text",
            category: "editor",
            app_name: "Sublime Text",
        },
    ]
}

fn built_in_skill_directories() -> Vec<BuiltInSkillDirectory> {
    let home = home_dir();
    vec![
        BuiltInSkillDirectory {
            path: home.join(".agents").join("skills"),
            agent_id: "agents",
            agent_name: "Agents",
            commands: &[],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".codex").join("skills"),
            agent_id: "codex",
            agent_name: "Codex",
            commands: &["codex"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".claude").join("skills"),
            agent_id: "claude",
            agent_name: "Claude",
            commands: &["claude"],
            app_names: &["Claude"],
        },
        BuiltInSkillDirectory {
            path: home.join(".cursor").join("skills"),
            agent_id: "cursor",
            agent_name: "Cursor",
            commands: &["cursor"],
            app_names: &["Cursor"],
        },
        BuiltInSkillDirectory {
            path: home.join(".config").join("opencode").join("skills"),
            agent_id: "opencode",
            agent_name: "OpenCode",
            commands: &["opencode"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".gemini").join("antigravity").join("skills"),
            agent_id: "antigravity",
            agent_name: "Antigravity",
            commands: &["antigravity"],
            app_names: &["Antigravity", "Google Antigravity"],
        },
        BuiltInSkillDirectory {
            path: home.join(".config").join("agents").join("skills"),
            agent_id: "amp",
            agent_name: "Amp",
            commands: &["amp"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".kilocode").join("skills"),
            agent_id: "kilo_code",
            agent_name: "Kilo Code",
            commands: &["kilocode", "kilo-code", "kilo"],
            app_names: &["Kilo Code"],
        },
        BuiltInSkillDirectory {
            path: home.join(".roo").join("skills"),
            agent_id: "roo_code",
            agent_name: "Roo Code",
            commands: &["roo", "roo-code"],
            app_names: &["Roo Code"],
        },
        BuiltInSkillDirectory {
            path: home.join(".config").join("goose").join("skills"),
            agent_id: "goose",
            agent_name: "Goose",
            commands: &["goose"],
            app_names: &["Goose"],
        },
        BuiltInSkillDirectory {
            path: home.join(".gemini").join("skills"),
            agent_id: "gemini",
            agent_name: "Gemini",
            commands: &["gemini"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".copilot").join("skills"),
            agent_id: "github_copilot",
            agent_name: "GitHub Copilot",
            commands: &["github-copilot"],
            app_names: &["GitHub Copilot"],
        },
        BuiltInSkillDirectory {
            path: home.join(".openclaw").join("skills"),
            agent_id: "openclaw",
            agent_name: "OpenClaw",
            commands: &["openclaw"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".factory").join("skills"),
            agent_id: "droid",
            agent_name: "Droid",
            commands: &["droid", "factory"],
            app_names: &["Factory"],
        },
        BuiltInSkillDirectory {
            path: home.join(".codeium").join("windsurf").join("skills"),
            agent_id: "windsurf",
            agent_name: "Windsurf",
            commands: &["windsurf"],
            app_names: &["Windsurf"],
        },
        BuiltInSkillDirectory {
            path: home.join(".trae").join("skills"),
            agent_id: "trae",
            agent_name: "TRAE IDE",
            commands: &["trae"],
            app_names: &["Trae", "TRAE"],
        },
        BuiltInSkillDirectory {
            path: home.join(".deepagents").join("agent").join("skills"),
            agent_id: "deepagents",
            agent_name: "Deep Agents",
            commands: &["deepagents", "deep-agent", "deep"],
            app_names: &["Deep Agents"],
        },
        BuiltInSkillDirectory {
            path: home.join(".firebender").join("skills"),
            agent_id: "firebender",
            agent_name: "Firebender",
            commands: &["firebender"],
            app_names: &["Firebender"],
        },
        BuiltInSkillDirectory {
            path: home.join(".augment").join("skills"),
            agent_id: "augment",
            agent_name: "Augment",
            commands: &["augment"],
            app_names: &["Augment"],
        },
        BuiltInSkillDirectory {
            path: home.join(".bob").join("skills"),
            agent_id: "bob",
            agent_name: "IBM Bob",
            commands: &["bob"],
            app_names: &["IBM Bob"],
        },
        BuiltInSkillDirectory {
            path: home.join(".codebuddy").join("skills"),
            agent_id: "codebuddy",
            agent_name: "CodeBuddy",
            commands: &["codebuddy"],
            app_names: &["CodeBuddy"],
        },
        BuiltInSkillDirectory {
            path: home.join(".commandcode").join("skills"),
            agent_id: "command_code",
            agent_name: "Command Code",
            commands: &["commandcode", "command-code"],
            app_names: &["Command Code"],
        },
        BuiltInSkillDirectory {
            path: home.join(".snowflake").join("cortex").join("skills"),
            agent_id: "cortex",
            agent_name: "Cortex Code",
            commands: &["cortex"],
            app_names: &["Cortex"],
        },
        BuiltInSkillDirectory {
            path: home.join(".config").join("crush").join("skills"),
            agent_id: "crush",
            agent_name: "Crush",
            commands: &["crush"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".iflow").join("skills"),
            agent_id: "iflow",
            agent_name: "iFlow CLI",
            commands: &["iflow"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".junie").join("skills"),
            agent_id: "junie",
            agent_name: "Junie",
            commands: &["junie"],
            app_names: &["Junie"],
        },
        BuiltInSkillDirectory {
            path: home.join(".kiro").join("skills"),
            agent_id: "kiro",
            agent_name: "Kiro CLI",
            commands: &["kiro"],
            app_names: &["Kiro"],
        },
        BuiltInSkillDirectory {
            path: home.join(".kode").join("skills"),
            agent_id: "kode",
            agent_name: "Kode",
            commands: &["kode"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".mcpjam").join("skills"),
            agent_id: "mcpjam",
            agent_name: "MCPJam",
            commands: &["mcpjam"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".vibe").join("skills"),
            agent_id: "mistral_vibe",
            agent_name: "Mistral Vibe",
            commands: &["vibe"],
            app_names: &["Mistral Vibe"],
        },
        BuiltInSkillDirectory {
            path: home.join(".mux").join("skills"),
            agent_id: "mux",
            agent_name: "Mux",
            commands: &["mux"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".neovate").join("skills"),
            agent_id: "neovate",
            agent_name: "Neovate",
            commands: &["neovate"],
            app_names: &["Neovate"],
        },
        BuiltInSkillDirectory {
            path: home.join(".openhands").join("skills"),
            agent_id: "openhands",
            agent_name: "OpenHands",
            commands: &["openhands"],
            app_names: &["OpenHands"],
        },
        BuiltInSkillDirectory {
            path: home.join(".pi").join("agent").join("skills"),
            agent_id: "pi",
            agent_name: "Pi",
            commands: &["pi"],
            app_names: &["Pi"],
        },
        BuiltInSkillDirectory {
            path: home.join(".pochi").join("skills"),
            agent_id: "pochi",
            agent_name: "Pochi",
            commands: &["pochi"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".qoder").join("skills"),
            agent_id: "qoder",
            agent_name: "Qoder",
            commands: &["qoder"],
            app_names: &["Qoder"],
        },
        BuiltInSkillDirectory {
            path: home.join(".qwen").join("skills"),
            agent_id: "qwen_code",
            agent_name: "Qwen Code",
            commands: &["qwen", "qwen-code"],
            app_names: &["Qwen Code"],
        },
        BuiltInSkillDirectory {
            path: home.join(".trae-cn").join("skills"),
            agent_id: "trae_cn",
            agent_name: "TRAE CN",
            commands: &["trae-cn", "trae"],
            app_names: &["Trae CN", "TRAE CN"],
        },
        BuiltInSkillDirectory {
            path: home.join(".zencoder").join("skills"),
            agent_id: "zencoder",
            agent_name: "Zencoder",
            commands: &["zencoder"],
            app_names: &["Zencoder"],
        },
        BuiltInSkillDirectory {
            path: home.join(".adal").join("skills"),
            agent_id: "adal",
            agent_name: "AdaL",
            commands: &["adal"],
            app_names: &[],
        },
        BuiltInSkillDirectory {
            path: home.join(".hermes").join("skills"),
            agent_id: "hermes",
            agent_name: "Hermes",
            commands: &["hermes"],
            app_names: &["Hermes"],
        },
    ]
}

fn expand_home_directory(input: &str) -> PathBuf {
    if input == "~" {
        return home_dir();
    }

    if let Some(rest) = input.strip_prefix("~/") {
        return home_dir().join(rest);
    }

    PathBuf::from(input)
}

fn normalize_configured_directories(directories: Vec<String>) -> Vec<String> {
    let mut seen = HashSet::new();
    let mut normalized = Vec::new();

    for directory in directories {
        let trimmed = directory.trim();
        if trimmed.is_empty() {
            continue;
        }

        let path = expand_home_directory(trimmed);
        let absolute = if path.is_absolute() {
            path
        } else {
            std::env::current_dir()
                .unwrap_or_else(|_| PathBuf::from("."))
                .join(path)
        };

        let value = absolute.to_string_lossy().to_string();
        if seen.insert(value.clone()) {
            normalized.push(value);
        }
    }

    normalized
}

fn is_built_in_directory(directory: &str) -> bool {
    built_in_skill_directories()
        .into_iter()
        .any(|built_in| built_in.path.to_string_lossy() == directory)
}

fn command_exists(command: &str) -> bool {
    let Some(paths) = std::env::var_os("PATH") else {
        return false;
    };

    std::env::split_paths(&paths).any(|path| path.join(command).is_file())
}

fn app_exists(app_name: &str) -> bool {
    let app_directory = if app_name.ends_with(".app") {
        app_name.to_string()
    } else {
        format!("{app_name}.app")
    };

    [
        PathBuf::from("/Applications").join(&app_directory),
        home_dir().join("Applications").join(&app_directory),
    ]
    .into_iter()
    .any(|path| path.is_dir())
}

fn is_built_in_agent_installed(directory: &BuiltInSkillDirectory) -> bool {
    if directory.agent_id == "agents" {
        return directory.path.is_dir();
    }

    directory
        .commands
        .iter()
        .any(|command| command_exists(command))
        || directory
            .app_names
            .iter()
            .any(|app_name| app_exists(app_name))
}

fn built_in_directory_states() -> Vec<BuiltInDirectoryState> {
    built_in_skill_directories()
        .into_iter()
        .map(|directory| {
            let directory_exists = directory.path.is_dir();
            let installed = is_built_in_agent_installed(&directory);
            BuiltInDirectoryState {
                agent_id: directory.agent_id.to_string(),
                agent_name: directory.agent_name.to_string(),
                directory: directory.path.to_string_lossy().to_string(),
                installed,
                directory_exists,
                scan_enabled: installed && directory_exists,
            }
        })
        .collect()
}

fn enabled_built_in_directories() -> Vec<String> {
    built_in_directory_states()
        .into_iter()
        .filter(|directory| directory.scan_enabled)
        .map(|directory| directory.directory)
        .collect()
}

fn read_skill_manager_config() -> SkillManagerConfig {
    let path = config_path();
    if !path.exists() {
        return SkillManagerConfig {
            skill_directories: None,
            source_icons: None,
        };
    }

    let Ok(raw) = fs::read_to_string(path) else {
        return SkillManagerConfig {
            skill_directories: None,
            source_icons: None,
        };
    };

    let Ok(config) = serde_json::from_str::<SkillManagerConfig>(&raw) else {
        return SkillManagerConfig {
            skill_directories: None,
            source_icons: None,
        };
    };

    config
}

fn read_user_configured_directories() -> Vec<String> {
    let config = read_skill_manager_config();
    normalize_configured_directories(config.skill_directories.unwrap_or_default())
        .into_iter()
        .filter(|directory| !is_built_in_directory(directory))
        .collect()
}

fn read_configured_directories() -> Vec<String> {
    let mut directories = read_user_configured_directories();
    directories.extend(enabled_built_in_directories());
    normalize_configured_directories(directories)
}

fn normalize_source_icons(
    source_icons: HashMap<String, SourceIcon>,
) -> HashMap<String, SourceIcon> {
    let mut normalized = HashMap::new();

    for (directory, icon) in source_icons {
        if icon.icon_type != "dataUrl" || icon.value.trim().is_empty() {
            continue;
        }

        let directories = normalize_configured_directories(vec![directory]);
        if let Some(normalized_directory) = directories.first() {
            normalized.insert(normalized_directory.clone(), icon);
        }
    }

    normalized
}

fn read_source_icons() -> HashMap<String, SourceIcon> {
    normalize_source_icons(read_skill_manager_config().source_icons.unwrap_or_default())
}

fn write_skill_manager_config(
    skill_directories: Vec<String>,
    source_icons: HashMap<String, SourceIcon>,
) -> Result<(), String> {
    let path = config_path();

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let payload = serde_json::json!({
        "skillDirectories": skill_directories,
        "sourceIcons": source_icons,
    });
    let content = serde_json::to_string_pretty(&payload).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())
}

fn write_configured_directories(directories: Vec<String>) -> Result<(), String> {
    let normalized = normalize_configured_directories(directories)
        .into_iter()
        .filter(|directory| !is_built_in_directory(directory))
        .collect();
    write_skill_manager_config(normalized, read_source_icons())
}

fn write_source_icon(directory: String, icon: Option<SourceIcon>) -> Result<(), String> {
    let normalized_directories = normalize_configured_directories(vec![directory]);
    let Some(normalized_directory) = normalized_directories.first() else {
        return Ok(());
    };
    let mut source_icons = read_source_icons();

    if let Some(icon) = icon {
        if icon.icon_type == "dataUrl" && !icon.value.trim().is_empty() {
            source_icons.insert(normalized_directory.clone(), icon);
        }
    } else {
        source_icons.remove(normalized_directory);
    }

    write_skill_manager_config(read_user_configured_directories(), source_icons)
}

fn run_open_command(command: &str, args: &[&str]) -> Result<(), String> {
    let status = Command::new(command)
        .args(args)
        .status()
        .map_err(|error| error.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("{command} exited with status {status}"))
    }
}

fn command_output(command: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(command).args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }

    let value = String::from_utf8(output.stdout).ok()?.trim().to_string();
    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}

fn app_path_for_name(app_name: &str) -> Option<PathBuf> {
    let app_directory = if app_name.ends_with(".app") {
        app_name.to_string()
    } else {
        format!("{app_name}.app")
    };

    [
        PathBuf::from("/Applications").join(&app_directory),
        home_dir().join("Applications").join(&app_directory),
    ]
    .into_iter()
    .find(|path| path.is_dir())
    .or_else(|| {
        let query = format!("kMDItemFSName == '{}'", app_directory.replace('\'', "\\'"));
        command_output("mdfind", &[&query])
            .and_then(|output| output.lines().map(PathBuf::from).find(|path| path.is_dir()))
    })
}

fn plist_value(plist_path: &Path, key: &str) -> Option<String> {
    command_output(
        "/usr/libexec/PlistBuddy",
        &["-c", &format!("Print :{key}"), plist_path.to_str()?],
    )
}

fn app_bundle_id(app_path: &Path) -> Option<String> {
    plist_value(
        &app_path.join("Contents").join("Info.plist"),
        "CFBundleIdentifier",
    )
}

fn app_icon_path(app_path: &Path) -> Option<PathBuf> {
    let resources_path = app_path.join("Contents").join("Resources");
    let icon_file = plist_value(
        &app_path.join("Contents").join("Info.plist"),
        "CFBundleIconFile",
    )?;
    let icon_file = if icon_file.ends_with(".icns") {
        icon_file
    } else {
        format!("{icon_file}.icns")
    };
    let icon_path = resources_path.join(icon_file);

    if icon_path.is_file() {
        Some(icon_path)
    } else {
        None
    }
}

fn stable_path_token(path: &Path) -> String {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    path.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

fn icon_data_url_from_icns(icon_path: &Path) -> Option<SourceIcon> {
    let output_path = std::env::temp_dir().join(format!(
        "skill-studio-icon-64-{}.png",
        stable_path_token(icon_path)
    ));

    if !output_path.is_file() {
        let status = Command::new("sips")
            .args([
                "-Z",
                "64",
                "-s",
                "format",
                "png",
                icon_path.to_str()?,
                "--out",
                output_path.to_str()?,
            ])
            .status()
            .ok()?;

        if !status.success() {
            return None;
        }
    }

    let data = fs::read(output_path).ok()?;
    Some(SourceIcon {
        icon_type: "dataUrl".to_string(),
        value: format!(
            "data:image/png;base64,{}",
            general_purpose::STANDARD.encode(data)
        ),
    })
}

fn app_icon_data_url(app_path: &Path) -> Option<SourceIcon> {
    icon_data_url_from_icns(&app_icon_path(app_path)?)
}

fn directory_open_targets() -> Vec<DirectoryOpenTarget> {
    let mut targets = Vec::new();
    let finder_path = PathBuf::from("/System/Library/CoreServices/Finder.app");

    targets.push(DirectoryOpenTarget {
        id: "finder".to_string(),
        label: "Finder".to_string(),
        category: "file-manager".to_string(),
        app_path: Some(finder_path.to_string_lossy().to_string()),
        bundle_id: Some("com.apple.finder".to_string()),
        icon: app_icon_data_url(&finder_path),
    });

    targets.extend(open_app_candidates().into_iter().filter_map(|candidate| {
        let app_path = app_path_for_name(candidate.app_name)?;
        Some(DirectoryOpenTarget {
            id: candidate.id.to_string(),
            label: candidate.label.to_string(),
            category: candidate.category.to_string(),
            app_path: Some(app_path.to_string_lossy().to_string()),
            bundle_id: app_bundle_id(&app_path),
            icon: app_icon_data_url(&app_path),
        })
    }));

    targets
}

fn directory_open_target_by_id(id: &str) -> Option<DirectoryOpenTarget> {
    directory_open_targets()
        .into_iter()
        .find(|target| target.id == id)
}

fn open_directory_with_target(directory: &Path, target: &str) -> Result<(), String> {
    let directory = directory
        .canonicalize()
        .map_err(|error| format!("目录不存在或无法访问：{error}"))?;

    if !directory.is_dir() {
        return Err("目标不是目录。".to_string());
    }

    let directory = directory
        .to_str()
        .ok_or_else(|| "目录路径包含不支持的字符。".to_string())?;

    let Some(target) = directory_open_target_by_id(target) else {
        return Err("不支持的打开方式。".to_string());
    };

    if target.id == "finder" {
        return {
            #[cfg(target_os = "macos")]
            {
                run_open_command("open", &[directory])
            }
            #[cfg(target_os = "windows")]
            {
                run_open_command("explorer", &[directory])
            }
            #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
            {
                run_open_command("xdg-open", &[directory])
            }
        };
    }

    if let Some(bundle_id) = target.bundle_id.as_deref() {
        #[cfg(target_os = "macos")]
        {
            return run_open_command("open", &["-b", bundle_id, directory]);
        }
    }

    if let Some(app_path) = target.app_path.as_deref() {
        #[cfg(target_os = "macos")]
        {
            return run_open_command("open", &["-a", app_path, directory]);
        }
    }

    Err("无法找到打开应用。".to_string())
}

fn get_agent_info_for_directory(directory: &Path) -> (String, String) {
    let normalized_directory = directory.to_string_lossy().to_string();
    let mut built_ins = built_in_skill_directories();
    built_ins.sort_by(|left, right| {
        right
            .path
            .to_string_lossy()
            .len()
            .cmp(&left.path.to_string_lossy().len())
    });

    for built_in in built_ins {
        let built_in_path = built_in.path.to_string_lossy().to_string();
        if normalized_directory == built_in_path
            || normalized_directory.starts_with(&format!("{}/", built_in_path))
        {
            return (
                built_in.agent_id.to_string(),
                built_in.agent_name.to_string(),
            );
        }
    }

    ("unknown".to_string(), "自定义来源".to_string())
}

fn collect_skill_files(
    directory: &Path,
    source_directory: &Path,
    skill_files: &mut Vec<(PathBuf, PathBuf)>,
    active_directories: &mut HashSet<PathBuf>,
) {
    let ignored = ["cache", "logs", "scenarios", ".skills-manager"];
    let resolved_directory = directory
        .canonicalize()
        .unwrap_or_else(|_| directory.to_path_buf());

    if !active_directories.insert(resolved_directory.clone()) {
        return;
    }

    let Ok(entries) = fs::read_dir(directory) else {
        active_directories.remove(&resolved_directory);
        return;
    };

    for entry in entries.flatten() {
        let entry_path = entry.path();
        let entry_name = entry.file_name();
        let entry_name = entry_name.to_string_lossy();

        let Ok(file_type) = entry.file_type() else {
            continue;
        };

        if file_type.is_dir() {
            if !ignored.contains(&entry_name.as_ref()) {
                collect_skill_files(
                    &entry_path,
                    source_directory,
                    skill_files,
                    active_directories,
                );
            }
            continue;
        }

        if file_type.is_symlink() {
            if let Ok(metadata) = fs::metadata(&entry_path) {
                if metadata.is_dir() {
                    if !ignored.contains(&entry_name.as_ref()) {
                        collect_skill_files(
                            &entry_path,
                            source_directory,
                            skill_files,
                            active_directories,
                        );
                    }
                    continue;
                }
            }
        }

        if entry_name == "SKILL.md" {
            skill_files.push((entry_path, source_directory.to_path_buf()));
        }
    }

    active_directories.remove(&resolved_directory);
}

fn yaml_to_json(value: serde_yaml::Value) -> Value {
    match serde_json::to_value(value) {
        Ok(value) => value,
        Err(_) => Value::Null,
    }
}

fn stable_content_hash(input: &str) -> String {
    let mut hash: u32 = 0x811c9dc5;

    for byte in input.as_bytes() {
        hash ^= *byte as u32;
        hash = hash.wrapping_mul(0x01000193);
    }

    format!("{hash:08x}")
}

fn parse_skill_file(path: &Path) -> Option<(Map<String, Value>, String, String)> {
    let source = fs::read_to_string(path).ok()?;
    let content_hash = stable_content_hash(&source);
    let trimmed = source
        .strip_prefix("---\n")
        .or_else(|| source.strip_prefix("---\r\n"))?;
    let delimiter = if let Some(index) = trimmed.find("\n---\n") {
        (index, 5)
    } else if let Some(index) = trimmed.find("\r\n---\r\n") {
        (index, 7)
    } else {
        return None;
    };

    let frontmatter = &trimmed[..delimiter.0];
    let content = &trimmed[delimiter.0 + delimiter.1..];
    let yaml = serde_yaml::from_str::<serde_yaml::Value>(frontmatter).ok()?;
    let metadata = yaml_to_json(yaml).as_object().cloned().unwrap_or_default();

    Some((metadata, content.trim().to_string(), content_hash))
}

fn value_string(metadata: &Map<String, Value>, key: &str) -> Option<String> {
    metadata
        .get(key)?
        .as_str()
        .map(|value| value.trim().to_string())
}

#[tauri::command]
fn load_skill_manager_state() -> SkillManagerState {
    let user_configured_directories = read_user_configured_directories();
    let built_in_directories = built_in_directory_states();
    let configured_directories = read_configured_directories();
    let source_icons = read_source_icons();
    let mut skill_files = Vec::new();

    for configured_directory in &configured_directories {
        let path = PathBuf::from(configured_directory);
        if path.is_dir() {
            collect_skill_files(&path, &path, &mut skill_files, &mut HashSet::new());
        }
    }

    let mut discovered_directories = HashSet::new();
    let mut skills = Vec::new();

    for (skill_file, source_directory) in skill_files {
        let Some(skill_directory) = skill_file.parent() else {
            continue;
        };

        let resolved_skill_directory = skill_directory
            .canonicalize()
            .unwrap_or_else(|_| skill_directory.to_path_buf());
        let resolved_source_directory = source_directory
            .canonicalize()
            .unwrap_or_else(|_| source_directory.clone());

        let skill_directory_string = skill_directory.to_string_lossy().to_string();
        let source_directory_string = source_directory.to_string_lossy().to_string();
        let resolved_skill_directory_string =
            resolved_skill_directory.to_string_lossy().to_string();
        let resolved_source_directory_string =
            resolved_source_directory.to_string_lossy().to_string();
        let (agent_id, agent_name) = get_agent_info_for_directory(&source_directory);
        let agent_icon = source_icons
            .get(&source_directory_string)
            .or_else(|| source_icons.get(&resolved_source_directory_string))
            .cloned();
        discovered_directories.insert(source_directory_string.clone());

        let Some((metadata, content, content_hash)) = parse_skill_file(&skill_file) else {
            continue;
        };

        let location = skill_directory
            .strip_prefix(&source_directory)
            .ok()
            .and_then(|path| {
                let value = path.to_string_lossy().trim_start_matches('/').to_string();
                if value.is_empty() {
                    None
                } else {
                    Some(value)
                }
            })
            .unwrap_or_else(|| skill_directory_string.clone());

        let name = value_string(&metadata, "name").unwrap_or_else(|| location.clone());
        let description = value_string(&metadata, "description").unwrap_or_default();

        skills.push(LocalSkill {
            id: format!("{}::{}", source_directory_string, skill_directory_string),
            slug: location.clone(),
            name,
            description,
            content,
            location,
            source_directory: source_directory_string,
            skill_directory: skill_directory_string,
            resolved_source_directory: resolved_source_directory_string,
            resolved_skill_directory: resolved_skill_directory_string,
            content_hash,
            agent_id,
            agent_name,
            agent_icon,
            metadata,
        });
    }

    skills.sort_by(|left, right| left.name.cmp(&right.name));

    let mut discovered_directories = discovered_directories.into_iter().collect::<Vec<_>>();
    discovered_directories.sort();

    SkillManagerState {
        configured_directories,
        user_configured_directories,
        built_in_directories,
        discovered_directories,
        source_icons,
        open_directory_targets: directory_open_targets(),
        skills,
    }
}

#[tauri::command]
fn save_configured_directories(directories: Vec<String>) -> Result<SkillManagerState, String> {
    write_configured_directories(directories)?;
    Ok(load_skill_manager_state())
}

#[tauri::command]
fn save_source_icon(
    directory: String,
    icon: Option<SourceIcon>,
) -> Result<SkillManagerState, String> {
    write_source_icon(directory, icon)?;
    Ok(load_skill_manager_state())
}

#[tauri::command]
fn open_skill_directory(directory: String, target: String) -> Result<(), String> {
    let normalized_directories = normalize_configured_directories(vec![directory]);
    let Some(normalized_directory) = normalized_directories.first() else {
        return Err("目录不能为空。".to_string());
    };

    open_directory_with_target(Path::new(normalized_directory), &target)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            load_skill_manager_state,
            save_configured_directories,
            save_source_icon,
            open_skill_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Skill Studio")
}
