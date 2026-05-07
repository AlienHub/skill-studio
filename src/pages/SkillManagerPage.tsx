import { useCallback, useEffect, useMemo, useState } from 'react'
import { appVersion, initialSkillManagerState } from 'virtual:skill-manager-state'
import { AgentSkillConfigPanel } from '../components/skill-manager/AgentSkillConfigPanel'
import { AppSettingsPanel } from '../components/skill-manager/AppSettingsPanel'
import { SkillDetailPanel } from '../components/skill-manager/SkillDetailPanel'
import { SkillSidebar } from '../components/skill-manager/SkillSidebar'
import {
  checkForUpdates,
  fetchSkillManagerState,
  installUpdateAndRelaunch,
  openExternalUrl,
  saveConfiguredDirectories,
  saveSourceIcon,
} from '../skill-manager/api'
import { buildSkillGroups } from '../skill-manager/skillGrouping'
import {
  type SkillGroup,
  type SkillManagerState,
  type SourceIcon,
  type UpdateCheckState,
  type UpdateCheckStatus,
  type UpdateInstallStatus,
} from '../skill-manager/types'

type SelectedPanel = 'skill' | 'agent-skill-config' | 'settings'

function filterSkillGroups(skillGroups: SkillGroup[], queryValue: string) {
  const query = queryValue.trim().toLowerCase()
  if (!query) {
    return skillGroups
  }

  return skillGroups.filter((group) => {
    const haystack = group.skills
      .map((skill) => `${skill.name} ${skill.slug} ${skill.description} ${skill.location} ${skill.sourceDirectory}`)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}

export function SkillManagerPage() {
  const [skillState, setSkillState] = useState<SkillManagerState>(initialSkillManagerState)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(
    initialSkillManagerState.skills[0]?.id ?? null
  )
  const [selectedPanel, setSelectedPanel] = useState<SelectedPanel>('skill')
  const [isSavingDirectories, setIsSavingDirectories] = useState(false)
  const [directoryFeedbackMessage, setDirectoryFeedbackMessage] = useState<string | null>(null)
  const [skillSearchQuery, setSkillSearchQuery] = useState('')
  const [updateCheckStatus, setUpdateCheckStatus] = useState<UpdateCheckStatus>('idle')
  const [updateCheckState, setUpdateCheckState] = useState<UpdateCheckState | null>(null)
  const [updateCheckError, setUpdateCheckError] = useState<string | null>(null)
  const [updateInstallStatus, setUpdateInstallStatus] = useState<UpdateInstallStatus>('idle')
  const [updateInstallError, setUpdateInstallError] = useState<string | null>(null)

  const skillGroups = useMemo(() => buildSkillGroups(skillState.skills), [skillState.skills])
  const multiSourceGroupCount = useMemo(
    () => skillGroups.filter((group) => group.sourceCount > 1).length,
    [skillGroups]
  )
  const filteredSkillGroups = useMemo(
    () => filterSkillGroups(skillGroups, skillSearchQuery),
    [skillGroups, skillSearchQuery]
  )

  const selectedSkillGroup = useMemo(
    () =>
      skillGroups.find((group) => group.skills.some((skill) => skill.id === selectedSkillId)) ??
      skillGroups[0] ??
      null,
    [selectedSkillId, skillGroups]
  )

  const selectedSkill = useMemo(
    () =>
      selectedSkillGroup?.skills.find((skill) => skill.id === selectedSkillId) ??
      selectedSkillGroup?.primarySkill ??
      null,
    [selectedSkillGroup, selectedSkillId]
  )

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

  const handleCheckForUpdates = useCallback(async () => {
    setUpdateCheckStatus('checking')
    setUpdateCheckError(null)

    try {
      const nextUpdateCheck = await checkForUpdates()
      setUpdateCheckState(nextUpdateCheck)
      setUpdateCheckStatus('ready')
    } catch {
      setUpdateCheckStatus('error')
      setUpdateCheckError('无法连接 GitHub Release，请稍后重试。')
    }
  }, [])

  const handleOpenExternalUrl = useCallback((url: string) => {
    void openExternalUrl(url)
  }, [])

  const handleInstallUpdate = useCallback(async () => {
    setUpdateInstallStatus('installing')
    setUpdateInstallError(null)

    try {
      await installUpdateAndRelaunch()
    } catch {
      setUpdateInstallStatus('error')
      setUpdateInstallError('自动更新包暂不可用，请下载 DMG 手动安装。')
    }
  }, [])

  useEffect(() => {
    void handleCheckForUpdates()
  }, [handleCheckForUpdates])

  useEffect(() => {
    if (selectedPanel !== 'skill') {
      return
    }

    if (
      !selectedSkillId ||
      !skillGroups.some((group) => group.skills.some((skill) => skill.id === selectedSkillId))
    ) {
      setSelectedSkillId(skillGroups[0]?.primarySkill.id ?? null)
    }
  }, [selectedPanel, selectedSkillId, skillGroups])

  const updateDirectories = async (directories: string[]) => {
    setIsSavingDirectories(true)
    setDirectoryFeedbackMessage(null)
    try {
      const nextState = await saveConfiguredDirectories(directories)
      setSkillState(nextState)
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
    } finally {
      setIsSavingDirectories(false)
    }
  }

  const handleRemoveDirectory = async (directory: string) => {
    await updateDirectories(
      skillState.userConfiguredDirectories.filter((configuredDirectory) => configuredDirectory !== directory)
    )
  }

  const handleChooseDirectory = async (directory: string) => {
    if (!directory) {
      setDirectoryFeedbackMessage('当前环境没有返回真实文件夹路径，请重新选择文件夹。')
      return
    }

    setDirectoryFeedbackMessage(`已选中文件夹：${directory}`)
    await updateDirectories([...skillState.userConfiguredDirectories, directory])
  }

  const handleSaveSourceIcon = (directory: string, icon: SourceIcon | null) => {
    setIsSavingDirectories(true)
    setDirectoryFeedbackMessage(icon ? '正在更新来源图标…' : '正在重置来源图标…')

    void saveSourceIcon(directory, icon)
      .then((nextState) => {
        setSkillState(nextState)
        setDirectoryFeedbackMessage(icon ? '来源图标已更新。' : '来源图标已重置。')
      })
      .catch(() => {
        setDirectoryFeedbackMessage('来源图标更新失败，请稍后重试。')
      })
      .finally(() => {
        setIsSavingDirectories(false)
      })
  }

  const handleSelectSkillGroup = (group: SkillGroup) => {
    setSelectedPanel('skill')
    setSelectedSkillId(group.primarySkill.id)
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-[14px] text-foreground">
      <main className="mx-auto h-screen max-w-[1440px] px-4 py-5 sm:px-6">
        <div className="grid h-full gap-2 lg:grid-cols-[240px_minmax(0,1fr)]">
          <SkillSidebar
            filteredSkillGroups={filteredSkillGroups}
            multiSourceGroupCount={multiSourceGroupCount}
            selectedGroupId={selectedSkillGroup?.id ?? null}
            selectedPanel={selectedPanel}
            skillGroups={skillGroups}
            skillSearchQuery={skillSearchQuery}
            onSearchChange={setSkillSearchQuery}
            onSelectAgentSkillConfig={() => setSelectedPanel('agent-skill-config')}
            onSelectSettings={() => setSelectedPanel('settings')}
            onSelectSkillGroup={handleSelectSkillGroup}
          />

          {selectedPanel === 'agent-skill-config' ? (
            <AgentSkillConfigPanel
              builtInDirectories={skillState.builtInDirectories}
              configuredDirectories={skillState.configuredDirectories}
              feedbackMessage={directoryFeedbackMessage}
              inputDisabled={isSavingDirectories}
              sourceIcons={skillState.sourceIcons}
              skillCount={skillGroups.length}
              userConfiguredDirectories={skillState.userConfiguredDirectories}
              onRefresh={handleRefresh}
              onRemoveDirectory={handleRemoveDirectory}
              onSaveSourceIcon={handleSaveSourceIcon}
              onSetFeedbackMessage={setDirectoryFeedbackMessage}
              onSelectDirectory={handleChooseDirectory}
            />
          ) : selectedPanel === 'settings' ? (
            <AppSettingsPanel
              currentVersion={appVersion}
              updateCheck={updateCheckState}
              updateCheckError={updateCheckError}
              updateCheckStatus={updateCheckStatus}
              updateInstallError={updateInstallError}
              updateInstallStatus={updateInstallStatus}
              onCheckForUpdates={handleCheckForUpdates}
              onInstallUpdate={handleInstallUpdate}
              onOpenExternalUrl={handleOpenExternalUrl}
            />
          ) : selectedSkill && selectedSkillGroup ? (
            <SkillDetailPanel
              openDirectoryTargets={skillState.openDirectoryTargets}
              selectedSkill={selectedSkill}
              selectedSkillGroup={selectedSkillGroup}
              onSelectSkill={setSelectedSkillId}
            />
          ) : null}
        </div>
      </main>
    </div>
  )
}
