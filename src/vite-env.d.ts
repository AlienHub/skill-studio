declare module 'virtual:skill-manager-state' {
  export const appVersion: string
  export const skillManagerApiBase: string
  export const initialSkillManagerState: {
    configuredDirectories: string[]
    userConfiguredDirectories: string[]
    builtInDirectories: Array<{
      agentId: string
      agentName: string
      directory: string
      installed: boolean
      directoryExists: boolean
      scanEnabled: boolean
    }>
    discoveredDirectories: string[]
    sourceIcons: Record<string, {
      type: 'dataUrl'
      value: string
    }>
    openDirectoryTargets: Array<{
      id: string
      label: string
      category: string
      appPath: string | null
      bundleId: string | null
      icon: {
        type: 'dataUrl'
        value: string
      } | null
    }>
    skills: Array<{
      id: string
      slug: string
      name: string
      description: string
      content: string
      location: string
      sourceDirectory: string
      skillDirectory: string
      resolvedSourceDirectory: string
      resolvedSkillDirectory: string
      contentHash: string
      agentId: string
      agentName: string
      agentIcon: {
        type: 'dataUrl'
        value: string
      } | null
      metadata: Record<string, unknown>
    }>
  }
}

interface Window {
  __TAURI_INTERNALS__?: unknown
}
