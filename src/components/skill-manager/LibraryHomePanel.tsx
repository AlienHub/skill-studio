import { type TranslationKey } from '../../skill-manager/i18n'
import { AgentIcon } from '../../skill-manager/agentInfo'
import { displayAgentName } from '../../skill-manager/display'
import { useAppPreferences } from '../../skill-manager/preferences'
import {
  changeMessageKeys,
  changeParams,
} from '../../skill-manager/libraryPresentation'
import { type AgentCatalogProfile, type LibraryVisitState, type SkillGroup } from '../../skill-manager/types'

function formatTokenEstimate(tokens: number) {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`
  }

  return String(tokens)
}

function CatalogProfilePanel({
  profiles,
}: {
  profiles: AgentCatalogProfile[]
}) {
  const { t } = useAppPreferences()

  if (!profiles.length) {
    return null
  }

  return (
    <section className="mt-14 border-t border-border/55 pt-5">
      <div className="mb-4">
        <h3 className="text-[12px] font-semibold text-foreground/60">{t('catalog.title')}</h3>
      </div>

      <div className="overflow-hidden rounded-[8px] bg-[var(--surface)] shadow-minimal-flat">
        <div className="divide-y divide-border/45">
          {profiles.map((profile) => {
          const tokenLabel = formatTokenEstimate(profile.includedTokenEstimate)
          const label = displayAgentName(profile.agentId, profile.agentName, t)

          return (
            <article
              className="flex items-center gap-3 px-3 py-2.5"
              key={profile.agentId}
            >
              <AgentIcon
                agentIcon={profile.agentIcon}
                agentId={profile.agentId}
                agentName={profile.agentName}
                size={16}
              />
              <p className="min-w-0 text-[13px] text-foreground/70">
                <span className="font-medium text-foreground">{label}</span>
                <span>：</span>
                <span>{t('catalog.profileLine', { count: profile.includedSkillCount, tokens: tokenLabel })}</span>
              </p>
            </article>
          )
        })}
      </div>
      </div>
    </section>
  )
}

function formatDate(value: string | null) {
  if (!value) {
    return null
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return null
  }
}

export function LibraryHomePanel({
  catalogProfiles,
  skillGroups,
  visitState,
  onOpenAgentSkillConfig,
  onOpenSettings,
  onSelectSkillGroup,
}: {
  catalogProfiles: AgentCatalogProfile[]
  skillGroups: SkillGroup[]
  visitState: LibraryVisitState
  onOpenAgentSkillConfig: () => void
  onOpenSettings: () => void
  onSelectSkillGroup: (group: SkillGroup) => void
}) {
  const { t } = useAppPreferences()
  const previousDate = formatDate(visitState.previousCapturedAt)
  const capturedDate = formatDate(visitState.capturedAt)
  const groupsById = new Map(skillGroups.map((group) => [group.id, group]))
  const visibleChanges = visitState.changes.slice(0, 4)
  const firstSkillGroup = skillGroups[0] ?? null
  const libraryMeta = capturedDate
    ? `${t('home.libraryMeta', { count: skillGroups.length })} · ${t('home.updatedAt', { date: capturedDate })}`
    : t('home.libraryMeta', { count: skillGroups.length })
  const statusMeta = previousDate
    ? `${t('home.comparedSince', { date: previousDate })}${capturedDate ? ` · ${t('home.updatedAt', { date: capturedDate })}` : ''}`
    : capturedDate
      ? t('home.updatedAt', { date: capturedDate })
      : t('home.snapshotHint')
  const homeStatusKey = !visitState.hasPreviousSnapshot
    ? 'library.statusFirstVisit'
    : visitState.changes.length === 1
      ? 'library.statusChangedOne'
      : visitState.changes.length > 1
        ? 'library.statusChanged'
        : 'library.statusClean'

  return (
    <section className="h-full overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] shadow-minimal">
      <div className="mx-auto flex min-h-full max-w-[900px] flex-col px-7 py-7 sm:px-10 sm:py-9">
        <header className="flex items-center justify-between gap-6 text-[12px] text-foreground/42">
          <span className="font-medium text-foreground/54">{t('home.eyebrow')}</span>
          <span className="truncate">{libraryMeta}</span>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="max-w-[640px]">
            <h2 className="text-[34px] font-semibold leading-tight text-foreground">{t('home.title')}</h2>
            <p className="mt-5 max-w-[580px] text-[15px] leading-8 text-foreground/62">
              {t(homeStatusKey, { count: visitState.changes.length })}
            </p>
            <p className="mt-2 text-[12px] text-foreground/38">
              {statusMeta}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-2">
              <button
                className="cursor-pointer rounded-[8px] bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!firstSkillGroup}
                onClick={() => firstSkillGroup && onSelectSkillGroup(firstSkillGroup)}
                type="button"
              >
                {t('home.openLibrary')}
              </button>
              <button
                className="cursor-pointer rounded-[8px] bg-[var(--surface)] px-3 py-2 text-[12px] font-medium text-foreground/64 shadow-minimal-flat transition-colors hover:text-foreground"
                onClick={onOpenAgentSkillConfig}
                type="button"
              >
                {t('app.agentSkillConfig')}
              </button>
              <button
                className="cursor-pointer rounded-[8px] bg-[var(--surface)] px-3 py-2 text-[12px] font-medium text-foreground/64 shadow-minimal-flat transition-colors hover:text-foreground"
                onClick={onOpenSettings}
                type="button"
              >
                {t('app.settings')}
              </button>
            </div>
          </div>

          {visibleChanges.length ? (
            <div className="mt-12 border-t border-border/55 pt-5">
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-[12px] font-semibold text-foreground/60">{t('home.changeSection')}</h3>
                  <span className="text-[11px] text-foreground/34">{visitState.changes.length}</span>
                </div>
                <div className="divide-y divide-border/45">
                  {visibleChanges.map((change, index) => {
                    const group = groupsById.get(change.skillId)
                    return (
                      <button
                        className="w-full px-0 py-2.5 text-left transition-opacity hover:opacity-70 disabled:cursor-default"
                        disabled={!group}
                        key={`${change.type}-${change.skillId}-${change.sourcePath ?? index}`}
                        onClick={() => group && onSelectSkillGroup(group)}
                        type="button"
                      >
                        <div className="flex min-w-0 items-baseline justify-between gap-3">
                          <p className="truncate text-[13px] font-medium text-foreground">{change.skillName}</p>
                          <span className="shrink-0 text-[10px] text-foreground/34">
                            {t(`changes.type.${change.type}` as TranslationKey)}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[12px] text-foreground/48">
                          {t(changeMessageKeys[change.type], changeParams(change))}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>
          ) : (
            <p className="mt-12 text-[12px] text-foreground/44">{t('home.emptyChanges')}</p>
          )}

          <CatalogProfilePanel
            profiles={catalogProfiles}
          />
        </div>
      </div>
    </section>
  )
}
