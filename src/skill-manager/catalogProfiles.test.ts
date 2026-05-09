import { describe, expect, test } from 'bun:test'
import {
  buildAgentCatalogProfiles,
  estimateResidentCatalogTokens,
} from './catalogProfiles'
import { type AgentCatalogProfile, type Skill } from './types'

function firstProfile(profiles: AgentCatalogProfile[]) {
  const profile = profiles[0]
  if (!profile) {
    throw new Error('Expected one catalog profile')
  }

  return profile
}

function profileByAgent(profiles: AgentCatalogProfile[], agentId: string) {
  const profile = profiles.find((entry) => entry.agentId === agentId)
  if (!profile) {
    throw new Error(`Expected catalog profile for ${agentId}`)
  }

  return profile
}

function skill(overrides: Partial<Skill>): Skill {
  const base = {
    id: 'skill-1',
    slug: 'planner',
    name: 'planner',
    description: 'Plans focused implementation steps.',
    content: 'Body content is intentionally ignored by catalog estimates.',
    location: 'planner/SKILL.md',
    sourceDirectory: '/Users/alice/.claude/skills',
    skillDirectory: '/Users/alice/.claude/skills/planner',
    resolvedSourceDirectory: '/Users/alice/.claude/skills',
    resolvedSkillDirectory: '/Users/alice/.claude/skills/planner',
    contentHash: 'abc123',
    agentId: 'claude',
    agentName: 'Claude',
    agentIcon: null,
    metadata: {},
  }

  return { ...base, ...overrides } as Skill
}

describe('estimateResidentCatalogTokens', () => {
  test('counts only catalog disclosure fields and short location metadata', () => {
    const tokens = estimateResidentCatalogTokens(
      skill({
        name: 'writer',
        description: 'Writes compact release notes.',
        location: 'writer/SKILL.md',
        metadata: {
          when_to_use: 'Use when drafting release notes.',
        },
      })
    )

    expect(tokens).toBe(26)
  })

  test('uses the same estimate that appears in skill metadata', () => {
    expect(
      estimateResidentCatalogTokens(
        skill({
          slug: 'find-skills',
          name: 'find-skills',
          description: 'Helps users discover and install agent skills.',
          location: 'find-skills/SKILL.md',
        })
      )
    ).toBeGreaterThan(0)
  })
})

