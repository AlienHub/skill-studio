import { describeSkillGroup } from '../../skill-manager/skillGrouping'
import { type DirectoryOpenTarget, type Skill, type SkillGroup } from '../../skill-manager/types'
import { SkillDirectoryActions } from './SkillDirectoryActions'
import { SkillMetadataTable, SkillSourceTable } from './SkillInfoTables'
import { SkillInstructions } from './SkillInstructions'
import { SkillSourcePicker } from './SkillSourcePicker'

export function SkillDetailPanel({
  openDirectoryTargets,
  selectedSkill,
  selectedSkillGroup,
  onSelectSkill,
}: {
  openDirectoryTargets: DirectoryOpenTarget[]
  selectedSkill: Skill
  selectedSkillGroup: SkillGroup
  onSelectSkill: (skillId: string) => void
}) {
  return (
    <section className="overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-5 shadow-minimal">
      <div className="mb-6">
        <p className="text-[12px] text-foreground/52">{selectedSkillGroup.location}</p>
      </div>

      <div className="mb-8 rounded-[8px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[14px] font-semibold text-foreground">{selectedSkillGroup.name}</h2>
            {selectedSkillGroup.sourceCount > 1 ? (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,white)] px-2 py-0.5 text-[10px] font-medium text-accent">
                {describeSkillGroup(selectedSkillGroup)}
              </span>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-[14px] leading-7 text-foreground/56">
            {selectedSkillGroup.description || selectedSkill.description || '暂无描述。'}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">来源</h3>
          </div>
          <SkillSourcePicker
            group={selectedSkillGroup}
            selectedSkill={selectedSkill}
            onSelectSkill={onSelectSkill}
          />
          <div className={selectedSkillGroup.sourceCount > 1 ? 'mt-3' : undefined}>
            <SkillSourceTable skill={selectedSkill} />
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">元数据</h3>
          </div>
          <SkillMetadataTable skill={selectedSkill} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-semibold text-foreground">说明</h3>
            <SkillDirectoryActions
              directory={selectedSkill.resolvedSkillDirectory || selectedSkill.skillDirectory}
              targets={openDirectoryTargets}
            />
          </div>
          <SkillInstructions content={selectedSkill.content} />
        </section>
      </div>
    </section>
  )
}
