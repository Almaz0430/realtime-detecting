import { Link } from "react-router-dom"
import ImageStream, { type ImageStreamItem } from "../components/ImageStream"
import ResultVisualizer from "../components/ResultVisualizer"

const annotations = [
  { id: "D-204", label: "Подтек", intensity: 0.92, position: { top: "18%", left: "22%" } },
  { id: "D-211", label: "Слабое покрытие", intensity: 0.63, position: { top: "46%", left: "68%" } },
  { id: "D-219", label: "Раковина", intensity: 0.71, position: { top: "71%", left: "37%" } },
]

const frames: ImageStreamItem[] = [
  {
    id: "482-07A",
    timestamp: "12:00",
    status: "completed",
    previewUrl: "https://images.unsplash.com/photo-1616628182501-e2ddc11f5c4f?auto=format&fit=crop&w=300&q=60",
    defectCount: 3,
  },
  {
    id: "482-07B",
    timestamp: "11:58",
    status: "processing",
    previewUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=60",
    defectCount: 2,
  },
  {
    id: "482-07C",
    timestamp: "11:56",
    status: "failed",
    previewUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=300&q=60",
    defectCount: 6,
  },
]

export default function ImageDetail() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text">Деталь № 482-07</h1>
          <p className="text-muted">Результаты анализа камеры контроля. Обновлено 5 минут назад</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="rounded-full border border-surface/80 bg-surface px-4 py-2 text-sm text-muted transition hover:border-primary hover:text-text"
            to="/"
          >
            Назад к дашборду
          </Link>
          <button className="rounded-full border border-transparent bg-primary px-4 py-2 text-sm font-medium text-text transition hover:bg-primary-dark">
            Скачать отчет
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <ResultVisualizer
          heatmapPoints={annotations}
          footer={
            <div className="grid gap-4 rounded-2xl border border-surface bg-background/60 p-4 text-sm text-muted md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Средняя толщина слоя</p>
                <p className="mt-2 text-lg font-semibold text-text">68 мкм</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Макс. отклонение</p>
                <p className="mt-2 text-lg font-semibold text-primary">+12%</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Обнаруженные дефекты</p>
                <p className="mt-2 text-lg font-semibold text-text">{annotations.length}</p>
              </div>
            </div>
          }
        />

        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border border-surface/80 bg-surface/90 p-6 shadow-xl shadow-black/30">
            <div>
              <h2 className="text-lg font-medium text-text">Параметры анализа</h2>
              <p className="text-sm text-muted">Камера №2 · Линия порошкового окрашивания</p>
            </div>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Скорость конвейера</dt>
                <dd className="font-medium text-text">6.2 м/мин</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Температура полимеризации</dt>
                <dd className="font-medium text-text">187 °C</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Оператор смены</dt>
                <dd className="font-medium text-text">Иван Захаров</dd>
              </div>
            </dl>
          </section>

          <ImageStream items={frames} title="Кадры серии" />
        </div>
      </div>
    </div>
  )
}
