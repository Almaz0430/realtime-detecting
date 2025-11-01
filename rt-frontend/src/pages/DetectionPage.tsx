import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ApiError,
  type ApiInfoResponse,
  type DetectResponse,
  type HealthResponse,
  type ModelInfoResponse,
  detectDefects,
  fetchApiInfo,
  fetchHealth,
  fetchModelInfo,
} from "../api/client"

type StatusState = {
  health?: HealthResponse
  modelInfo?: ModelInfoResponse
  error?: string
  loading: boolean
}

const CONFIDENCE_MIN = 0.1
const CONFIDENCE_MAX = 0.9
const CONFIDENCE_STEP = 0.05

export default function DetectionPage() {
  const [status, setStatus] = useState<StatusState>({ loading: true })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [confidence, setConfidence] = useState(0.5)
  const [result, setResult] = useState<DetectResponse | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectError, setDetectError] = useState<string | null>(null)
  const [apiInfo, setApiInfo] = useState<ApiInfoResponse | null>(null)
  const [apiInfoLoading, setApiInfoLoading] = useState(false)
  const [apiInfoError, setApiInfoError] = useState<string | null>(null)
  const isMounted = useRef(true)

  const loadStatus = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: undefined }))
    try {
      const [healthResponse, modelResponse] = await Promise.all([fetchHealth(), fetchModelInfo()])
      if (!isMounted.current) {
        return
      }
      setStatus({ loading: false, health: healthResponse, modelInfo: modelResponse })
    } catch (error) {
      if (!isMounted.current) {
        return
      }
      const message = error instanceof ApiError ? error.message : "Не удалось получить состояние сервера"
      setStatus({ loading: false, error: message })
    }
  }, [])

  useEffect(() => {
    loadStatus()
    return () => {
      isMounted.current = false
    }
  }, [loadStatus])

  const statusMessage = useMemo(() => {
    if (status.loading) {
      return "Получение статуса сервера..."
    }
    if (status.error) {
      return status.error
    }
    if (status.health && status.modelInfo) {
      const parts = []
      parts.push(status.health.status === "healthy" ? "Сервер в норме" : "Сервер недоступен")
      parts.push(status.modelInfo.loaded ? "Модель загружена" : "Модель не загружена")
      return parts.join(" · ")
    }
    return "Статус сервера неизвестен"
  }, [status])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file ?? null)
    setResult(null)
    setDetectError(null)
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

  const handleLoadApiInfo = async () => {
    setApiInfoLoading(true)
    setApiInfoError(null)
    try {
      const info = await fetchApiInfo()
      setApiInfo(info)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Не удалось получить описание API"
      setApiInfo(null)
      setApiInfoError(message)
    } finally {
      setApiInfoLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="rounded-2xl border border-white/10 bg-surface/80 p-6 shadow-lg shadow-black/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted">API статус</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Состояние сервера</h2>
          </div>
          <p className="text-sm text-muted">{statusMessage}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-sm text-text transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={status.loading}
            onClick={() => {
              void loadStatus()
            }}
            type="button"
          >
            {status.loading ? "Обновление..." : "Обновить статус"}
          </button>
          <button
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-muted transition hover:border-primary hover:text-text disabled:cursor-not-allowed disabled:opacity-70"
            disabled={apiInfoLoading}
            onClick={handleLoadApiInfo}
            type="button"
          >
            {apiInfoLoading ? "Загружается документация..." : "Получить описание API"}
          </button>
          {apiInfoError ? <span className="text-sm text-primary">{apiInfoError}</span> : null}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-background/70 p-4 text-xs text-muted">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Health</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                {status.health?.timestamp ?? "—"}
              </span>
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs text-muted">
              {status.health ? JSON.stringify(status.health, null, 2) : "Нет данных"}
            </pre>
          </div>
          <div className="rounded-xl border border-white/10 bg-background/70 p-4 text-xs text-muted">
            <div className="mb-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Model Info</h3>
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs text-muted">
              {status.modelInfo ? JSON.stringify(status.modelInfo, null, 2) : "Нет данных"}
            </pre>
          </div>
        </div>
        {apiInfo ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-background/70 p-4 text-xs text-muted">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">API Root</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{apiInfo.timestamp}</span>
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted">
              {JSON.stringify(apiInfo, null, 2)}
            </pre>
          </div>
        ) : null}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-2xl border border-white/10 bg-surface/80 p-6 shadow-lg shadow-black/40">
          <header className="mb-6">
            <h2 className="text-xl font-semibold text-text">Запуск детекции</h2>
            <p className="text-sm text-muted">Загрузите изображение кузова автомобиля, чтобы обнаружить дефекты окраски.</p>
          </header>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-muted" htmlFor="image-input">
                Изображение
              </label>
              <input
                accept="image/*"
                className="mt-2 w-full rounded-lg border border-white/15 bg-background/80 px-4 py-3 text-sm text-text file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-text"
                id="image-input"
                onChange={handleFileChange}
                type="file"
              />
              {selectedFile ? (
                <p className="mt-2 text-xs text-muted">
                  Выбрано: <span className="text-text">{selectedFile.name}</span> · {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted">Поддерживаются изображения JPG, PNG, с размером до 16MB.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-sm text-muted">
                <label className="text-sm text-muted" htmlFor="confidence-input">
                  Минимальная уверенность
                </label>
                <span className="text-text">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <input
                className="mt-2 w-full"
                id="confidence-input"
                max={CONFIDENCE_MAX}
                min={CONFIDENCE_MIN}
                onChange={(event) => setConfidence(Number(event.target.value))}
                step={CONFIDENCE_STEP}
                type="range"
                value={confidence}
              />
              <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
                <span>{(CONFIDENCE_MIN * 100).toFixed(0)}%</span>
                <span>{(CONFIDENCE_MAX * 100).toFixed(0)}%</span>
              </div>
            </div>

            {detectError ? <p className="text-sm text-primary">{detectError}</p> : null}

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

        <section className="rounded-2xl border border-white/10 bg-surface/80 p-6 shadow-lg shadow-black/40">
          <header className="mb-4">
            <h2 className="text-xl font-semibold text-text">Результаты</h2>
            <p className="text-sm text-muted">
              {result ? `Обнаружено дефектов: ${result.total_defects}` : "Здесь появится информация после анализа изображения."}
            </p>
          </header>

          {resultImageSrc ? (
            <div className="mb-6 overflow-hidden rounded-xl border border-white/10 bg-background/80">
              <img alt="Результат анализа" className="h-full w-full object-cover" src={resultImageSrc} />
            </div>
          ) : null}

          {result ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Статистика</h3>
                <ul className="mt-3 grid gap-2 text-sm text-muted">
                  {Object.entries(result.defect_counts).map(([label, count]) => (
                    <li key={label} className="flex items-center justify-between rounded-lg border border-white/10 bg-background/70 px-3 py-2">
                      <span className="text-text">{label}</span>
                      <span>{count}</span>
                    </li>
                  ))}
                  {Object.keys(result.defect_counts).length === 0 ? (
                    <li className="rounded-lg border border-white/10 bg-background/70 px-3 py-2 text-center text-muted">
                      Дефекты не обнаружены
                    </li>
                  ) : null}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Список детекций</h3>
                <div className="mt-3 max-h-64 space-y-3 overflow-auto pr-1 text-sm text-muted">
                  {result.detections.map((item, index) => (
                    <div key={`${item.class}-${index}`} className="rounded-lg border border-white/10 bg-background/70 px-3 py-2">
                      <p className="text-text">
                        {item.class} · {(item.confidence * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted">BBox: {item.bbox.map((value) => value.toFixed(1)).join(", ")}</p>
                    </div>
                  ))}
                  {result.detections.length === 0 ? (
                    <p className="rounded-lg border border-white/10 bg-background/70 px-3 py-2 text-center text-muted">
                      Объекты не найдены
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-background/70 text-center text-sm text-muted">
              Загрузите изображение и запустите анализ, чтобы увидеть результат.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
