import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import ImageStream from "../components/ImageStream"

const detectionOptions = [
  {
    id: "image",
    title: "Статичные кадры",
    description: "Загрузите фото детали для мгновенного анализа",
    hint: "Поддержка JPG, PNG, до 25 МБ",
  },
  {
    id: "video",
    title: "Загрузка видео",
    description: "Импортируйте запись производственного процесса для пакетной детекции",
    hint: "Поддержка MP4, MOV, AVI",
  },
] as const

type DetectionOption = (typeof detectionOptions)[number]["id"]

export default function WorkflowStart() {
  const navigate = useNavigate()
  const [selectedOption, setSelectedOption] = useState<DetectionOption>("image")

  const optionCards = useMemo(
    () =>
      detectionOptions.map((option) => {
        const isActive = option.id === selectedOption
        return (
          <button
            key={option.id}
            className={`flex flex-col gap-4 border px-6 py-6 text-left transition ${
              isActive
                ? "border-primary bg-primary/10 text-text"
                : "border-white/40 bg-background/60 text-muted hover:border-white hover:text-text"
            }`}
            onClick={() => setSelectedOption(option.id)}
            type="button"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">{isActive ? "Выбрано" : "Режим"}</p>
              <h2 className="mt-3 text-2xl font-semibold text-text">{option.title}</h2>
            </div>
            <p className="text-sm text-muted">{option.description}</p>
            <p className="text-xs text-muted">{option.hint}</p>
          </button>
        )
      }),
    [selectedOption],
  )

  const handleContinue = () => {
    navigate("/workflow/model", { state: { mode: selectedOption } })
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="space-y-4">
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.4em] text-muted">
          <span className="rounded-full border border-primary px-3 py-1 text-primary">Шаг 1</span>
          <span>Выбор сценария детекции</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-text">С чего начнём?</h1>
          <p className="max-w-3xl text-muted">
            Выберите подходящий способ загрузки данных. Система автоматически подстроит обработку и предложит оптимальные параметры
            модели на следующем этапе.
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">{optionCards}</section>

      <section>
        <h2 className="text-lg font-semibold text-text">Как это выглядит</h2>
        <p className="text-sm text-muted">Небольшая выборка последних сессий — просто загрузите и переходите к настройке модели.</p>
        <div className="mt-6">
          <ImageStream items={[]} title="Предпросмотр потока" uploading={false} />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          className="rounded-full border border-transparent bg-primary px-6 py-3 text-sm font-medium text-text transition hover:bg-primary-dark"
          onClick={handleContinue}
          type="button"
        >
          Продолжить настройку
        </button>
      </div>
    </div>
  )
}
