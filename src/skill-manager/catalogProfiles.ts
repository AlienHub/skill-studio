import {
  type AgentCatalogProfile,
  type AgentCatalogSkill,
  type CatalogDisclosure,
  type ProviderCapability,
  type Skill,
} from './types'

const APPROX_CHARS_PER_TOKEN = 3.3
const SHARED_CATALOG_SOURCE_AGENT_ID = 'agents'
const SHARED_CATALOG_CONSUMER_AGENT_IDS = new Set([
  'amp',
  'antigravity',
  'augment',
  'claude',
  'codex',
  'cursor',
  'gemini',
  'github_copilot',
  'goose',
  'hermes',
  'junie',
  'kiro',
  'openclaw',
  'opencode',
  'openhands',
  'qoder',
  'qwen_code',
  'trae',
  'trae_cn',
  'windsurf',
])

const NATIVE_PROVIDER_CAPABILITIES: Record<string, ProviderCapability> = {
  claude: {
    provider: 'claude',
    supportsCatalog: true,
    supportsDescription: true,
    supportsWhenToUse: true,
    supportsDisableModelInvocation: true,
    implicitInvocationField: 'disable-model-invocation',
    supportsUserInvocable: true,
    supportsPaths: true,
    supportLevel: 'native',
    evidence: 'official-docs',
  },
  codex: {
    provider: 'codex',
    supportsCatalog: true,
    supportsDescription: true,
    supportsWhenToUse: true,
    supportsDisableModelInvocation: true,
    implicitInvocationField: 'policy.allow_implicit_invocation',
    supportsUserInvocable: true,
    supportsPaths: false,
    supportLevel: 'equivalent-field',
    evidence: 'observed',
  },
}

const GENERIC_PROVIDER_CAPABILITY: ProviderCapability = {
  provider: 'unknown',
  supportsCatalog: true,
  supportsDescription: true,
  supportsWhenToUse: false,
  supportsDisableModelInvocation: false,
  implicitInvocationField: null,
  supportsUserInvocable: false,
  supportsPaths: false,
  supportLevel: 'unknown',
  evidence: 'unknown',
}

function byLabel(left: string, right: string) {
  return left.localeCompare(right, 'zh-CN')
}

function skillIdentity(skill: Skill) {
  return (skill.name || skill.slug || skill.location).trim().toLowerCase()
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function booleanValue(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', 'yes', '1', 'on'].includes(normalized)) {
      return true
    }

    if (['false', 'no', '0', 'off'].includes(normalized)) {
      return false
    }
  }

  return null
}

