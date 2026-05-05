use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
};

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
    metadata: Map<String, Value>,
}

#[derive(Debug, Serialize)]
struct SkillManagerState {
    #[serde(rename = "configuredDirectories")]
    configured_directories: Vec<String>,
    #[serde(rename = "discoveredDirectories")]
    discovered_directories: Vec<String>,
    skills: Vec<LocalSkill>,
}

#[derive(Debug, Deserialize)]
struct SkillManagerConfig {
    #[serde(rename = "skillDirectories")]
    skill_directories: Option<Vec<String>>,
}

fn home_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

fn default_skills_directory() -> PathBuf {
    home_dir().join(".agents").join("skills")
}

fn config_path() -> PathBuf {
    home_dir().join(".agents").join("skill-manager.json")
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

fn read_configured_directories() -> Vec<String> {
    let path = config_path();
    if !path.exists() {
        return vec![default_skills_directory().to_string_lossy().to_string()];
    }

    let Ok(raw) = fs::read_to_string(path) else {
        return vec![default_skills_directory().to_string_lossy().to_string()];
    };

    let Ok(config) = serde_json::from_str::<SkillManagerConfig>(&raw) else {
        return vec![default_skills_directory().to_string_lossy().to_string()];
    };

    let normalized = normalize_configured_directories(config.skill_directories.unwrap_or_default());
    normalized
}

fn write_configured_directories(directories: Vec<String>) -> Result<(), String> {
    let path = config_path();
    let normalized = normalize_configured_directories(directories);

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let payload = serde_json::json!({ "skillDirectories": normalized });
    let content = serde_json::to_string_pretty(&payload).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())
}

fn collect_skill_files(directory: &Path, source_directory: &Path, skill_files: &mut Vec<(PathBuf, PathBuf)>) {
    let ignored = ["cache", "logs", "scenarios", ".skills-manager"];
    let Ok(entries) = fs::read_dir(directory) else {
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
                collect_skill_files(&entry_path, source_directory, skill_files);
            }
            continue;
        }

        if file_type.is_symlink() {
            if let Ok(metadata) = fs::metadata(&entry_path) {
                if metadata.is_dir() {
                    if !ignored.contains(&entry_name.as_ref()) {
                        collect_skill_files(&entry_path, source_directory, skill_files);
                    }
                    continue;
                }
            }
        }

        if entry_name == "SKILL.md" {
            skill_files.push((entry_path, source_directory.to_path_buf()));
        }
    }
}

fn yaml_to_json(value: serde_yaml::Value) -> Value {
    match serde_json::to_value(value) {
        Ok(value) => value,
        Err(_) => Value::Null,
    }
}

fn parse_skill_file(path: &Path) -> Option<(Map<String, Value>, String)> {
    let source = fs::read_to_string(path).ok()?;
    let trimmed = source.strip_prefix("---\n").or_else(|| source.strip_prefix("---\r\n"))?;
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

    Some((metadata, content.trim().to_string()))
}

fn value_string(metadata: &Map<String, Value>, key: &str) -> Option<String> {
    metadata.get(key)?.as_str().map(|value| value.trim().to_string())
}

#[tauri::command]
fn load_skill_manager_state() -> SkillManagerState {
    let configured_directories = read_configured_directories();
    let mut skill_files = Vec::new();

    for configured_directory in &configured_directories {
        let path = PathBuf::from(configured_directory);
        if path.is_dir() {
            collect_skill_files(&path, &path, &mut skill_files);
        }
    }

    let mut seen_skill_directories = HashSet::new();
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

        let skill_directory_string = resolved_skill_directory.to_string_lossy().to_string();
        if !seen_skill_directories.insert(skill_directory_string.clone()) {
            continue;
        }

        let source_directory_string = resolved_source_directory.to_string_lossy().to_string();
        discovered_directories.insert(source_directory_string.clone());

        let Some((metadata, content)) = parse_skill_file(&skill_file) else {
            continue;
        };

        let location = resolved_skill_directory
            .strip_prefix(&resolved_source_directory)
            .ok()
            .and_then(|path| {
                let value = path.to_string_lossy().trim_start_matches('/').to_string();
                if value.is_empty() { None } else { Some(value) }
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
            metadata,
        });
    }

    skills.sort_by(|left, right| left.name.cmp(&right.name));

    let mut discovered_directories = discovered_directories.into_iter().collect::<Vec<_>>();
    discovered_directories.sort();

    SkillManagerState {
        configured_directories,
        discovered_directories,
        skills,
    }
}

#[tauri::command]
fn save_configured_directories(directories: Vec<String>) -> Result<SkillManagerState, String> {
    write_configured_directories(directories)?;
    Ok(load_skill_manager_state())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            load_skill_manager_state,
            save_configured_directories,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Skill Studio")
}
