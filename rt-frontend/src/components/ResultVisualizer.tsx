import type { ReactNode } from "react"

type HeatmapPoint = {
  id: string
  label: string
  intensity: number
  position: { top: string; left: string }
}

type TrendPoint = {
  label: string
  coverage: number
  defects: number
}

export type ResultVisualizerProps = {
  imageUrl?: string
  heatmapPoints?: HeatmapPoint[]
  trendData?: TrendPoint[]
  footer?: ReactNode
}

const defaultHeatmap: HeatmapPoint[] = [
  { id: "H1", label: "Переизбыток порошка", intensity: 0.85, position: { top: "20%", left: "32%" } },
  { id: "H2", label: "Недопокрытие", intensity: 0.6, position: { top: "52%", left: "68%" } },
  { id: "H3", label: "Подтек", intensity: 0.72, position: { top: "76%", left: "42%" } },
]

const defaultTrend: TrendPoint[] = [
  { label: "08:00", coverage: 96, defects: 8 },
  { label: "09:00", coverage: 97, defects: 5 },
  { label: "10:00", coverage: 95, defects: 11 },
  { label: "11:00", coverage: 98, defects: 4 },
  { label: "12:00", coverage: 99, defects: 3 },
]

export default function ResultVisualizer({
  imageUrl = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
  heatmapPoints = defaultHeatmap,
  trendData = defaultTrend,
  footer,
}: ResultVisualizerProps) {
  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-surface/80 bg-surface/90 p-6 shadow-xl shadow-black/30">
      <header>
        <h2 className="text-lg font-semibold text-text">Визуализация результатов</h2>
        <p className="text-sm text-muted">Карта дефектов, интенсивность покрытия и тренды за последнюю смену</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-surface bg-background/70">
          <img alt="Распределение покрытия" className="h-full w-full object-cover opacity-90" src={imageUrl} />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/10 to-primary/20" />
          {heatmapPoints.map((point) => (
            <div
              key={point.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-center"
              style={{ top: point.position.top, left: point.position.left }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/60 bg-background/90 text-sm font-semibold text-text shadow-md shadow-primary/40"
              >
                {(point.intensity * 100).toFixed(0)}%
              </span>
              <span className="rounded-full bg-primary/80 px-3 py-1 text-xs font-medium text-text">{point.label}</span>
            </div>
          ))}
        </div>

        <aside className="flex flex-col gap-4 rounded-3xl border border-surface bg-background/60 p-4 text-sm text-muted">
          <div className="flex items-baseline justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Покрытие</p>
            <span className="text-lg font-semibold text-text">98.6%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Дефекты</p>
            <span className="text-lg font-semibold text-primary">12</span>
          </div>
          <div className="h-1 rounded-full bg-surface">
            <div className="h-full rounded-full bg-primary" style={{ width: "78%" }} />
          </div>
          <p>Покрытие ниже порога на участке 2B. Рекомендуется перепроверить форсунки и скорость конвейера.</p>
        </aside>
      </div>

      <section className="rounded-3xl border border-surface bg-background/60 p-4">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Тренд показателей</h3>
          <span className="text-xs text-muted">Последние 5 часов</span>
        </header>
        <div className="mt-4 grid gap-4 sm:grid-cols-5">
          {trendData.map((point) => (
            <div key={point.label} className="flex flex-col gap-2 rounded-2xl border border-surface bg-background/50 p-4 text-sm text-muted">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">{point.label}</p>
              <div className="relative h-24 overflow-hidden rounded-xl bg-surface/80">
                <div
                  className="absolute bottom-0 left-0 w-full bg-primary/70"
                  style={{ height: `${point.coverage}%`, maxHeight: "100%" }}
                />
                <div
                  className="absolute bottom-0 left-0 w-full bg-primary/30"
                  style={{ height: `${Math.min(point.defects * 5, 100)}%`, maxHeight: "100%" }}
                />
              </div>
              <p className="text-text">Покрытие: {point.coverage}%</p>
              <p>Дефекты: {point.defects}</p>
            </div>
          ))}
        </div>
      </section>

      {footer}
    </section>
  )
}
