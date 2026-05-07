import { invoke } from '@tauri-apps/api/core'
import { appVersion, skillManagerApiBase } from 'virtual:skill-manager-state'
import { type DirectoryOpenTarget, type SkillManagerState, type SourceIcon, type UpdateCheckState } from './types'

export type OpenDirectoryTarget = DirectoryOpenTarget['id']

const GITHUB_LATEST_RELEASE_URL = 'https://api.github.com/repos/AlienHub/skill-studio/releases/latest'

type GitHubReleaseAsset = {
  name?: unknown
  browser_download_url?: unknown
}

type GitHubRelease = {
  tag_name?: unknown
  name?: unknown
  html_url?: unknown
  body?: unknown
  assets?: unknown
}

function normalizeVersion(version: string) {
  return version.trim().replace(/^v/i, '')
}

function versionSegments(version: string) {
  const numericParts = normalizeVersion(version).match(/\d+/g)
  return numericParts ? numericParts.slice(0, 4).map((part) => Number.parseInt(part, 10)) : [0]
}

function compareVersions(leftVersion: string, rightVersion: string) {
  const leftSegments = versionSegments(leftVersion)
  const rightSegments = versionSegments(rightVersion)
  const segmentCount = Math.max(leftSegments.length, rightSegments.length)

  for (let index = 0; index < segmentCount; index += 1) {
    const leftValue = leftSegments[index] ?? 0
    const rightValue = rightSegments[index] ?? 0

    if (leftValue > rightValue) {
      return 1
    }

    if (leftValue < rightValue) {
      return -1
    }
  }

  return 0
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function releaseAssets(value: unknown) {
  return Array.isArray(value) ? (value as GitHubReleaseAsset[]) : []
}

function preferredReleaseAsset(assets: GitHubReleaseAsset[]) {
  const supportedAssets = assets
    .map((asset) => ({
      name: stringValue(asset.name),
      url: stringValue(asset.browser_download_url),
    }))
    .filter((asset): asset is { name: string; url: string } => Boolean(asset.name && asset.url))

  return supportedAssets.find((asset) => asset.name.toLowerCase().endsWith('.dmg')) ?? supportedAssets[0] ?? null
}

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

export async function openExternalUrl(url: string) {
  if ('__TAURI_INTERNALS__' in window) {
    await invoke('open_external_url', { url })
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function installUpdateAndRelaunch() {
  if (!('__TAURI_INTERNALS__' in window)) {
    throw new Error('Automatic updates are only available in the desktop app')
  }

  const [{ check: checkUpdater }, { relaunch }] = await Promise.all([
    import('@tauri-apps/plugin-updater'),
    import('@tauri-apps/plugin-process'),
  ])
  const update = await checkUpdater()

  if (!update) {
    throw new Error('No signed updater package is available')
  }

  await update.downloadAndInstall()
  await relaunch()
}

export async function checkForUpdates(): Promise<UpdateCheckState> {
  const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to check GitHub releases')
  }

  const release = (await response.json()) as GitHubRelease
  const latestTag = stringValue(release.tag_name)
  const latestVersion = latestTag ? normalizeVersion(latestTag) : null
  const asset = preferredReleaseAsset(releaseAssets(release.assets))

  return {
    currentVersion: appVersion,
    latestVersion,
    latestTag,
    releaseName: stringValue(release.name),
    releaseUrl: stringValue(release.html_url),
    releaseNotes: stringValue(release.body) ?? '',
    assetName: asset?.name ?? null,
    assetUrl: asset?.url ?? null,
    hasUpdate: latestVersion ? compareVersions(latestVersion, appVersion) > 0 : false,
    checkedAt: new Date().toISOString(),
  }
}
