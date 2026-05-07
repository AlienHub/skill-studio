import { type ReactNode } from 'react'
import { initialSkillManagerState } from 'virtual:skill-manager-state'

export type SkillManagerState = typeof initialSkillManagerState
export type Skill = SkillManagerState['skills'][number]
export type SourceIcon = SkillManagerState['sourceIcons'][string]
export type BuiltInDirectoryState = SkillManagerState['builtInDirectories'][number]

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
