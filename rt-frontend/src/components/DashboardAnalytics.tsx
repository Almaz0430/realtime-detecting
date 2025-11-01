import type { ReactNode } from "react"

type MetricCard = {
  id: string
  label: string
  value: string
  delta?: string
}

type ReportRow = {
  batch: string
  coverage: number
  defects: number
  status: "ok" | "warning" | "critical"
}

export type DashboardAnalyticsProps = {
  metrics?: MetricCard[]
  reports?: ReportRow[]
  toolbar?: ReactNode
}

const defaultMetrics: MetricCard[] = [
  { id: "m1", label: "Средний индекс качества", value: "94.2%", delta: "+1.4%" },
  { id: "m2", label: "Детали в смену", value: "128", delta: "12 дефектов" },
  { id: "m3", label: "Зона покрытия", value: "98.6%", delta: "-0.8%" },
]

const defaultReports: ReportRow[] = [
  { batch: "482-14", coverage: 98.4, defects: 2, status: "ok" },
  { batch: "482-13", coverage: 96.8, defects: 5, status: "warning" },
  { batch: "482-12", coverage: 94.1, defects: 11, status: "critical" },
  { batch: "482-11", coverage: 99.2, defects: 1, status: "ok" },
]

const statusMap: Record<ReportRow["status"], { label: string; className: string }> = {
  ok: { label: "В норме", className: "bg-surface/80 text-text" },
  warning: { label: "Внимание", className: "bg-primary/15 text-primary" },
  critical: { label: "Тревога", className: "bg-primary/30 text-primary" },
}

export default function DashboardAnalytics({ metrics = defaultMetrics, reports = defaultReports, toolbar }: DashboardAnalyticsProps) {
  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-surface/80 bg-surface/90 p-6 shadow-xl shadow-black/30">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Интерактивный дашборд</h2>
          <p className="text-sm text-muted">Сводные показатели, табличные отчеты и динамика покрытий</p>
        </div>
        {toolbar}
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.id} className="rounded-2xl border border-surface bg-background/60 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">{metric.label}</p>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-text">{metric.value}</span>
              {metric.delta ? <span className="text-xs text-muted">{metric.delta}</span> : null}
            </div>
            <div className="mt-6 h-1 rounded-full bg-surface">
              <div className="h-full rounded-full bg-primary" style={{ width: "80%" }} />
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-surface bg-background/60">
        <div className="flex items-center justify-between border-b border-surface/70 px-6 py-4">
          <p className="text-sm font-medium text-text">Отчет по партиям</p>
          <span className="text-xs text-muted">Последние 4 партии</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface/70 text-sm">
            <thead className="bg-background/80 text-muted">
              <tr>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-[0.2em]">Партия</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-[0.2em]">Покрытие</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-[0.2em]">Дефекты</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-[0.2em]">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface/70 text-muted">
              {reports.map((row) => (
                <tr key={row.batch} className="hover:bg-surface/40">
                  <td className="px-6 py-4 font-medium text-text">{row.batch}</td>
                  <td className="px-6 py-4 text-text">{row.coverage.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-primary">{row.defects}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMap[row.status].className}`}>
                      {statusMap[row.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
