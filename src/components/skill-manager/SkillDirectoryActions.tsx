import { useEffect, useRef, useState } from 'react'
import { openSkillDirectory } from '../../skill-manager/api'
import { type DirectoryOpenTarget } from '../../skill-manager/types'

const CATEGORY_LABELS: Record<string, string> = {
  editor: '编辑器',
  'file-manager': '文件管理器',
  ide: 'IDE',
}

function ChevronDownIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="m7 10 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

function TargetIcon({ target, size = 16 }: { target: DirectoryOpenTarget; size?: number }) {
  if (target.icon?.type === 'dataUrl' && target.icon.value) {
    return (
      <img
        alt=""
        className="block rounded-[4px]"
        height={size}
        src={target.icon.value}
        width={size}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center rounded-[4px] bg-foreground/8 text-[10px] font-semibold text-foreground/56"
      style={{ height: size, width: size }}
    >
      {target.label.slice(0, 1)}
    </span>
  )
}

function groupTargets(targets: DirectoryOpenTarget[]) {
  return targets.reduce<Array<{ category: string; targets: DirectoryOpenTarget[] }>>((groups, target) => {
    const group = groups.find((item) => item.category === target.category)
    if (group) {
      group.targets.push(target)
      return groups
    }

    groups.push({ category: target.category, targets: [target] })
    return groups
  }, [])
}

export function SkillDirectoryActions({
  directory,
  targets,
}: {
  directory: string
  targets: DirectoryOpenTarget[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const defaultTarget = targets.find((target) => target.category === 'file-manager') ?? targets[0] ?? null
  const groupedTargets = groupTargets(targets)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && containerRef.current?.contains(target)) {
        return
      }

      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleOpenDirectory = (target: DirectoryOpenTarget) => {
    setIsOpen(false)
    setFeedbackMessage(null)

    void openSkillDirectory(directory, target.id)
      .catch(() => {
        setFeedbackMessage('打开目录失败，请确认应用可用。')
      })
  }

  if (!defaultTarget) {
    return null
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex overflow-hidden rounded-[8px] border border-border/50 bg-white shadow-minimal-flat">
        <button
          aria-label={`使用 ${defaultTarget.label} 打开 skill 目录`}
          className="flex size-8 cursor-pointer items-center justify-center transition-colors hover:bg-foreground/5"
          onClick={() => handleOpenDirectory(defaultTarget)}
          title={defaultTarget.label}
          type="button"
        >
          <TargetIcon target={defaultTarget} />
        </button>
        <button
          aria-expanded={isOpen}
          aria-label="选择打开方式"
          className="flex h-8 w-6 cursor-pointer items-center justify-center border-l border-border/45 text-foreground/42 transition-colors hover:bg-foreground/5 hover:text-foreground"
          onClick={() => {
            setFeedbackMessage(null)
            setIsOpen((value) => !value)
          }}
          title="选择打开方式"
          type="button"
        >
          <ChevronDownIcon size={13} />
        </button>
      </div>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[410] w-[190px] overflow-hidden rounded-[8px] border border-border/55 bg-white py-1 shadow-minimal">
          {groupedTargets.map((group, groupIndex) => (
            <div className={groupIndex > 0 ? 'border-t border-border/40 pt-1' : undefined} key={group.category}>
              <div className="px-3 pb-1 pt-1.5 text-[10px] font-medium text-foreground/36">
                {CATEGORY_LABELS[group.category] ?? group.category}
              </div>
              {group.targets.map((target) => (
                <button
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[12px] text-foreground/76 transition-colors hover:bg-foreground/5 hover:text-foreground"
                  key={target.id}
                  onClick={() => handleOpenDirectory(target)}
                  type="button"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    <TargetIcon target={target} />
                  </span>
                  <span className="min-w-0 truncate">{target.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {feedbackMessage ? (
        <p className="absolute right-0 top-[calc(100%+6px)] z-[409] w-[220px] rounded-[8px] border border-border/55 bg-white px-3 py-2 text-[12px] text-foreground/56 shadow-minimal">
          {feedbackMessage}
        </p>
      ) : null}
    </div>
  )
}
