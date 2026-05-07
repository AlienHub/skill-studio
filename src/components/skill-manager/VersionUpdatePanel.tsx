import {
  type UpdateCheckState,
  type UpdateCheckStatus,
  type UpdateInstallStatus,
} from '../../skill-manager/types'

function formatCheckedAt(value: string) {
  const checkedAt = new Date(value)
  if (Number.isNaN(checkedAt.getTime())) {
    return null
  }

  return checkedAt.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function VersionUpdatePanel({
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
  const isChecking = updateCheckStatus === 'checking'
  const isInstalling = updateInstallStatus === 'installing'
  const latestVersion = updateCheck?.latestVersion ? `v${updateCheck.latestVersion}` : null
  const checkedAt = updateCheck ? formatCheckedAt(updateCheck.checkedAt) : null
  const handleOpenAsset = () => {
    if (updateCheck?.assetUrl) {
      onOpenExternalUrl(updateCheck.assetUrl)
    }
  }
  const handleOpenRelease = () => {
    if (updateCheck?.releaseUrl) {
      onOpenExternalUrl(updateCheck.releaseUrl)
    }
  }
  const statusText = (() => {
    if (isChecking) {
      return '正在检查 GitHub Release…'
    }

    if (updateCheckStatus === 'error') {
      return updateCheckError ?? '检查失败，请稍后重试。'
    }

    if (updateCheck?.hasUpdate && latestVersion) {
      return `发现新版本 ${latestVersion}`
    }

    if (updateCheckStatus === 'ready') {
      return '已是最新版本'
    }

    return '等待检查'
  })()
  const versionStatusText = updateCheckStatus === 'idle' ? null : statusText

  return (
    <section>
      <h3 className="mb-4 text-[14px] font-semibold text-foreground">关于</h3>

      <div className="overflow-hidden rounded-[8px] border border-border/50 bg-white shadow-minimal-flat">
        <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
          <div className="text-[14px] font-semibold text-foreground">版本</div>
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right">
            <span className="text-[14px] font-medium text-foreground/48">v{currentVersion}</span>
            {versionStatusText ? (
              <span className="text-[12px] text-foreground/42">· {versionStatusText}</span>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-t border-border/45 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-foreground">检查更新</div>
            <div className="mt-1 text-[12px] text-foreground/48">
              {checkedAt ? `上次检查 ${checkedAt}` : '启动后会自动检测最新版本。'}
            </div>
            {updateCheck?.hasUpdate && updateCheck.assetName ? (
              <div className="mt-1 truncate text-[12px] text-foreground/48">安装包：{updateCheck.assetName}</div>
            ) : null}
            {updateInstallStatus === 'error' && updateInstallError ? (
              <div className="mt-1 text-[12px] text-red-500/80">{updateInstallError}</div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {updateCheck?.hasUpdate ? (
              <>
                <button
                  className="cursor-pointer rounded-[8px] bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={isInstalling}
                  onClick={onInstallUpdate}
                  type="button"
                >
                  {isInstalling ? '更新中…' : '重启并更新'}
                </button>
                {updateCheck.assetUrl ? (
                  <button
                    className="cursor-pointer rounded-[8px] border border-border/50 bg-white px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/5"
                    onClick={handleOpenAsset}
                    type="button"
                  >
                    下载 DMG
                  </button>
                ) : null}
                {updateCheck.releaseUrl ? (
                  <button
                    className="cursor-pointer rounded-[8px] border border-border/50 bg-white px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/5"
                    onClick={handleOpenRelease}
                    type="button"
                  >
                    查看 Release
                  </button>
                ) : null}
              </>
            ) : null}
            <button
              className="cursor-pointer rounded-[8px] border border-border/60 bg-white px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:text-foreground/35"
              disabled={isChecking}
              onClick={onCheckForUpdates}
              type="button"
            >
              {isChecking ? '检查中…' : '立即检查'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
