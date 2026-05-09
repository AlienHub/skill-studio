import { useCallback, useEffect, useMemo, useState } from 'react'
import { appVersion, initialSkillManagerState } from 'virtual:skill-manager-state'
import { AgentSkillConfigPanel } from '../components/skill-manager/AgentSkillConfigPanel'
import { AppSettingsPanel } from '../components/skill-manager/AppSettingsPanel'
import { LibraryHomePanel } from '../components/skill-manager/LibraryHomePanel'
import { SkillDetailPanel } from '../components/skill-manager/SkillDetailPanel'
import { SkillSidebar } from '../components/skill-manager/SkillSidebar'
import {
  checkForUpdates,
  fetchSkillManagerState,
  installUpdateAndRelaunch,
  openExternalUrl,
  removeSkillSource,
  createSkillSymlink,
  exportSkillZip,
  saveConfiguredDirectories,
  saveSourceIcon,
  convertSkillSourceToSymlink,
} from '../skill-manager/api'
import { buildSkillGroups } from '../skill-manager/skillGrouping'
import { useAppPreferences } from '../skill-manager/preferences'
import {
  readLibraryActivity,
  recordRecentlyViewedSkill,
  sortSkillGroupsByActivity,
  togglePinnedSkill,
  writeLibraryActivity,
  type LibraryActivityState,
} from '../skill-manager/libraryActivity'
import {
  groupMatchesLibraryFilter,
  readAndStoreLibraryVisitState,
} from '../skill-manager/libraryInsights'
import { buildAgentCatalogProfiles } from '../skill-manager/catalogProfiles'
import {
  type AgentCatalogProfile,
  type Skill,
  type LibraryFilter,
  type LibraryVisitState,
  type SkillGroup,
  type SkillManagerState,
  type SourceIcon,
  type UpdateCheckState,
  type UpdateCheckStatus,
  type UpdateInstallStatus,
} from '../skill-manager/types'

type SelectedPanel = 'home' | 'skill' | 'agent-skill-config' | 'settings'

const emptyLibraryVisitState: LibraryVisitState = {
  capturedAt: null,
  previousCapturedAt: null,
  hasPreviousSnapshot: false,
  changes: [],
  changesBySkillId: {},
  suggestions: [],
  suggestionsBySkillId: {},
}

const emptyLibraryActivityState: LibraryActivityState = {
  pinnedSkillIds: [],
  recentlyViewedSkillIds: [],
}