function objectValue(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function metadataBoolean(metadata: Record<string, unknown>, path: string) {
  const segments = path.split('.')
  let current: unknown = metadata

  for (const segment of segments) {
    const currentObject = objectValue(current)
    if (!currentObject || !(segment in currentObject)) {
      return null
    }

    current = currentObject[segment]
  }

  return booleanValue(current)
}

function providerCapability(agentId: string): ProviderCapability {
  const nativeCapability = NATIVE_PROVIDER_CAPABILITIES[agentId]
  if (nativeCapability) {
    return nativeCapability
  }

  return {
    ...GENERIC_PROVIDER_CAPABILITY,
    provider: agentId || 'unknown',
  }
}

function whenToUse(skill: Skill) {
  return (
    stringValue(skill.metadata.when_to_use) ??
    stringValue(skill.metadata.whenToUse) ??
    stringValue(skill.metadata['when-to-use'])
  )
}

function userInvocation(skill: Skill) {
  const disabledUserInvocation = metadataBoolean(skill.metadata, 'disable-user-invocation')
  if (disabledUserInvocation === true) {
    return 'disabled'
  }

  const userInvocable = metadataBoolean(skill.metadata, 'user-invocable')
  if (userInvocable === false) {
    return 'disabled'
  }

  if (disabledUserInvocation === false || userInvocable === true) {
    return 'enabled'
  }

  return 'unknown'
}

function disablesModelInvocation(skill: Skill, provider: ProviderCapability) {
  const standardDisableField =
    metadataBoolean(skill.metadata, 'disable-model-invocation') ??
    metadataBoolean(skill.metadata, 'disable_model_invocation')

  if (standardDisableField === true) {
    return true
  }

  if (provider.provider === 'codex') {
    const codexImplicitInvocation =
      metadataBoolean(skill.metadata, 'policy.allow_implicit_invocation') ??
      metadataBoolean(skill.metadata, 'allow_implicit_invocation')

    if (codexImplicitInvocation === false) {
      return true
    }
  }

  return false
}

export function estimateResidentCatalogTokens(skill: Skill) {
  const catalogParts = [
    skill.name,
    skill.description,
    whenToUse(skill),
    skill.location,
  ].filter((part): part is string => Boolean(part?.trim()))

  if (!catalogParts.length) {
    return 0
  }

  return Math.ceil(catalogParts.join(' ').length / APPROX_CHARS_PER_TOKEN)
}

function catalogSourceField(skill: Skill) {
  const fields = ['name', 'description']

  if (whenToUse(skill)) {
    fields.push('when_to_use')
  }

  fields.push('location')
  return fields.join(', ')
}

function catalogDisclosure(skill: Skill, provider: ProviderCapability): CatalogDisclosure {
  if (!provider.supportsCatalog) {
    return 'unsupported'
  }

  if (!skill.name.trim() || !skill.description.trim()) {
    return 'invalid'
  }

  if (disablesModelInvocation(skill, provider)) {
    return 'disabled'
  }

  if (provider.supportLevel === 'unknown') {
    return 'unknown'
  }

  return 'included'
}

function filteredReason(disclosure: CatalogDisclosure, provider: ProviderCapability) {
  switch (disclosure) {
    case 'disabled':
      return provider.implicitInvocationField
        ? `model invocation disabled by ${provider.implicitInvocationField}`
        : 'model invocation disabled'
    case 'invalid':
      return 'missing required catalog fields'
    case 'unsupported':
      return 'provider does not support Agent Skills catalog'
    case 'unknown':
      return 'provider catalog support is not confirmed'
    case 'included':
      return null
  }
}

function buildCatalogSkill(skill: Skill, provider: ProviderCapability): AgentCatalogSkill {
  const disclosure = catalogDisclosure(skill, provider)
  const includedInEstimate = disclosure === 'included' || disclosure === 'unknown'
  const modelInvocation = disclosure === 'disabled'
    ? 'disabled'
    : disclosure === 'unknown'
      ? 'unknown'
      : 'enabled'

  return {
    id: skill.id,
    name: skill.name || skill.slug || skill.location,
    sourcePath: skill.skillDirectory,
    catalogDisclosure: disclosure,
    modelInvocation,
    userInvocation: userInvocation(skill),
    residentCatalogTokens: estimateResidentCatalogTokens(skill),
    includedInEstimate,
    sourceField: disclosure === 'invalid' || disclosure === 'unsupported' ? null : catalogSourceField(skill),
    filteredReason: filteredReason(disclosure, provider),
    confidence: disclosure === 'unknown' ? 'low' : 'high',
  }
}

function agentConsumesSharedCatalog(agentId: string) {
  return SHARED_CATALOG_CONSUMER_AGENT_IDS.has(agentId)
}

function isSharedCatalogSkill(skill: Skill) {
  return skill.agentId === SHARED_CATALOG_SOURCE_AGENT_ID
}

function choosePreferredSkill(current: Skill | undefined, candidate: Skill, agentId: string) {
  if (!current) {
    return candidate
  }

  const currentIsShared = isSharedCatalogSkill(current)
  const candidateIsShared = isSharedCatalogSkill(candidate)

  if (currentIsShared !== candidateIsShared) {
    return candidateIsShared ? current : candidate
  }

  if (current.agentId !== agentId && candidate.agentId === agentId) {
    return candidate
  }

  if (current.agentId === agentId && candidate.agentId !== agentId) {
    return current
  }

  if (estimateResidentCatalogTokens(candidate) > estimateResidentCatalogTokens(current)) {
    return candidate
  }

  return current
}

function effectiveSkillsForAgent(agentId: string, skillsByAgent: Map<string, Skill[]>) {
  const directSkills = skillsByAgent.get(agentId) ?? []
  const sharedSkills = agentConsumesSharedCatalog(agentId)
    ? (skillsByAgent.get(SHARED_CATALOG_SOURCE_AGENT_ID) ?? [])
    : []
  const effectiveSkills = new Map<string, Skill>()

  for (const skill of [...directSkills, ...sharedSkills]) {
    const identity = skillIdentity(skill)
    effectiveSkills.set(identity, choosePreferredSkill(effectiveSkills.get(identity), skill, agentId))
  }

  return Array.from(effectiveSkills.values())
}

function sumTokens(skills: AgentCatalogSkill[]) {
  return skills.reduce((total, skill) => total + skill.residentCatalogTokens, 0)
}

function topCatalogSkills(skills: AgentCatalogSkill[]) {
  const topByName = new Map<string, AgentCatalogSkill>()

  for (const skill of skills) {
    const key = skill.name.trim().toLowerCase()
    const current = topByName.get(key)
    if (!current || skill.residentCatalogTokens > current.residentCatalogTokens) {
      topByName.set(key, skill)
    }
  }

  return Array.from(topByName.values())
    .sort((left, right) => {
      if (left.residentCatalogTokens !== right.residentCatalogTokens) {
        return right.residentCatalogTokens - left.residentCatalogTokens
      }

      return byLabel(left.name, right.name)
    })
    .slice(0, 5)
}

export function buildAgentCatalogProfiles(skills: Skill[], checkedAt = new Date()): AgentCatalogProfile[] {
  const skillsByAgent = new Map<string, Skill[]>()

  for (const skill of skills) {
    const current = skillsByAgent.get(skill.agentId) ?? []
    current.push(skill)
    skillsByAgent.set(skill.agentId, current)
  }

  return Array.from(skillsByAgent.entries())
    .filter(([agentId]) => agentId !== SHARED_CATALOG_SOURCE_AGENT_ID)
    .map(([agentId, agentSkills]) => {
      const effectiveSkills = effectiveSkillsForAgent(agentId, skillsByAgent)
      const provider = providerCapability(agentId)
      const catalogSkills = effectiveSkills
        .map((skill) => buildCatalogSkill(skill, provider))
        .sort((left, right) => byLabel(left.name, right.name))
      const includedSkills = catalogSkills.filter((skill) => skill.includedInEstimate)
      const confirmedSkills = catalogSkills.filter((skill) => skill.catalogDisclosure === 'included')
      const disabledSkills = catalogSkills.filter((skill) => skill.catalogDisclosure === 'disabled')
      const invalidSkills = catalogSkills.filter((skill) => skill.catalogDisclosure === 'invalid')
      const unsupportedSkills = catalogSkills.filter((skill) => skill.catalogDisclosure === 'unsupported')
      const unconfirmedSkills = catalogSkills.filter((skill) => skill.catalogDisclosure === 'unknown')

      return {
        agentId,
        agentIcon: effectiveSkills[0]?.agentIcon ?? agentSkills[0]?.agentIcon ?? null,
        agentName: agentSkills[0]?.agentName ?? agentId,
        provider,
        skills: catalogSkills,
        lastCheckedAt: checkedAt.toISOString(),
        includedSkillCount: includedSkills.length,
        disabledSkillCount: disabledSkills.length,
        invalidSkillCount: invalidSkills.length,
        unsupportedSkillCount: unsupportedSkills.length,
        unconfirmedSkillCount: unconfirmedSkills.length,
        includedTokenEstimate: sumTokens(includedSkills),
        confirmedTokenEstimate: sumTokens(confirmedSkills),
        disabledTokenEstimate: sumTokens(disabledSkills),
        invalidTokenEstimate: sumTokens(invalidSkills),
        unconfirmedTokenEstimate: sumTokens(unconfirmedSkills),
        topSkills: topCatalogSkills(includedSkills),
      } satisfies AgentCatalogProfile
    })
    .sort((left, right) => {
      if (left.includedTokenEstimate !== right.includedTokenEstimate) {
        return right.includedTokenEstimate - left.includedTokenEstimate
      }

      return byLabel(left.agentName, right.agentName)
    })
}
