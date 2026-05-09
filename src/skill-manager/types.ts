import { type ReactNode } from 'react'
import { initialSkillManagerState } from 'virtual:skill-manager-state'
import { type TranslationKey } from './i18n'

export type SkillManagerState = typeof initialSkillManagerState
export type Skill = SkillManagerState['skills'][number]
export type SourceIcon = SkillManagerState['sourceIcons'][string]
export type BuiltInDirectoryState = SkillManagerState['builtInDirectories'][number]
export type DirectoryOpenTarget = SkillManagerState['openDirectoryTargets'][number]

export type UpdateCheckState = {
  currentVersion: string
  latestVersion: string | null
  latestTag: string | null
  releaseName: string | null
  releaseUrl: string | null
  releaseNotes: string
  assetName: string | null
  assetUrl: string | null
  hasUpdate: boolean
  checkedAt: string
}

export type UpdateCheckStatus = 'idle' | 'checking' | 'ready' | 'error'
export type UpdateInstallStatus = 'idle' | 'installing' | 'error'

export type AgentInfo = {
  agentId: string
  agentName: string
}

export type SkillVariant = {
  id: string
  skills: Skill[]
  primarySkill: Skill
  relationship: 'single' | 'symlink' | 'same-content'
  resolvedSkillDirectory: string
  hasRealSource: boolean
  realFileCount: number
  softLinkCount: number
}

export type SkillGroup = {
  id: string
  name: string
  description: string
  location: string
  primarySkill: Skill
  skills: Skill[]
  variants: SkillVariant[]
  sourceCount: number
  variantCount: number
}

export type DefinitionRow = {
  label: string
  value: ReactNode
}

export type LibraryFilter = 'all' | 'multi-source' | 'variants' | 'recent' | 'worth'

export type LibraryChangeType =
  | 'skill-added'
  | 'skill-removed'
  | 'content-changed'
  | 'source-added'
  | 'source-removed'
  | 'variant-count-changed'
  | 'symlink-state-changed'

export type LibraryChange = {
  type: LibraryChangeType
  skillId: string
  skillName: string
  sourcePath?: string
  agentName?: string
  previousCount?: number
  currentCount?: number
}

export type SkillSuggestionType =
  | 'multiple-variants'
  | 'missing-description'
  | 'long-instructions'
  | 'content-inconsistent'
  | 'custom-source'

export type SkillSuggestion = {
  type: SkillSuggestionType
  skillId: string
  skillName: string
  sourcePath?: string
  severity: 1 | 2 | 3
  messageKey: TranslationKey
  actionKey: TranslationKey
  params?: Record<string, string | number>
}

export type LibraryVisitState = {
  capturedAt: string | null
  previousCapturedAt: string | null
  hasPreviousSnapshot: boolean
  changes: LibraryChange[]
  changesBySkillId: Record<string, LibraryChange[]>
  suggestions: SkillSuggestion[]
  suggestionsBySkillId: Record<string, SkillSuggestion[]>
}

export type CatalogDisclosure = 'included' | 'disabled' | 'invalid' | 'unknown' | 'unsupported'
export type CatalogConfidence = 'high' | 'low'
export type ProviderCapabilityEvidence = 'official-docs' | 'observed' | 'third-party' | 'unknown'
export type ProviderSupportLevel = 'native' | 'equivalent-field' | 'unknown' | 'unsupported'

export type ProviderCapability = {
  provider: string
  supportsCatalog: boolean
  supportsDescription: boolean
  supportsWhenToUse: boolean
  supportsDisableModelInvocation: boolean
  implicitInvocationField: string | null
  supportsUserInvocable: boolean
  supportsPaths: boolean
  supportLevel: ProviderSupportLevel
  evidence: ProviderCapabilityEvidence
}

export type AgentCatalogSkill = {
  id: string
  name: string
  sourcePath: string
  catalogDisclosure: CatalogDisclosure
  modelInvocation: 'enabled' | 'disabled' | 'unknown'
  userInvocation: 'enabled' | 'disabled' | 'unknown'
  residentCatalogTokens: number
  includedInEstimate: boolean
  sourceField: string | null
  filteredReason: string | null
  confidence: CatalogConfidence
}

export type AgentCatalogProfile = {
  agentId: string
  agentIcon: SourceIcon | null
  agentName: string
  provider: ProviderCapability
  skills: AgentCatalogSkill[]
  lastCheckedAt: string
  includedSkillCount: number
  disabledSkillCount: number
  invalidSkillCount: number
  unsupportedSkillCount: number
  unconfirmedSkillCount: number
  includedTokenEstimate: number
  confirmedTokenEstimate: number
  disabledTokenEstimate: number
  invalidTokenEstimate: number
  unconfirmedTokenEstimate: number
  topSkills: AgentCatalogSkill[]
}
