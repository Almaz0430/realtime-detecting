import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import ImageStream, { type ImageStreamItem } from "../components/ImageStream"
import ResultVisualizer from "../components/ResultVisualizer"

const detectionTimeline: ImageStreamItem[] = [
  {
    id: "frame-01",
    timestamp: "00:05",
    status: "processing",
    previewUrl: "https://images.unsplash.com/photo-1616628182501-e2ddc11f5c4f?auto=format&fit=crop&w=300&q=60",
    defectCount: 2,
  },
  {
    id: "frame-02",
    timestamp: "00:08",
    status: "processing",
    previewUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=60",
    defectCount: 1,
  },
  {
    id: "frame-03",
    timestamp: "00:12",
    status: "completed",
    previewUrl: "https://images.unsplash.com/photo-1503389152951-9f343605f61e?auto=format&fit=crop&w=300&q=60",
    defectCount: 0,
  },
]

type DetectionState = {
  mode?: "image" | "video"
  settings?: Record<string, unknown>
}

export default function WorkflowDetection() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { mode = "image" } = (state as DetectionState | null) ?? {}
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          setIsRunning(false)
          return 100
        }
        return value + 10
      })
    }, 400)

    return () => clearInterval(timer)
  }, [])

  const summaryItems = useMemo(
    () => [
      { label: "Средняя площадь покрытия", value: "98.6%" },
      { label: "Деталей за сеанс", value: "24" },
      { label: "Обнаружено дефектов", value: "5" },
      { label: "Настройки", value: mode === "image" ? "Фото пресет" : "Видео пресет" },
    ],
    [mode],
  )

  return (
    <div className="flex flex-col gap-10">
      <header className="space-y-4">
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.4em] text-muted">
          <span className="rounded-full border border-primary px-3 py-1 text-primary">Шаг 3</span>
          <span>Онлайн детекция</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-text">Запускаем анализ качества покрытия</h1>
          <p className="max-w-3xl text-muted">
            Следите за статусом обработки в реальном времени. Как только сессия завершится, откроется отчёт и станет доступен полный дашборд.
          </p>
        </div>
      </header>

      <section className="rounded-3xl border border-surface/70 bg-surface/80 p-6 shadow-xl shadow-black/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Статус обработки</p>
            <p className="mt-2 text-lg font-semibold text-text">{isRunning ? "Идёт анализ" : "Анализ завершён"}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {isRunning ? "Live" : "Запись сохранена"}
          </div>
        </div>
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-background/40">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <ResultVisualizer
        footer={
          <div className="flex flex-wrap gap-4 rounded-2xl border border-surface bg-background/60 p-4 text-sm text-muted">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.3em] text-muted">{item.label}</span>
                <span className="text-lg font-semibold text-text">{item.value}</span>
              </div>
            ))}
          </div>
        }
      />

      <ImageStream items={detectionTimeline} title="Лента обработки" uploading={isRunning} />

      <div className="flex flex-wrap justify-end gap-3">
        <button
          className="rounded-full border border-surface/70 px-6 py-3 text-sm text-muted transition hover:border-primary hover:text-text"
          onClick={() => navigate("/workflow/model", { state: { mode } })}
          type="button"
        >
          Изменить параметры
        </button>
        <button
          className="rounded-full border border-transparent bg-primary px-6 py-3 text-sm font-medium text-text transition hover:bg-primary-dark"
          disabled={isRunning}
          onClick={() => navigate("/dashboard")}
          type="button"
        >
          Перейти к дашборду
        </button>
        <Link className="self-center text-sm text-muted transition hover:text-text" to="/details">
          Посмотреть последнюю деталь
        </Link>
      </div>
    </div>
  )
}
