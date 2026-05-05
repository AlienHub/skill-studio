declare module 'virtual:skill-manager-state' {
  export const skillManagerApiBase: string
  export const initialSkillManagerState: {
    configuredDirectories: string[]
    discoveredDirectories: string[]
    skills: Array<{
      id: string
      slug: string
      name: string
      description: string
      content: string
      location: string
      sourceDirectory: string
      metadata: Record<string, unknown>
    }>
  }
}

interface Window {
  __TAURI_INTERNALS__?: unknown
}
