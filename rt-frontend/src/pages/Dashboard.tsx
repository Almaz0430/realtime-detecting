import { Link } from "react-router-dom"
import DashboardAnalytics from "../components/DashboardAnalytics"
import ImageStream, { type ImageStreamItem } from "../components/ImageStream"
import ResultVisualizer from "../components/ResultVisualizer"

const streamItems: ImageStreamItem[] = [
  {
    id: "482-17",
    timestamp: "12:04",
    status: "processing",
    previewUrl: "https://images.unsplash.com/photo-1616628182501-e2ddc11f5c4f?auto=format&fit=crop&w=300&q=60",
    defectCount: 1,
  },
  {
    id: "482-16",
    timestamp: "11:58",
    status: "completed",
    previewUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=60",
    defectCount: 0,
  },
  {
    id: "482-15",
    timestamp: "11:52",
    status: "completed",
    previewUrl: "https://images.unsplash.com/photo-1503389152951-9f343605f61e?auto=format&fit=crop&w=300&q=60",
    defectCount: 3,
  },
]

const DashboardToolbar = () => (
  <div className="flex items-center gap-3">
    <button className="rounded-full border border-surface/80 bg-surface px-4 py-2 text-sm text-muted transition hover:border-primary hover:text-text">
      Последние 24 часа
    </button>
    <button className="rounded-full border border-transparent bg-primary px-4 py-2 text-sm font-medium text-text transition hover:bg-primary-dark">
      Экспорт отчета
    </button>
  </div>
)

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text">Мониторинг качества покраски</h1>
          <p className="text-muted">Онлайн анализ показателей линии порошкового окрашивания</p>
        </div>
        <Link
          className="rounded-full border border-transparent bg-primary px-4 py-2 text-sm font-medium text-text transition hover:bg-primary-dark"
          to="/details"
        >
          Перейти к деталям
        </Link>
      </header>

      <DashboardAnalytics toolbar={<DashboardToolbar />} />

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <ResultVisualizer
          footer={
            <div className="flex items-center justify-between rounded-2xl border border-surface bg-background/60 px-4 py-3 text-sm text-muted">
              <div>
                <p className="font-medium text-text">Состояние линии</p>
                <p>Температура камеры 187 °C · Давление 1.15 бар · Время цикла 03:12</p>
              </div>
              <Link className="text-primary transition hover:text-primary-dark" to="/details">
                Открыть последнюю партию
              </Link>
            </div>
          }
        />
        <ImageStream items={streamItems} title="Последние партии" />
      </div>
    </div>
  )
}
