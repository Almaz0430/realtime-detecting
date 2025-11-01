import { ExclamationTriangleIcon, PhotoIcon } from "@heroicons/react/24/outline"
import { useMemo, useRef, useState } from "react"
import { ApiError, type DetectResponse, detectDefects } from "../api/client"
import type { Stage } from "../components/StageIndicator"
import StageIndicator from "../components/StageIndicator"

const CONFIDENCE_MIN = 0.1
const CONFIDENCE_MAX = 0.9
const CONFIDENCE_STEP = 0.05

export default function DetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [confidence, setConfidence] = useState(0.5)
  const [result, setResult] = useState<DetectResponse | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectError, setDetectError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file ?? null)
    setResult(null)
    setDetectError(null)
  }

  const handleSelectFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedFile) {
      setDetectError("Прикрепите изображение для анализа")
      return
    }
    setIsDetecting(true)
    setDetectError(null)

    try {
      const response = await detectDefects({ file: selectedFile, confidence })
      setResult(response)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Не удалось выполнить детекцию"
      setDetectError(message)
      setResult(null)
    } finally {
      setIsDetecting(false)
    }
  }

  const resultImageSrc = result ? `data:image/jpeg;base64,${result.result_image}` : null

  const stages = useMemo<Stage[]>(() => {
    const hasFile = Boolean(selectedFile)
    const hasResult = Boolean(result)
    const hasError = Boolean(detectError)

    const fileName = selectedFile?.name ?? ""
    const totalDefects = result?.total_defects ?? 0

    return [
      {
        id: "prepare",
        title: "ПОДГОТОВКА",
        description: hasFile ? `Файл выбран: ${fileName}` : "Выберите изображение для анализа",
        status: hasFile ? "done" : "active",
      },
      {
        id: "detect",
        title: "ДЕТЕКЦИЯ",
        description: isDetecting
          ? "Анализ выполняется..."
          : hasResult
            ? "Анализ завершён"
            : hasError
              ? detectError ?? "Произошла ошибка"
              : hasFile
                ? "Нажмите «Запустить анализ»"
                : "Ожидание изображения",
        status: isDetecting
          ? "active"
          : hasResult
            ? "done"
            : hasError
              ? "done"
              : hasFile
                ? "active"
                : "pending",
        error: hasError,
      },
      {
        id: "result",
        title: "РЕЗУЛЬТАТ",
        description: hasResult
          ? `Обнаружено дефектов: ${totalDefects}`
          : hasError
            ? "Повторите анализ после устранения ошибки"
            : "Результаты появятся после анализа",
        status: hasResult ? "done" : hasError ? "active" : "pending",
        error: hasError,
      },
    ]
  }, [detectError, isDetecting, result, selectedFile])

  const detectionStatus = useMemo(() => {
    if (isDetecting) {
      return "Анализ выполняется..."
    }
    if (detectError) {
      return detectError
    }
    if (result) {
      return "Анализ выполнен успешно"
    }
    return "Ожидание запуска анализа"
  }, [detectError, isDetecting, result])

  const fileSummary = selectedFile ? selectedFile.name : "Файл не выбран"

  const topDetection = useMemo(() => {
    if (!result || result.detections.length === 0) {
      return null
    }
    return result.detections.reduce((best, item) => (item.confidence > best.confidence ? item : best))
  }, [result])

  const formattedTimestamp = useMemo(() => {
    if (!result) {
      return null
    }
    try {
      return new Date(result.timestamp).toLocaleString("ru-RU", {
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch {
      return result.timestamp
    }
  }, [result])

  const activeStage = useMemo(() => {
    return stages.find((stage) => stage.status === "active") ?? stages.find((stage) => stage.status === "pending") ?? stages[0]
  }, [stages])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface/95 px-8 py-10 shadow-2xl shadow-black/50">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_top_left,_rgba(255,77,77,0.32),_transparent_55%)]" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.4em] text-primary/80">AI инспектор</p>
            <h1 className="mt-4 text-3xl font-semibold text-text md:text-4xl">Детекция дефектов кузова в несколько этапов</h1>
            <p className="mt-4 text-base text-muted">
              Система анализирует изображение, отмечает потенциальные дефекты и формирует статистику. Следуйте этапам: загрузите файл,
              настройте параметры и получите визуализацию результата.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-text transition hover:bg-primary-dark"
                onClick={handleSelectFileClick}
                type="button"
              >
                Выбрать изображение
              </button>
              <a
                className="rounded-full border border-white/20 px-6 py-3 text-sm text-muted transition hover:border-primary hover:text-text"
                href="#results"
              >
                Посмотреть результаты
              </a>
            </div>
          </div>
          <div className="grid w-full max-w-sm gap-3 rounded-2xl border border-white/10 bg-background/70 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Текущий статус</p>
              <p className="mt-2 text-lg font-medium text-text">{detectionStatus}</p>
            </div>
            <div className="grid gap-2 text-[11px] uppercase tracking-[0.25em] text-muted">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-background/70 px-4 py-3">
                <span>Файл</span>
                <span className="truncate text-text" title={fileSummary}>
                  {fileSummary}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-background/70 px-4 py-3">
                <span>Уверенность</span>
                <span className="text-text">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-background/70 px-4 py-3">
                <span>Этап</span>
                <span className="text-text">{activeStage.title}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StageIndicator stages={stages} />

      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-2xl border border-white/10 bg-surface/80 p-6 shadow-lg shadow-black/40">
          <header className="mb-6">
            <h2 className="text-xl font-semibold text-text">Запуск детекции</h2>
            <p className="text-sm text-muted">Загрузите изображение кузова автомобиля, чтобы обнаружить дефекты окраски.</p>
          </header>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Шаг 1</p>
              <h3 className="mt-2 text-lg font-semibold text-text">Загрузите изображение автомобиля</h3>
              <p className="mt-1 text-sm text-muted">Перетащите файл в область ниже или выберите его вручную.</p>
              <div className="relative mt-4">
                <input
                  accept="image/*"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  id="image-input"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  type="file"
                />
                <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-background/70 px-6 text-center transition hover:border-primary/60 hover:bg-background/80">
                  <PhotoIcon aria-hidden className="h-12 w-12 text-primary" />
                  <p className="mt-3 text-sm text-text">Перетащите изображение сюда или нажмите, чтобы выбрать</p>
                  <p className="mt-1 text-xs text-muted">Поддерживаются JPG и PNG до 16MB</p>
                </div>
              </div>
              {selectedFile ? (
                <p className="mt-3 rounded-full border border-white/10 bg-background/80 px-4 py-2 text-xs text-muted">
                  Выбрано: <span className="text-text">{selectedFile.name}</span> · {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              ) : null}
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Шаг 2</p>
              <div className="mt-2 rounded-2xl border border-white/10 bg-background/70 p-5">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="text-sm text-muted">Минимальная уверенность модели</span>
                  <span className="rounded-full border border-white/10 bg-background/80 px-3 py-1 text-xs text-text">
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  className="mt-4 w-full accent-primary"
                  id="confidence-input"
                  max={CONFIDENCE_MAX}
                  min={CONFIDENCE_MIN}
                  onChange={(event) => setConfidence(Number(event.target.value))}
                  step={CONFIDENCE_STEP}
                  type="range"
                  value={confidence}
                />
                <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
                  <span>{(CONFIDENCE_MIN * 100).toFixed(0)}%</span>
                  <span>{(CONFIDENCE_MAX * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {detectError ? (
              <div className="flex items-start gap-3 rounded-2xl border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary">
                <ExclamationTriangleIcon aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <p>{detectError}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full border border-transparent bg-primary px-6 py-3 text-sm font-medium text-text transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isDetecting}
                type="submit"
              >
                {isDetecting ? "Выполняется анализ..." : "Запустить анализ"}
              </button>
              <button
                className="rounded-full border border-white/15 px-6 py-3 text-sm text-muted transition hover:border-white/40 hover:text-text"
                onClick={() => {
                  setSelectedFile(null)
                  setResult(null)
                  setDetectError(null)
                }}
                type="button"
              >
                Очистить
              </button>
            </div>
          </form>
        </section>

        <section id="results" className="rounded-2xl border border-white/10 bg-surface/80 p-6 shadow-lg shadow-black/40">
          <header className="mb-4">
            <h2 className="text-xl font-semibold text-text">Результаты</h2>
            <p className="text-sm text-muted">
              {result ? `Обнаружено дефектов: ${result.total_defects}` : "Здесь появится информация после анализа изображения."}
            </p>
          </header>

          {result ? (
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-background/70 px-4 py-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Всего дефектов</p>
                <p className="mt-3 text-3xl font-semibold text-text">{result.total_defects}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/70 px-4 py-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Максимальная уверенность</p>
                <p className="mt-3 text-2xl font-semibold text-text">
                  {topDetection ? `${(topDetection.confidence * 100).toFixed(1)}%` : "—"}
                </p>
                {topDetection ? <p className="text-xs text-muted">Класс: {topDetection.class}</p> : null}
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/70 px-4 py-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Последнее обновление</p>
                <p className="mt-3 text-sm text-text">{formattedTimestamp ?? "—"}</p>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-dashed border-white/15 bg-background/60 px-4 py-5 text-sm text-muted">
              Загрузите изображение и запустите анализ, чтобы увидеть статистику и визуализацию.
            </div>
          )}

          {resultImageSrc ? (
            <div className="mb-6 overflow-hidden rounded-xl border border-white/10 bg-background/80">
              <img alt="Результат анализа" className="h-full w-full object-cover" src={resultImageSrc} />
            </div>
          ) : null}

          {result ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Статистика</h3>
                <ul className="mt-3 grid gap-3 text-sm text-muted md:grid-cols-2">
                  {Object.entries(result.defect_counts).map(([label, count]) => (
                    <li key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-background/70 px-4 py-3">
                      <span className="text-text">{label}</span>
                      <span className="text-lg text-text">{count}</span>
                    </li>
                  ))}
                  {Object.keys(result.defect_counts).length === 0 ? (
                    <li className="rounded-xl border border-white/10 bg-background/70 px-4 py-3 text-center text-muted">
                      Дефекты не обнаружены
                    </li>
                  ) : null}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Список детекций</h3>
                <div className="mt-3 max-h-64 space-y-3 overflow-auto pr-1 text-sm text-muted">
                  {result.detections.map((item, index) => (
                    <div key={`${item.class}-${index}`} className="rounded-xl border border-white/10 bg-background/70 px-4 py-3">
                      <p className="text-text">
                        {item.class} · {(item.confidence * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted">BBox: {item.bbox.map((value) => value.toFixed(1)).join(", ")}</p>
                    </div>
                  ))}
                  {result.detections.length === 0 ? (
                    <p className="rounded-xl border border-white/10 bg-background/70 px-4 py-3 text-center text-muted">
                      Объекты не найдены
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
