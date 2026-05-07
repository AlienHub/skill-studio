import { useRef, useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { AgentIcon, getAgentInfoFromDirectory } from '../../skill-manager/agentInfo'
import {
  normalizeSelectedDirectoryPath,
  readFileAsDataUrl,
} from '../../skill-manager/fileSelection'
import { type BuiltInDirectoryState, type SourceIcon } from '../../skill-manager/types'

export function SkillDirectoryConfig({
  builtInDirectories,
  configuredDirectories,
  skillCount,
  sourceIcons,
  userConfiguredDirectories,
  inputDisabled,
  feedbackMessage,
  onRemoveDirectory,
  onRefresh,
  onSaveSourceIcon,
  onSelectDirectory,
  onSetFeedbackMessage,
}: {
  builtInDirectories: BuiltInDirectoryState[]
  configuredDirectories: string[]
  skillCount: number
  sourceIcons: Record<string, SourceIcon>
  userConfiguredDirectories: string[]
  inputDisabled: boolean
  feedbackMessage: string | null
  onRemoveDirectory: (directory: string) => void
  onRefresh: () => void
  onSaveSourceIcon: (directory: string, icon: SourceIcon | null) => void
  onSelectDirectory: (directory: string) => void
  onSetFeedbackMessage: (message: string) => void
}) {
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const [selectedIconDirectory, setSelectedIconDirectory] = useState<string | null>(null)
  const [isUnavailableExpanded, setIsUnavailableExpanded] = useState(false)
  const scanButtonLabel = inputDisabled ? '扫描中…' : '重新扫描'
  const chooseButtonLabel = inputDisabled ? '处理中…' : '选择文件夹'
  const installedBuiltInDirectories = builtInDirectories.filter((directory) => directory.installed)
  const unavailableBuiltInDirectories = builtInDirectories.filter((directory) => !directory.installed)

  const handleChooseDirectory = () => {
    void open({
      directory: true,
      multiple: false,
    }).then((selectedDirectory) => {
      if (typeof selectedDirectory === 'string') {
        onSelectDirectory(selectedDirectory)
        return
      }

      directoryInputRef.current?.click()
    }).catch(() => {
      directoryInputRef.current?.click()
    })
  }

  const handleDirectorySelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] as
      | (File & { path?: string; webkitRelativePath?: string })
      | undefined

    if (!selectedFile) {
      return
    }

    const selectedDirectory = normalizeSelectedDirectoryPath(
      selectedFile.path ?? '',
      selectedFile.webkitRelativePath
    )

    if (selectedDirectory) {
      onSelectDirectory(selectedDirectory)
    }

    event.target.value = ''
  }

  const handleChooseIcon = (directory: string) => {
    setSelectedIconDirectory(directory)
    iconInputRef.current?.click()
  }

  const handleIconSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    const directory = selectedIconDirectory
    event.target.value = ''

    if (!selectedFile || !directory) {
      return
    }

    const fileName = selectedFile.name.toLowerCase()
    const isSupportedIcon =
      selectedFile.type === 'image/png' ||
      selectedFile.type === 'image/svg+xml' ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.svg')

    if (!isSupportedIcon) {
      onSetFeedbackMessage('图标仅支持 PNG 或 SVG 文件。')
      return
    }

    void readFileAsDataUrl(selectedFile).then((value) => {
      onSaveSourceIcon(directory, { type: 'dataUrl', value })
      setSelectedIconDirectory(null)
    }).catch(() => {
      onSetFeedbackMessage('读取图标失败，请重新选择 PNG 或 SVG 文件。')
    })
  }

  return (
    <div>
      <section>
        <input
          ref={directoryInputRef}
          className="hidden"
          multiple
          onChange={handleDirectorySelection}
          type="file"
          {...({ webkitdirectory: 'true' } as Record<string, string>)}
        />
        <input
          ref={iconInputRef}
          accept=".png,.svg,image/png,image/svg+xml"
          className="hidden"
          onChange={handleIconSelection}
          type="file"
        />

        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">扫描目录</h3>
            <p className="mt-1 text-[12px] text-foreground/52">
              当前扫描 {configuredDirectories.length} 个目录，发现 {skillCount} 个 skill
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="cursor-pointer rounded-[8px] bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={inputDisabled}
              onClick={handleChooseDirectory}
              type="button"
            >
              {chooseButtonLabel}
            </button>
            <button
              className="cursor-pointer rounded-[8px] border border-border/50 bg-white px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:text-foreground/35"
              disabled={inputDisabled}
              onClick={onRefresh}
              type="button"
            >
              {scanButtonLabel}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[12px] font-medium text-foreground/70">自定义目录</div>
              <div className="text-[11px] text-foreground/40">{userConfiguredDirectories.length} 个</div>
            </div>
            <div className="space-y-2">
              {userConfiguredDirectories.length === 0 ? (
                <div className="rounded-[8px] border border-border/50 bg-white px-4 py-3 text-[12px] text-foreground/52 shadow-minimal-flat">
                  暂无自定义扫描目录。
                </div>
              ) : (
                userConfiguredDirectories.map((directory) => {
                  const agentInfo = getAgentInfoFromDirectory(directory)
                  const sourceIcon = sourceIcons[directory]

                  return (
                    <div
                      className="flex items-center gap-3 rounded-[8px] border border-border/50 bg-white px-4 py-3 shadow-minimal-flat"
                      key={directory}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-border/45 bg-[color-mix(in_srgb,var(--foreground)_2%,white)]">
                          <AgentIcon
                            agentIcon={sourceIcon}
                            agentId={agentInfo.agentId}
                            agentName={agentInfo.agentName}
                            size={14}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-foreground/82">{agentInfo.agentName}</div>
                          <div className="mt-0.5 truncate text-[12px] text-foreground/52">{directory}</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                          disabled={inputDisabled}
                          onClick={() => handleChooseIcon(directory)}
                          type="button"
                        >
                          更换图标
                        </button>
                        {sourceIcon ? (
                          <button
                            className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                            disabled={inputDisabled}
                            onClick={() => onSaveSourceIcon(directory, null)}
                            type="button"
                          >
                            重置
                          </button>
                        ) : null}
                        <button
                          className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                          disabled={inputDisabled}
                          onClick={() => onRemoveDirectory(directory)}
                          type="button"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[12px] font-medium text-foreground/70">
                已安装 Agent · {installedBuiltInDirectories.length} 个
              </div>
            </div>
            <div className="space-y-2">
              {installedBuiltInDirectories.length === 0 ? (
                <div className="rounded-[8px] border border-border/50 bg-white px-4 py-3 text-[12px] text-foreground/52 shadow-minimal-flat">
                  暂未检测到已安装的内置 Agent。
                </div>
              ) : (
                installedBuiltInDirectories.map((directory) => {
                  const sourceIcon = sourceIcons[directory.directory]

                  return (
                    <div
                      className="flex items-center gap-3 rounded-[8px] border border-border/50 bg-white px-4 py-3 shadow-minimal-flat"
                      key={directory.directory}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-border/45 bg-[color-mix(in_srgb,var(--foreground)_2%,white)]">
                          <AgentIcon
                            agentIcon={sourceIcon}
                            agentId={directory.agentId}
                            agentName={directory.agentName}
                            size={14}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-foreground/82">{directory.agentName}</div>
                          <div className="mt-0.5 truncate text-[12px] text-foreground/52">{directory.directory}</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                          disabled={inputDisabled || !directory.scanEnabled}
                          onClick={() => handleChooseIcon(directory.directory)}
                          type="button"
                        >
                          更换图标
                        </button>
                        {sourceIcon ? (
                          <button
                            className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                            disabled={inputDisabled}
                            onClick={() => onSaveSourceIcon(directory.directory, null)}
                            type="button"
                          >
                            重置
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[12px] font-medium text-foreground/70">
                未安装内置 Agent · {unavailableBuiltInDirectories.length} 个
              </div>
              <button
                aria-expanded={isUnavailableExpanded}
                className="cursor-pointer text-[11px] text-foreground/45 transition-colors hover:text-foreground"
                onClick={() => setIsUnavailableExpanded((isExpanded) => !isExpanded)}
                type="button"
              >
                {isUnavailableExpanded ? '收起' : '展开'}
              </button>
            </div>
            {isUnavailableExpanded ? (
              <div className="space-y-2">
                {unavailableBuiltInDirectories.map((directory) => (
                  <div
                    className="flex items-center gap-3 rounded-[8px] border border-border/35 bg-white/64 px-4 py-3 text-foreground/45 shadow-minimal-flat"
                    key={directory.directory}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-border/35 bg-white/50">
                        <AgentIcon
                          agentIcon={null}
                          agentId={directory.agentId}
                          agentName={directory.agentName}
                          size={14}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium">{directory.agentName}</div>
                        <div className="mt-0.5 truncate text-[12px]">{directory.directory}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {feedbackMessage ? <p className="mt-3 text-[12px] text-foreground/52">{feedbackMessage}</p> : null}
      </section>
    </div>
  )
}
