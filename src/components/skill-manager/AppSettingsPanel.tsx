import {
  type UpdateCheckState,
  type UpdateCheckStatus,
  type UpdateInstallStatus,
} from '../../skill-manager/types'
import { VersionUpdatePanel } from './VersionUpdatePanel'

export function AppSettingsPanel({
  currentVersion,
  updateCheck,
  updateCheckError,
  updateCheckStatus,
  updateInstallError,
  updateInstallStatus,
  onCheckForUpdates,
  onInstallUpdate,
  onOpenExternalUrl,
}: {
  currentVersion: string
  updateCheck: UpdateCheckState | null
  updateCheckError: string | null
  updateCheckStatus: UpdateCheckStatus
  updateInstallError: string | null
  updateInstallStatus: UpdateInstallStatus
  onCheckForUpdates: () => void
  onInstallUpdate: () => void
  onOpenExternalUrl: (url: string) => void
}) {
  return (
    <section className="overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-5 shadow-minimal">
      <div className="mb-6">
        <p className="text-[12px] text-foreground/52">settings</p>
      </div>

      <div className="mb-8 rounded-[8px]">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-foreground">设置</h2>
          <p className="mt-2 text-[14px] leading-7 text-foreground/56">
            查看应用版本，并检查 GitHub Release 中是否有可用更新。
          </p>
        </div>
      </div>

      <VersionUpdatePanel
        currentVersion={currentVersion}
        updateCheck={updateCheck}
        updateCheckError={updateCheckError}
        updateCheckStatus={updateCheckStatus}
        updateInstallError={updateInstallError}
        updateInstallStatus={updateInstallStatus}
        onCheckForUpdates={onCheckForUpdates}
        onInstallUpdate={onInstallUpdate}
        onOpenExternalUrl={onOpenExternalUrl}
      />
    </section>
  )
}
