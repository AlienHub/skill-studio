import { useEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  initialSkillManagerState,
  skillManagerApiBase,
} from 'virtual:skill-manager-state'

type SkillManagerState = typeof initialSkillManagerState
type Skill = SkillManagerState['skills'][number]

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function formatMetadataLabel(key: string) {
  const labels: Record<string, string> = {
    cli_version: 'CLI 版本',
    license: '许可证',
    version: '版本',
    author: '作者',
    metadata: '附加元数据',
  }

  return labels[key] ?? key
}

function buildMetadataRows(skill: Skill) {
  const reservedKeys = new Set(['name', 'description'])
  const extraRows = Object.entries(skill.metadata)
    .filter(([key]) => !reservedKeys.has(key))
    .map(([key, value]) => ({
      label: formatMetadataLabel(key),
      value: formatValue(value),
    }))

  return [
    { label: '标识符', value: skill.slug },
    { label: '名称', value: skill.name },
    { label: '描述', value: skill.description || '—' },
    { label: '发现目录', value: skill.sourceDirectory },
    { label: '位置', value: skill.location },
    ...extraRows,
  ]
}

function SkillMetadataTable({ skill }: { skill: Skill }) {
  const rows = useMemo(() => buildMetadataRows(skill), [skill])

  return (
    <div className="overflow-hidden rounded-[8px] border border-border/50 bg-white shadow-minimal-flat">
      <dl className="divide-y divide-border/50">
        {rows.map((row) => (
          <div
            className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 px-4 py-3 sm:grid-cols-[96px_minmax(0,1fr)]"
            key={row.label}
          >
            <dt className="text-[12px] text-foreground/48">{row.label}</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-words text-[14px] text-foreground/84">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function SkillInstructions({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <div className="rounded-[8px] border border-border/50 bg-white px-5 py-6 text-[12px] text-foreground/56 shadow-minimal-flat">
        暂无说明内容。
      </div>
    )
  }

  return (
    <div className="rounded-[8px] border border-border/50 bg-white px-5 py-5 shadow-minimal-flat">
      <article className="prose max-w-none text-[14px] leading-6 text-foreground/84 prose-headings:text-[14px] prose-headings:font-semibold prose-headings:text-foreground prose-p:text-[14px] prose-p:text-foreground/84 prose-li:text-[14px] prose-li:text-foreground/84 prose-strong:text-foreground prose-code:text-[13px] prose-code:text-foreground prose-pre:overflow-x-auto prose-pre:rounded-[8px] prose-pre:bg-[#f6f6f7]">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}

async function fetchSkillManagerState() {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('load_skill_manager_state')
  }

  const response = await fetch(`${skillManagerApiBase}/state`)
  if (!response.ok) {
    throw new Error('Failed to load skill manager state')
  }

  return (await response.json()) as SkillManagerState
}

async function saveConfiguredDirectories(directories: string[]) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('save_configured_directories', { directories })
  }

  const response = await fetch(`${skillManagerApiBase}/directories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directories }),
  })

  if (!response.ok) {
    throw new Error('Failed to update configured directories')
  }

  return (await response.json()) as SkillManagerState
}

function normalizeSelectedDirectoryPath(path: string, webkitRelativePath?: string) {
  if (!path) {
    return ''
  }

  if (!webkitRelativePath) {
    return path
  }

  const normalizedFilePath = path.replace(/\\/g, '/')
  const normalizedRelativePath = webkitRelativePath.replace(/\\/g, '/')
  const rootDirectoryName = normalizedRelativePath.split('/')[0]
  if (!rootDirectoryName) {
    return path
  }

  const marker = `/${rootDirectoryName}/`
  const markerIndex = normalizedFilePath.indexOf(marker)

  if (markerIndex === -1) {
    return path
  }

  return normalizedFilePath.slice(0, markerIndex + rootDirectoryName.length + 1)
}

function SkillDirectoryConfig({
  configuredDirectories,
  skillCount,
  inputDisabled,
  feedbackMessage,
  onRemoveDirectory,
  onRefresh,
  onSelectDirectory,
}: {
  configuredDirectories: string[]
  skillCount: number
  inputDisabled: boolean
  feedbackMessage: string | null
  onRemoveDirectory: (directory: string) => void
  onRefresh: () => void
  onSelectDirectory: (directory: string) => void
}) {
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const scanButtonLabel = inputDisabled ? '扫描中…' : '重新扫描'
  const chooseButtonLabel = inputDisabled ? '处理中…' : '选择文件夹'

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

        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">扫描目录</h3>
            <p className="mt-1 text-[12px] text-foreground/52">
              管理需要扫描的 skill 根目录，当前发现 {skillCount} 个 skill
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

        <div className="space-y-2">
          {configuredDirectories.length === 0 ? (
            <div className="rounded-[8px] border border-border/50 bg-white px-4 py-3 text-[12px] text-foreground/52 shadow-minimal-flat">
              暂无扫描目录，请先选择一个文件夹。
            </div>
          ) : (
            configuredDirectories.map((directory) => (
              <div
                className="flex items-center gap-3 rounded-[8px] border border-border/50 bg-white px-4 py-3 shadow-minimal-flat"
                key={directory}
              >
                <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/72">
                  {directory}
                </span>
                <button
                  className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground"
                  onClick={() => onRemoveDirectory(directory)}
                  type="button"
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>

        {feedbackMessage ? <p className="mt-3 text-[12px] text-foreground/52">{feedbackMessage}</p> : null}
      </section>
    </div>
  )
}

function SettingsEntry({
  isSelected,
  onClick,
}: {
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      className="w-full cursor-pointer text-left"
      onClick={onClick}
      type="button"
    >
      <div
        className={`rounded-[8px] px-4 py-3 transition-colors ${
          isSelected
            ? 'bg-[color-mix(in_srgb,var(--foreground)_3%,var(--background))]'
            : 'bg-transparent hover:bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))]'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            className="size-4 shrink-0 text-foreground/62"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M10.325 4.317a1.724 1.724 0 0 1 3.35 0 1.724 1.724 0 0 0 2.573 1.066 1.724 1.724 0 0 1 2.898 1.93 1.724 1.724 0 0 0 .75 2.692 1.724 1.724 0 0 1 0 2.99 1.724 1.724 0 0 0-.75 2.692 1.724 1.724 0 0 1-2.898 1.93 1.724 1.724 0 0 0-2.573 1.066 1.724 1.724 0 0 1-3.35 0 1.724 1.724 0 0 0-2.573-1.066 1.724 1.724 0 0 1-2.898-1.93 1.724 1.724 0 0 0-.75-2.692 1.724 1.724 0 0 1 0-2.99 1.724 1.724 0 0 0 .75-2.692 1.724 1.724 0 0 1 2.898-1.93 1.724 1.724 0 0 0 2.573-1.066Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
          <h2 className="text-[14px] font-normal text-foreground">设置</h2>
        </div>
      </div>
    </button>
  )
}

export function SkillManagerPage() {
  const [skillState, setSkillState] = useState<SkillManagerState>(initialSkillManagerState)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(
    initialSkillManagerState.skills[0]?.id ?? null
  )
  const [selectedPanel, setSelectedPanel] = useState<'skill' | 'settings'>('skill')
  const [isSavingDirectories, setIsSavingDirectories] = useState(false)
  const [directoryFeedbackMessage, setDirectoryFeedbackMessage] = useState<string | null>(null)
  const [skillSearchQuery, setSkillSearchQuery] = useState('')

  useEffect(() => {
    let isMounted = true

    fetchSkillManagerState()
      .then((state) => {
        if (!isMounted) {
          return
        }

        setSkillState(state)
      })
      .catch(() => {
        // Keep build-time fallback state when the API is unavailable.
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedSkillId || !skillState.skills.some((skill) => skill.id === selectedSkillId)) {
      setSelectedSkillId(skillState.skills[0]?.id ?? null)
    }
  }, [selectedSkillId, skillState.skills])

  const filteredSkills = useMemo(() => {
    const query = skillSearchQuery.trim().toLowerCase()
    if (!query) {
      return skillState.skills
    }

    return skillState.skills.filter((skill) => {
      const haystack = `${skill.name} ${skill.slug} ${skill.description} ${skill.location}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [skillSearchQuery, skillState.skills])

  const selectedSkill = useMemo(
    () => skillState.skills.find((skill) => skill.id === selectedSkillId) ?? skillState.skills[0] ?? null,
    [selectedSkillId, skillState.skills]
  )

  const updateDirectories = async (directories: string[]) => {
    setIsSavingDirectories(true)
    try {
      const nextState = await saveConfiguredDirectories(directories)
      setSkillState(nextState)
      setDirectoryFeedbackMessage(`已重新扫描，发现 ${nextState.skills.length} 个 skill。`)
    } finally {
      setIsSavingDirectories(false)
    }
  }

  const handleRefresh = async () => {
    setIsSavingDirectories(true)
    setDirectoryFeedbackMessage(null)
    try {
      const nextState = await fetchSkillManagerState()
      setSkillState(nextState)
      setDirectoryFeedbackMessage(`扫描完成，发现 ${nextState.skills.length} 个 skill。`)
    } finally {
      setIsSavingDirectories(false)
    }
  }

  const handleRemoveDirectory = async (directory: string) => {
    await updateDirectories(
      skillState.configuredDirectories.filter((configuredDirectory) => configuredDirectory !== directory)
    )
  }

  const handleChooseDirectory = async (directory: string) => {
    if (!directory) {
      setDirectoryFeedbackMessage('当前环境没有返回真实文件夹路径，请重新选择文件夹。')
      return
    }

    setDirectoryFeedbackMessage(`已选中文件夹：${directory}`)
    await updateDirectories([...skillState.configuredDirectories, directory])
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-[14px] text-foreground">
      <header
        className="titlebar-drag-region flex h-[44px] items-center border-b border-border/50 bg-background pl-[86px] pr-4"
        data-tauri-drag-region
      >
        <h1 className="select-none text-[13px] font-semibold text-foreground/72">Skill Studio</h1>
      </header>
      <main className="mx-auto h-[calc(100vh-44px)] max-w-[1440px] px-4 py-6 sm:px-6">
        <div className="grid h-full gap-2 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="flex h-full flex-col overflow-hidden rounded-[8px] bg-white shadow-minimal">
            <div className="border-b border-border/50 px-4 py-4">
              <div className="flex items-end justify-between gap-3">
                <h1 className="text-[14px] font-semibold text-foreground">所有技能</h1>
                <span className="text-[12px] text-foreground/45">
                  {filteredSkills.length === skillState.skills.length
                    ? `${skillState.skills.length} 个`
                    : `${filteredSkills.length}/${skillState.skills.length}`}
                </span>
              </div>
              <input
                className="mt-3 h-8 w-full rounded-[8px] border border-border/50 bg-[color-mix(in_srgb,var(--foreground)_2%,white)] px-3 text-[12px] text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground/18"
                onChange={(event) => setSkillSearchQuery(event.target.value)}
                placeholder="搜索名称、描述或路径"
                type="search"
                value={skillSearchQuery}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {skillState.skills.length === 0 ? (
                <div className="px-4 py-6 text-[12px] text-foreground/56">没有在当前目录中发现可用 skill。</div>
              ) : filteredSkills.length === 0 ? (
                <div className="px-4 py-6 text-[12px] text-foreground/56">没有匹配的 skill。</div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {filteredSkills.map((skill) => {
                    const isSelected = selectedPanel === 'skill' && skill.id === selectedSkill?.id

                    return (
                      <li
                        className={`relative px-3 py-1.5 ${isSelected ? 'before:absolute before:inset-y-1.5 before:left-0 before:w-[2px] before:rounded-full before:bg-[#8d7cff]' : ''}`}
                        key={skill.id}
                      >
                        <button
                          className="relative w-full cursor-pointer text-left"
                          onClick={() => {
                            setSelectedPanel('skill')
                            setSelectedSkillId(skill.id)
                          }}
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
                              <h2 className="truncate text-[14px] font-semibold text-foreground">
                                {skill.name}
                              </h2>
                              <p className="mt-1 truncate text-[12px] text-foreground/52">
                                {skill.description || '—'}
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
              <div className="relative">
                <SettingsEntry
                  isSelected={selectedPanel === 'settings'}
                  onClick={() => setSelectedPanel('settings')}
                />
              </div>
            </div>
          </aside>

          {selectedPanel === 'settings' ? (
            <section className="overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-5 shadow-minimal">
              <div className="mb-6">
                <p className="text-[12px] text-foreground/52">settings</p>
              </div>

              <div className="mb-8 rounded-[8px]">
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold text-foreground">Skill 扫描设置</h2>
                  <p className="mt-2 text-[14px] leading-7 text-foreground/56">
                    配置需要扫描的 skill 根目录。选择、删除或重新扫描后会立即刷新左侧列表。
                  </p>
                </div>
              </div>

              <SkillDirectoryConfig
                configuredDirectories={skillState.configuredDirectories}
                feedbackMessage={directoryFeedbackMessage}
                inputDisabled={isSavingDirectories}
                skillCount={skillState.skills.length}
                onRefresh={handleRefresh}
                onRemoveDirectory={handleRemoveDirectory}
                onSelectDirectory={handleChooseDirectory}
              />
            </section>
          ) : selectedSkill ? (
            <section className="overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-5 shadow-minimal">
              <div className="mb-6">
                <p className="text-[12px] text-foreground/52">{selectedSkill.slug}</p>
              </div>

              <div className="mb-8 rounded-[8px]">
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold text-foreground">{selectedSkill.name}</h2>
                  <p className="mt-2 line-clamp-2 text-[14px] leading-7 text-foreground/56">
                    {selectedSkill.description || '暂无描述。'}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <div className="mb-4">
                    <h3 className="text-[14px] font-semibold text-foreground">元数据</h3>
                  </div>
                  <SkillMetadataTable skill={selectedSkill} />
                </section>

                <section>
                  <div className="mb-4">
                    <h3 className="text-[14px] font-semibold text-foreground">说明</h3>
                  </div>
                  <SkillInstructions content={selectedSkill.content} />
                </section>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  )
}