describe('buildAgentCatalogProfiles', () => {
  test('builds agent totals and top catalog cost rows', () => {
    const profile = firstProfile(buildAgentCatalogProfiles([
      skill({
        id: 'small',
        name: 'small',
        description: 'Short.',
        location: 'small/SKILL.md',
      }),
      skill({
        id: 'large',
        name: 'large',
        description: 'A longer catalog description that should sort before the tiny entry.',
        location: 'large/SKILL.md',
      }),
    ]))

    expect(profile.agentName).toBe('Claude')
    expect(profile.includedSkillCount).toBe(2)
    expect(profile.disabledSkillCount).toBe(0)
    expect(profile.includedTokenEstimate).toBeGreaterThan(0)
    expect(profile.topSkills.map((entry) => entry.name)).toEqual(['large', 'small'])
  })

  test('deduplicates repeated skill names in top catalog cost rows', () => {
    const profile = firstProfile(buildAgentCatalogProfiles([
      skill({
        id: 'large-a',
        name: 'large',
        description: 'A longer catalog description that should represent repeated entries.',
        location: 'large-a/SKILL.md',
      }),
      skill({
        id: 'large-b',
        name: 'large',
        description: 'A duplicate catalog description.',
        location: 'large-b/SKILL.md',
      }),
      skill({
        id: 'small',
        name: 'small',
        description: 'Short.',
        location: 'small/SKILL.md',
      }),
    ]))

    expect(profile.includedSkillCount).toBe(2)
    expect(profile.topSkills.map((entry) => entry.name)).toEqual(['large', 'small'])
  })

  test('excludes Claude skills with disable-model-invocation enabled', () => {
    const profile = firstProfile(buildAgentCatalogProfiles([
      skill({
        metadata: {
          'disable-model-invocation': true,
        },
      }),
    ]))

    expect(profile.skills[0]?.catalogDisclosure).toBe('disabled')
    expect(profile.includedSkillCount).toBe(0)
    expect(profile.disabledSkillCount).toBe(1)
    expect(profile.disabledTokenEstimate).toBeGreaterThan(0)
  })

  test('excludes Codex skills when policy.allow_implicit_invocation is false', () => {
    const profile = firstProfile(buildAgentCatalogProfiles([
      skill({
        agentId: 'codex',
        agentName: 'Codex',
        sourceDirectory: '/Users/alice/.codex/skills',
        skillDirectory: '/Users/alice/.codex/skills/planner',
        resolvedSourceDirectory: '/Users/alice/.codex/skills',
        resolvedSkillDirectory: '/Users/alice/.codex/skills/planner',
        metadata: {
          policy: {
            allow_implicit_invocation: false,
          },
        },
      }),
    ]))

    expect(profile.provider.implicitInvocationField).toBe('policy.allow_implicit_invocation')
    expect(profile.skills[0]?.catalogDisclosure).toBe('disabled')
    expect(profile.includedSkillCount).toBe(0)
  })

  test('keeps unknown provider rows in the estimate with low confidence', () => {
    const profile = firstProfile(buildAgentCatalogProfiles([
      skill({
        agentId: 'unknown',
        agentName: 'Custom Source',
        sourceDirectory: '/tmp/custom-skills',
      }),
    ]))

    expect(profile.skills[0]?.catalogDisclosure).toBe('unknown')
    expect(profile.skills[0]?.includedInEstimate).toBe(true)
    expect(profile.unconfirmedSkillCount).toBe(1)
    expect(profile.unconfirmedTokenEstimate).toBe(profile.includedTokenEstimate)
  })

  test('merges shared Agents skills into mainstream agent catalogs', () => {
    const profiles = buildAgentCatalogProfiles([
      skill({
        agentId: 'agents',
        agentName: 'Agents',
        sourceDirectory: '/Users/alice/.agents/skills',
        skillDirectory: '/Users/alice/.agents/skills/shared-planner',
        resolvedSourceDirectory: '/Users/alice/.agents/skills',
        resolvedSkillDirectory: '/Users/alice/.agents/skills/shared-planner',
        name: 'shared-planner',
        slug: 'shared-planner',
        location: 'shared-planner/SKILL.md',
      }),
      skill({
        agentId: 'claude',
        agentName: 'Claude',
        name: 'local-planner',
        slug: 'local-planner',
        location: 'local-planner/SKILL.md',
      }),
    ])

    const claudeProfile = profileByAgent(profiles, 'claude')

    expect(claudeProfile.includedSkillCount).toBe(2)
    expect(claudeProfile.skills.map((entry) => entry.name)).toEqual(['local-planner', 'shared-planner'])
    expect(profiles.some((profile) => profile.agentId === 'agents')).toBe(false)
  })

  test('deduplicates shared and local copies of the same skill for one agent', () => {
    const profiles = buildAgentCatalogProfiles([
      skill({
        agentId: 'agents',
        agentName: 'Agents',
        sourceDirectory: '/Users/alice/.agents/skills',
        skillDirectory: '/Users/alice/.agents/skills/planner',
        resolvedSourceDirectory: '/Users/alice/.agents/skills',
        resolvedSkillDirectory: '/Users/alice/.agents/skills/planner',
        name: 'planner',
        slug: 'planner',
        description: 'Shared planner description.',
        location: 'planner/SKILL.md',
      }),
      skill({
        agentId: 'claude',
        agentName: 'Claude',
        sourceDirectory: '/Users/alice/.claude/skills',
        skillDirectory: '/Users/alice/.claude/skills/planner',
        resolvedSourceDirectory: '/Users/alice/.claude/skills',
        resolvedSkillDirectory: '/Users/alice/.claude/skills/planner',
        name: 'planner',
        slug: 'planner',
        description: 'Claude planner override.',
        location: 'planner/SKILL.md',
      }),
    ])

    const claudeProfile = profileByAgent(profiles, 'claude')

    expect(claudeProfile.includedSkillCount).toBe(1)
    expect(claudeProfile.skills[0]?.sourcePath).toBe('/Users/alice/.claude/skills/planner')
  })
})
