import { type BuiltInDirectoryState, type SourceIcon } from '../../skill-manager/types'
import { SkillDirectoryConfig } from './SkillDirectoryConfig'

export function AgentSkillConfigPanel({
  builtInDirectories,
  configuredDirectories,
  feedbackMessage,
  inputDisabled,
  sourceIcons,
  skillCount,
  userConfiguredDirectories,
  onRefresh,
  onRemoveDirectory,
  onSaveSourceIcon,
  onSetFeedbackMessage,
  onSelectDirectory,
}: {
  builtInDirectories: BuiltInDirectoryState[]
  configuredDirectories: string[]
  feedbackMessage: string | null
  inputDisabled: boolean
  sourceIcons: Record<string, SourceIcon>
  skillCount: number
  userConfiguredDirectories: string[]
  onRefresh: () => void
  onRemoveDirectory: (directory: string) => void
  onSaveSourceIcon: (directory: string, icon: SourceIcon | null) => void
  onSetFeedbackMessage: (message: string) => void
  onSelectDirectory: (directory: string) => void
}) {
  return (
    <section className="overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-5 shadow-minimal">
      <div className="mb-6">
        <p className="text-[12px] text-foreground/52">agent skill config</p>
      </div>

      <div className="mb-8 rounded-[8px]">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-foreground">Agent Skill 配置</h2>
          <p className="mt-2 text-[14px] leading-7 text-foreground/56">
            配置需要扫描的 skill 根目录。选择、删除或重新扫描后会立即刷新左侧列表。
          </p>
        </div>
      </div>

      <SkillDirectoryConfig
        builtInDirectories={builtInDirectories}
        configuredDirectories={configuredDirectories}
        feedbackMessage={feedbackMessage}
        inputDisabled={inputDisabled}
        sourceIcons={sourceIcons}
        skillCount={skillCount}
        userConfiguredDirectories={userConfiguredDirectories}
        onRefresh={onRefresh}
        onRemoveDirectory={onRemoveDirectory}
        onSaveSourceIcon={onSaveSourceIcon}
        onSetFeedbackMessage={onSetFeedbackMessage}
        onSelectDirectory={onSelectDirectory}
      />
    </section>
  )
}
