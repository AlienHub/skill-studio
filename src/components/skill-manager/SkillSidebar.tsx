import { type SkillGroup } from '../../skill-manager/types'
import { SettingsEntry } from './SettingsEntry'

export function SkillSidebar({
  filteredSkillGroups,
  skillGroups,
  multiSourceGroupCount,
  selectedGroupId,
  selectedPanel,
  skillSearchQuery,
  onSearchChange,
  onSelectAgentSkillConfig,
  onSelectSettings,
  onSelectSkillGroup,
}: {
  filteredSkillGroups: SkillGroup[]
  skillGroups: SkillGroup[]
  multiSourceGroupCount: number
  selectedGroupId: string | null
  selectedPanel: 'skill' | 'agent-skill-config' | 'settings'
  skillSearchQuery: string
  onSearchChange: (query: string) => void
  onSelectAgentSkillConfig: () => void
  onSelectSettings: () => void
  onSelectSkillGroup: (group: SkillGroup) => void
}) {
  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-[8px] bg-white shadow-minimal">
      <div className="border-b border-border/50 px-4 py-4">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-[14px] font-semibold text-foreground">所有技能</h1>
          <span className="text-[12px] text-foreground/45">
            {filteredSkillGroups.length === skillGroups.length
              ? `${skillGroups.length} 个`
              : `${filteredSkillGroups.length}/${skillGroups.length}`}
          </span>
        </div>
        {multiSourceGroupCount > 0 ? (
          <p className="mt-1 text-[11px] text-foreground/40">
            {multiSourceGroupCount} 个多来源
          </p>
        ) : null}
        <input
          className="mt-3 h-8 w-full rounded-[8px] border border-border/50 bg-[color-mix(in_srgb,var(--foreground)_2%,white)] px-3 text-[12px] text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground/18"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索名称、描述或路径"
          type="search"
          value={skillSearchQuery}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {skillGroups.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-foreground/56">没有在当前目录中发现可用 skill。</div>
        ) : filteredSkillGroups.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-foreground/56">没有匹配的 skill。</div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filteredSkillGroups.map((group) => {
              const isSelected = selectedPanel === 'skill' && group.id === selectedGroupId

              return (
                <li
                  className={`relative px-3 py-1.5 ${isSelected ? 'before:absolute before:inset-y-1.5 before:left-0 before:w-[2px] before:rounded-full before:bg-[#8d7cff]' : ''}`}
                  key={group.id}
                >
                  <button
                    className="relative w-full cursor-pointer text-left"
                    onClick={() => onSelectSkillGroup(group)}
                    type="button"
                  >
                    <div
                      className={`rounded-[8px] px-4 py-3 transition-colors ${
                        isSelected
                          ? 'bg-[color-mix(in_srgb,var(--foreground)_3%,var(--background))]'
                          : 'bg-transparent hover:bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
                            {group.name}
                          </h2>
                          {group.sourceCount > 1 ? (
                            <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,white)] px-2 py-0.5 text-[10px] font-medium text-accent">
                              {group.sourceCount} 来源
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-[12px] text-foreground/52">
                          {group.description || '—'}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="p-3 pt-2">
        <div className="space-y-1">
          <SettingsEntry
            icon="agent-skill"
            isSelected={selectedPanel === 'agent-skill-config'}
            label="Agent Skill 配置"
            onClick={onSelectAgentSkillConfig}
          />
          <SettingsEntry
            isSelected={selectedPanel === 'settings'}
            label="设置"
            onClick={onSelectSettings}
          />
        </div>
      </div>
    </aside>
  )
}