function filterSkillGroups(
  skillGroups: SkillGroup[],
  queryValue: string,
  activeFilter: LibraryFilter,
  visitState: LibraryVisitState
) {
  const query = queryValue.trim().toLowerCase()
  const filterMatchedGroups = skillGroups.filter((group) =>
    groupMatchesLibraryFilter(group, activeFilter, visitState)
  )

  if (!query) {
    return filterMatchedGroups
  }

  return filterMatchedGroups.filter((group) => {
    const haystack = group.skills
      .map((skill) => `${skill.name} ${skill.slug} ${skill.description} ${skill.location} ${skill.sourceDirectory}`)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}

export function SkillManagerPage() {
  const { t } = useAppPreferences()
  const [skillState, setSkillState] = useState<SkillManagerState>(initialSkillManagerState)
  const [hasLoadedSkillState, setHasLoadedSkillState] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(
    initialSkillManagerState.skills[0]?.id ?? null
  )
  const [selectedPanel, setSelectedPanel] = useState<SelectedPanel>('home')
  const [isSavingDirectories, setIsSavingDirectories] = useState(false)
  const [directoryFeedbackMessage, setDirectoryFeedbackMessage] = useState<string | null>(null)
  const [skillSearchQuery, setSkillSearchQuery] = useState('')
  const [activeLibraryFilter, setActiveLibraryFilter] = useState<LibraryFilter>('all')
  const [libraryVisitState, setLibraryVisitState] = useState<LibraryVisitState>(emptyLibraryVisitState)
  const [libraryActivity, setLibraryActivity] = useState<LibraryActivityState>(emptyLibraryActivityState)
  const [updateCheckStatus, setUpdateCheckStatus] = useState<UpdateCheckStatus>('idle')
  const [updateCheckState, setUpdateCheckState] = useState<UpdateCheckState | null>(null)
  const [updateCheckError, setUpdateCheckError] = useState<string | null>(null)
  const [updateInstallStatus, setUpdateInstallStatus] = useState<UpdateInstallStatus>('idle')
  const [updateInstallError, setUpdateInstallError] = useState<string | null>(null)

  const skillGroups = useMemo(
    () => sortSkillGroupsByActivity(buildSkillGroups(skillState.skills), libraryActivity),
    [libraryActivity, skillState.skills]
  )
  const catalogProfiles: AgentCatalogProfile[] = useMemo(
    () => buildAgentCatalogProfiles(skillState.skills),
    [skillState.skills]
  )
  const multiSourceGroupCount = useMemo(
    () => skillGroups.filter((group) => group.sourceCount > 1).length,
    [skillGroups]
  )
  const filteredSkillGroups = useMemo(
    () => filterSkillGroups(skillGroups, skillSearchQuery, activeLibraryFilter, libraryVisitState),
    [activeLibraryFilter, libraryVisitState, skillGroups, skillSearchQuery]
  )
  const hasPendingUpdate = Boolean(updateCheckState?.hasUpdate)

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
        setHasLoadedSkillState(true)
      })
      .catch(() => {
        // Keep build-time fallback state when the API is unavailable.
        if (isMounted) {
          setHasLoadedSkillState(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setLibraryActivity(readLibraryActivity())
  }, [])

  useEffect(() => {
    if (!hasLoadedSkillState) {
      return
    }

    setLibraryVisitState(readAndStoreLibraryVisitState(skillGroups))
  }, [hasLoadedSkillState, skillGroups])

  const handleCheckForUpdates = useCallback(async () => {
    setUpdateCheckStatus('checking')
    setUpdateCheckError(null)

    try {
      const nextUpdateCheck = await checkForUpdates()
      setUpdateCheckState(nextUpdateCheck)
      setUpdateCheckStatus('ready')
    } catch {
      setUpdateCheckStatus('error')
      setUpdateCheckError(t('updates.connectionError'))
    }
  }, [t])

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
      setUpdateInstallError(t('updates.installError'))
    }
  }, [t])

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
      setDirectoryFeedbackMessage(t('directories.noFolderPath'))
      return
    }

    setDirectoryFeedbackMessage(t('directories.selectedFolder', { directory }))
    await updateDirectories([...skillState.userConfiguredDirectories, directory])
  }

  const handleSaveSourceIcon = (directory: string, icon: SourceIcon | null) => {
    setIsSavingDirectories(true)
    setDirectoryFeedbackMessage(icon ? t('directories.updatingIcon') : t('directories.resettingIcon'))

    void saveSourceIcon(directory, icon)
      .then((nextState) => {
        setSkillState(nextState)
        setDirectoryFeedbackMessage(icon ? t('directories.iconUpdated') : t('directories.iconReset'))
      })
      .catch(() => {
        setDirectoryFeedbackMessage(t('directories.iconUpdateFailed'))
      })
      .finally(() => {
        setIsSavingDirectories(false)
      })
  }

  const handleSelectSkillGroup = (group: SkillGroup) => {
    setSelectedPanel('skill')
    setSelectedSkillId(group.primarySkill.id)
    setLibraryActivity((currentActivity) => {
      const nextActivity = recordRecentlyViewedSkill(currentActivity, group.id)
      writeLibraryActivity(nextActivity)
      return nextActivity
    })
  }

  const handleTogglePinnedSkill = (group: SkillGroup) => {
    setLibraryActivity((currentActivity) => {
      const nextActivity = togglePinnedSkill(currentActivity, group.id)
      writeLibraryActivity(nextActivity)
      return nextActivity
    })
  }

  const handleRemoveSkillSource = useCallback(async (skill: Skill) => {
    const nextState = await removeSkillSource(skill.skillDirectory)
    setSkillState(nextState)
  }, [])

  const handleCreateSkillSymlink = useCallback(async (skill: Skill, targetSourceDirectory: string) => {
    const nextState = await createSkillSymlink(skill.skillDirectory, targetSourceDirectory)
    setSkillState(nextState)
  }, [])

  const handleConvertSkillSourceToSymlink = useCallback(async (skill: Skill, targetSkill: Skill) => {
    const nextState = await convertSkillSourceToSymlink(skill.skillDirectory, targetSkill.skillDirectory)
    setSkillState(nextState)
  }, [])

  const handleExportSkillZip = useCallback(async (skill: Skill) => {
    await exportSkillZip(skill.skillDirectory, skill.slug || skill.name)
  }, [])

  return (
    <div className="h-screen overflow-hidden bg-background text-[14px] text-foreground">
      <main className="mx-auto h-screen max-w-[1440px] px-4 py-5 sm:px-6">
        {selectedPanel === 'home' ? (
          <div className="h-full">
            <LibraryHomePanel
              catalogProfiles={catalogProfiles}
              skillGroups={skillGroups}
              visitState={libraryVisitState}
              onOpenAgentSkillConfig={() => setSelectedPanel('agent-skill-config')}
              onOpenSettings={() => setSelectedPanel('settings')}
              onSelectSkillGroup={handleSelectSkillGroup}
            />
          </div>
        ) : (
          <div className="grid h-full gap-2 lg:grid-cols-[240px_minmax(0,1fr)]">
            <SkillSidebar
              activeFilter={activeLibraryFilter}
              filteredSkillGroups={filteredSkillGroups}
              hasPendingUpdate={hasPendingUpdate}
              multiSourceGroupCount={multiSourceGroupCount}
              selectedGroupId={selectedSkillGroup?.id ?? null}
              selectedPanel={selectedPanel}
              skillGroups={skillGroups}
              skillSearchQuery={skillSearchQuery}
              visitState={libraryVisitState}
              pinnedSkillIds={libraryActivity.pinnedSkillIds}
              onFilterChange={setActiveLibraryFilter}
              onSearchChange={setSkillSearchQuery}
              onSelectHome={() => setSelectedPanel('home')}
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
                openDirectoryTargets={skillState.openDirectoryTargets}
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
                configuredDirectories={skillState.configuredDirectories}
                openDirectoryTargets={skillState.openDirectoryTargets}
                recentChanges={libraryVisitState.changesBySkillId[selectedSkillGroup.id] ?? []}
                isPinned={libraryActivity.pinnedSkillIds.includes(selectedSkillGroup.id)}
                selectedSkill={selectedSkill}
                selectedSkillGroup={selectedSkillGroup}
                onCreateSymlink={handleCreateSkillSymlink}
                onExportZip={handleExportSkillZip}
                onRemoveSource={handleRemoveSkillSource}
                onSelectSkill={setSelectedSkillId}
                onConvertToSymlink={handleConvertSkillSourceToSymlink}
                onTogglePinned={() => handleTogglePinnedSkill(selectedSkillGroup)}
              />
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
}
