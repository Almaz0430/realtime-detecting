import { useCallback, useRef } from "react"
import type { ChangeEvent, DragEvent } from "react"

type StreamStatus = "processing" | "completed" | "failed"

export type ImageStreamItem = {
  id: string
  timestamp: string
  status: StreamStatus
  previewUrl: string
  defectCount?: number
}

export type ImageStreamProps = {
  items?: ImageStreamItem[]
  uploading?: boolean
  onUpload?: (files: FileList) => void
  title?: string
}

const statusClasses: Record<StreamStatus, string> = {
  processing: "bg-primary/20 text-primary",
  completed: "bg-surface/80 text-text",
  failed: "bg-primary/30 text-primary",
}

const statusLabel: Record<StreamStatus, string> = {
  processing: "В обработке",
  completed: "Готово",
  failed: "Ошибка",
}

const mockItems: ImageStreamItem[] = [
  {
    id: "482-14",
    timestamp: "11:42",
    status: "processing",
    previewUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=60",
    defectCount: 2,
  },
  {
    id: "482-13",
    timestamp: "11:37",
    status: "completed",
    previewUrl: "https://images.unsplash.com/photo-1503389152951-9f343605f61e?auto=format&fit=crop&w=300&q=60",
    defectCount: 0,
  },
  {
    id: "482-12",
    timestamp: "11:31",
    status: "failed",
    previewUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=300&q=60",
    defectCount: 6,
  },
]

export default function ImageStream({ items = mockItems, uploading, onUpload, title = "Поток изображений" }: ImageStreamProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      if (event.dataTransfer.files?.length && onUpload) {
        onUpload(event.dataTransfer.files)
      }
    },
    [onUpload],
  )

  const handleUploadClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files?.length && onUpload) {
        onUpload(event.target.files)
      }
    },
    [onUpload],
  )

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-surface/80 bg-surface/90 p-6 shadow-xl shadow-black/30">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <p className="text-sm text-muted">Загружайте новые партии деталей или отслеживайте живой поток</p>
        </div>
        <button
          className="rounded-full border border-transparent bg-primary px-4 py-2 text-sm font-medium text-text transition hover:bg-primary-dark"
          onClick={handleUploadClick}
          type="button"
        >
          Загрузить
        </button>
        <input
          ref={inputRef}
          accept="image/*"
          className="hidden"
          multiple
          onChange={handleInputChange}
          type="file"
        />
      </header>

      <div
        className="flex h-36 w-full items-center justify-center rounded-2xl border border-dashed border-surface/70 bg-background/60 text-muted transition hover:border-primary hover:text-text"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {uploading ? "Идёт загрузка…" : "Перетащите файлы сюда или используйте кнопку"}
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-2xl border border-surface bg-background/60">
            <div className="relative">
              <img alt={`Деталь ${item.id}`} className="h-32 w-full object-cover opacity-90" src={item.previewUrl} />
              <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-text shadow">
                {item.id}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted">
              <span>{item.timestamp}</span>
              <span className={`rounded-full px-2 py-1 ${statusClasses[item.status]}`}>{statusLabel[item.status]}</span>
            </div>
            <div className="border-t border-surface/80 px-4 py-3 text-xs text-muted">
              {typeof item.defectCount === "number" ? `Дефекты: ${item.defectCount}` : "Без данных"}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
