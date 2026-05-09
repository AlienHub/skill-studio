import { useAppPreferences } from '../../skill-manager/preferences'
import { changeMessageKeys, changeParams } from '../../skill-manager/libraryPresentation'
import { estimateResidentCatalogTokens } from '../../skill-manager/catalogProfiles'
import {
  type DirectoryOpenTarget,
  type LibraryChange,
  type Skill,
  type SkillGroup,
} from '../../skill-manager/types'
import { SkillMetadataTable, SkillSourceTable } from './SkillInfoTables'
import { SkillInstructions } from './SkillInstructions'
import { SkillSourcePicker } from './SkillSourcePicker'

function formatTokenEstimate(tokens: number) {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`
  }

  return String(tokens)
}

function SkillInsightNotes({
  recentChanges,
}: {
  recentChanges: LibraryChange[]
}) {
  const { t } = useAppPreferences()

  if (!recentChanges.length) {
    return null
  }

  return (
    <div className="mt-4 rounded-[8px] border border-border/50 bg-[var(--surface)] p-3 shadow-minimal-flat">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/38">
        {t('changes.title')}
      </p>
      <div className="mt-2 space-y-1.5">
        {recentChanges.slice(0, 3).map((change, index) => (
          <p className="text-[12px] leading-5 text-foreground/58" key={`${change.type}-${change.sourcePath ?? index}`}>
            {t(changeMessageKeys[change.type], changeParams(change))}
          </p>
        ))}
      </div>
    </div>
  )
}

export function SkillDetailPanel({
  configuredDirectories,
  isPinned,
  openDirectoryTargets,
  recentChanges,
  selectedSkill,
  selectedSkillGroup,
  onCreateSymlink,
  onConvertToSymlink,
  onExportZip,
  onRemoveSource,
  onSelectSkill,
  onTogglePinned,
}: {
  configuredDirectories: string[]
  isPinned: boolean
  openDirectoryTargets: DirectoryOpenTarget[]
  recentChanges: LibraryChange[]
  selectedSkill: Skill
  selectedSkillGroup: SkillGroup
  onCreateSymlink: (skill: Skill, targetSourceDirectory: string) => Promise<void>
  onConvertToSymlink: (skill: Skill, targetSkill: Skill) => Promise<void>
  onExportZip: (skill: Skill) => Promise<void>
  onRemoveSource: (skill: Skill) => Promise<void>
  onSelectSkill: (skillId: string) => void
  onTogglePinned: () => void
}) {
  const { t } = useAppPreferences()
  const catalogTokens = estimateResidentCatalogTokens(selectedSkill)
  const detailSummary = t('detail.summary', {
    variantCount: selectedSkillGroup.variantCount || 1,
    sourceCount: selectedSkillGroup.sourceCount,
  })

  return (
    <section className="overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-5 shadow-minimal">
      <div className="sticky top-[-1.25rem] z-50 -mx-5 -mt-5 mb-4 border-b border-border/45 bg-[oklch(from_var(--background-elevated)_l_c_h_/_0.84)] px-5 py-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="truncate text-[14px] font-semibold text-foreground">{selectedSkillGroup.name}</h2>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                selectedSkillGroup.variantCount > 1
                  ? 'bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] text-accent'
                  : 'bg-[var(--surface-muted)] text-foreground/52'
              }`}
            >
              {detailSummary}
            </span>
          </div>
          <button
            aria-pressed={isPinned}
            className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border text-[15px] leading-none transition-colors ${
              isPinned
                ? 'border-[color-mix(in_srgb,var(--accent)_16%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-accent hover:bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]'
                : 'border-transparent bg-transparent text-foreground/34 hover:bg-foreground/5 hover:text-foreground/68'
            }`}
            onClick={onTogglePinned}
            title={isPinned ? t('activity.unpin') : t('activity.pin')}
            type="button"
          >
            {isPinned ? '★' : '☆'}
          </button>
        </div>
      </div>
      <div className="mb-8 rounded-[8px]">
        <p className="line-clamp-2 text-[14px] leading-7 text-foreground/56">
          {selectedSkillGroup.description || selectedSkill.description || t('detail.noDescription')}
        </p>
        <SkillInsightNotes recentChanges={recentChanges} />
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">{t('detail.sources')}</h3>
          </div>
          <SkillSourcePicker
            group={selectedSkillGroup}
            selectedSkill={selectedSkill}
            onSelectSkill={onSelectSkill}
          />
          <div className={selectedSkillGroup.sourceCount > 1 ? 'mt-3' : undefined}>
            <SkillSourceTable
              configuredDirectories={configuredDirectories}
              openDirectoryTargets={openDirectoryTargets}
              skill={selectedSkill}
              skillGroup={selectedSkillGroup}
              sourceCount={selectedSkillGroup.sourceCount}
              onCreateSymlink={onCreateSymlink}
              onConvertToSymlink={onConvertToSymlink}
              onExportZip={onExportZip}
              onRemoveSource={onRemoveSource}
            />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h3 className="text-[14px] font-semibold text-foreground">{t('detail.metadata')}</h3>
            <p className="shrink-0 text-[12px] text-foreground/42">
              {t('catalog.tokensShort', { tokens: formatTokenEstimate(catalogTokens) })}
            </p>
          </div>
          <SkillMetadataTable skill={selectedSkill} />
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">{t('detail.instructions')}</h3>
          </div>
          <SkillInstructions content={selectedSkill.content} />
        </section>
      </div>
    </section>
  )
}
