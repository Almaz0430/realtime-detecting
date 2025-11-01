import type { ComponentType, SVGProps } from "react"
import { ArrowUpTrayIcon, Cog6ToothIcon, SparklesIcon } from "@heroicons/react/24/outline"

type StageStatus = "done" | "active" | "pending"

export type Stage = {
  id: string
  title: string
  description: string
  status: StageStatus
  error?: boolean
}

type StageIndicatorProps = {
  stages: Stage[]
}

function cn(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ")
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const statusLabels: Record<StageStatus, string> = {
  done: "Готово",
  active: "В процессе",
  pending: "Ожидание",
}

const stageIcons: Record<string, IconComponent> = {
  prepare: ArrowUpTrayIcon,
  detect: Cog6ToothIcon,
  result: SparklesIcon,
}

export default function StageIndicator({ stages }: StageIndicatorProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface/90 p-8 shadow-2xl shadow-black/40">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_top,_rgba(255,77,77,0.28),_rgba(20,20,20,0)_60%)]" />
      <div className="relative grid gap-6 md:grid-cols-3">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1
          const Icon = stageIcons[stage.id]
          return (
            <div
              key={stage.id}
              className={cn(
                "group relative rounded-2xl border border-white/10 bg-background/60 p-5 transition duration-300 hover:border-primary/60 hover:bg-background/80",
                stage.status === "active" ? "border-primary/60 bg-background/80" : "",
                stage.status === "done" && !stage.error ? "border-emerald-500/60 bg-emerald-500/10" : "",
                stage.error ? "border-primary/60 bg-primary/10" : ""
              )}
            >
              {!isLast ? (
                <span className="pointer-events-none absolute right-[-52px] top-1/2 hidden h-[2px] w-12 -translate-y-1/2 bg-gradient-to-r from-white/20 to-transparent md:block" />
              ) : null}
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border text-xl transition",
                    stage.status === "done" && !stage.error ? "border-emerald-400 bg-emerald-500/20 text-emerald-200" : "",
                    stage.status === "done" && stage.error ? "border-primary/70 bg-primary/30 text-primary" : "",
                    stage.status === "active" && !stage.error ? "border-primary bg-primary/30 text-primary" : "",
                    stage.status === "active" && stage.error ? "border-primary bg-primary/40 text-primary" : "",
                    stage.status === "pending" ? "border-white/20 bg-background/50 text-muted" : ""
                  )}
                >
                  {Icon ? <Icon aria-hidden className="h-6 w-6" /> : <span className="text-xs">●</span>}
                </span>
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">{stage.title}</p>
                    <p className="mt-1 text-sm text-text">{stage.description}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex w-max items-center gap-1 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em]",
                      stage.status === "done" && !stage.error
                        ? "border-emerald-400/60 text-emerald-200"
                        : stage.status === "done" && stage.error
                          ? "border-primary/70 text-primary"
                          : stage.status === "active"
                            ? "border-primary/70 text-primary"
                            : "border-white/15 text-muted"
                    )}
                  >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                    {statusLabels[stage.status]}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
