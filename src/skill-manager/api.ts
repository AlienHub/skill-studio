import { invoke } from '@tauri-apps/api/core'
import { skillManagerApiBase } from 'virtual:skill-manager-state'
import { type DirectoryOpenTarget, type SkillManagerState, type SourceIcon } from './types'

export type OpenDirectoryTarget = DirectoryOpenTarget['id']

export async function fetchSkillManagerState() {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('load_skill_manager_state')
  }

  const response = await fetch(`${skillManagerApiBase}/state`)
  if (!response.ok) {
    throw new Error('Failed to load skill manager state')
  }

  return (await response.json()) as SkillManagerState
}

export async function saveConfiguredDirectories(directories: string[]) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('save_configured_directories', { directories })
  }

  const response = await fetch(`${skillManagerApiBase}/directories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directories }),
  })

  if (!response.ok) {
    throw new Error('Failed to update configured directories')
  }

  return (await response.json()) as SkillManagerState
}

export async function saveSourceIcon(directory: string, icon: SourceIcon | null) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('save_source_icon', { directory, icon })
  }

  const response = await fetch(`${skillManagerApiBase}/source-icon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directory, icon }),
  })

  if (!response.ok) {
    throw new Error('Failed to update source icon')
  }

  return (await response.json()) as SkillManagerState
}

export async function openSkillDirectory(directory: string, target: OpenDirectoryTarget) {
  if ('__TAURI_INTERNALS__' in window) {
    await invoke('open_skill_directory', { directory, target })
    return
  }

  const response = await fetch(`${skillManagerApiBase}/open-directory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directory, target }),
  })

  if (!response.ok) {
    throw new Error('Failed to open directory')
  }
}
