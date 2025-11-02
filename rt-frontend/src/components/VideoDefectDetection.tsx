import { useState, useRef, useEffect } from "react"
import { VideoCameraIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline"
import { ApiError, detectVideoDefects, type VideoDetectionResponse } from "../api/client"

interface VideoDefectDetectionProps {
  onAnalysisComplete?: (result: VideoDetectionResponse) => void
  className?: string
}

export default function VideoDefectDetection({ onAnalysisComplete, className = "" }: VideoDefectDetectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [confidence, setConfidence] = useState(0.5)
  const [skipFrames, setSkipFrames] = useState(5)
  const [extractFrames, setExtractFrames] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResult, setProcessingResult] = useState<VideoDetectionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Устанавливаем URL видео из ответа API
  useEffect(() => {
    if (processingResult?.video_url) {
      console.log('Получен video_url:', processingResult.video_url)
      setVideoUrl(processingResult.video_url)
    } else {
      setVideoUrl(null)
    }
  }, [processingResult?.video_url])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file ?? null)
    setProcessingResult(null)
    setError(null)
    // Очищаем предыдущий видео URL
    setVideoUrl(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedFile) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await detectVideoDefects({
        file: selectedFile,
        confidence,
        skipFrames,
        extractFrames
      })
      setProcessingResult(result)
      if (onAnalysisComplete) {
        onAnalysisComplete(result)
      }
    } catch (err) {
      const message = err instanceof ApiError 
        ? err.message 
        : err instanceof Error 
          ? err.message 
          : "Не удалось обработать видео"
      setError(message)
      setProcessingResult(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetAnalysis = () => {
    setSelectedFile(null)
    setProcessingResult(null)
    setError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-neutral-800/80 p-6 shadow-lg shadow-black/40 ${className}`}>
      <header className="mb-6">
        <h2 className="text-xl font-semibold text-white">Анализ видео</h2>
        <p className="text-sm text-gray-400">Загрузите видео для детального анализа дефектов окраски</p>
      </header>

      {processingResult && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 p-3">
          <span className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircleIcon className="h-5 w-5 text-green-400" /> Анализ видео завершен успешно
          </span>
          <button
            onClick={resetAnalysis}
            className="text-xs text-green-400 hover:text-green-300 underline"
          >
            Загрузить новое видео
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Загрузка файла */}
        <div>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            />
            <div
              className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-neutral-900/70 px-6 text-center transition-all duration-300 ease-in-out hover:border-red-500 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <VideoCameraIcon className="h-10 w-10 text-red-500 transition-transform duration-300 group-hover:text-red-500" />
              <p className="mt-2 text-sm text-white">Перетащите видео сюда или нажмите для выбора</p>
              <p className="text-xs text-gray-400">Максимальный размер: 100MB</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-3 rounded-lg border border-white/10 bg-neutral-900/80 p-3">
              <p className="text-sm text-white">
                📹 {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            </div>
          )}
        </div>

        {/* Настройки */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Уверенность модели
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full h-2 bg-neutral-900 rounded-lg appearance-none cursor-pointer range-lg accent-red-500"
              />
              <div className="text-center text-xs text-gray-400">
                {(confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Пропуск кадров */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Пропуск кадров</label>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={skipFrames}
              onChange={(e) => setSkipFrames(Number(e.target.value))}
              className="w-full h-2 bg-neutral-900 rounded-lg appearance-none cursor-pointer range-lg accent-red-500"
            />
            <div className="text-center text-xs text-gray-400">
              {skipFrames} кадров
            </div>
          </div>

          {/* Извлечь кадров */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Извлечь кадров</label>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={extractFrames}
              onChange={(e) => setExtractFrames(Number(e.target.value))}
              className="w-full h-2 bg-neutral-900 rounded-lg appearance-none cursor-pointer range-lg accent-red-500"
            />
            <div className="text-center text-xs text-gray-400">
              {extractFrames} кадров
            </div>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!selectedFile || isProcessing}
            className="flex-1 rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Обработка видео..." : "Начать анализ"}
          </button>
          
          <button
            type="button"
            onClick={resetAnalysis}
            className="rounded-lg border border-white/20 px-4 py-3 text-sm text-gray-400 transition hover:border-white/40 hover:text-white"
          >
            Очистить
          </button>
        </div>
      </form>

      {/* Результаты */}
      {processingResult && (
        <div className="mt-8 space-y-6">
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Результаты анализа</h3>
            
            {/* Статистика */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="rounded-lg border border-white/10 bg-neutral-900/70 p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{processingResult.summary.total_detections}</div>
                <div className="text-sm text-gray-400">Всего дефектов</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-neutral-900/70 p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{processingResult.summary.processed_frames}</div>
                <div className="text-sm text-gray-400">Кадров обработано</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-neutral-900/70 p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{processingResult.summary.total_frames}</div>
                <div className="text-sm text-gray-400">Всего кадров</div>
              </div>
            </div>

            {/* Типы дефектов */}
            {Object.keys(processingResult.summary.defect_counts).length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-white mb-3">Типы дефектов</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(processingResult.summary.defect_counts).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center rounded-lg border border-white/10 bg-neutral-900/70 px-3 py-2">
                      <span className="text-sm text-white">{type}</span>
                      <span className="text-sm font-medium text-red-500">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Обработанное видео */}
            {videoUrl && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-white mb-3">Обработанное видео</h4>
                <div className="rounded-lg border border-white/10 bg-neutral-900/70 overflow-hidden">
                  <video
                    controls
                    className="w-full max-h-96"
                    preload="metadata"
                    playsInline
                    onError={(e) => {
                      console.error('Ошибка загрузки видео:', e)
                      console.error('Video URL:', videoUrl)
                      console.error('Video element:', e.target)
                      const videoElement = e.target as HTMLVideoElement
                      console.error('Video error code:', videoElement.error?.code)
                      console.error('Video error message:', videoElement.error?.message)
                    }}
                    onLoadStart={() => {
                      console.log('Начало загрузки видео:', videoUrl)
                    }}
                    onCanPlay={() => {
                      console.log('Видео готово к воспроизведению')
                    }}
                    onLoadedMetadata={() => {
                      console.log('Метаданные видео загружены')
                    }}
                  >
                    <source src={videoUrl} type="video/mp4" />
                    <p>Ваш браузер не поддерживает воспроизведение видео. 
                       <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                         Скачать видео
                       </a>
                    </p>
                  </video>
                </div>
              </div>
            )}

            {/* Извлеченные кадры */}
            {processingResult.extracted_frames && processingResult.extracted_frames.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-white mb-3">Кадры с дефектами</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {processingResult.extracted_frames.map((frame, index) => (
                    <div key={index} className="rounded-lg border border-white/10 bg-neutral-900/70 overflow-hidden">
                      <img
                        src={`data:image/jpeg;base64,${frame.image}`}
                        alt={`Кадр ${frame.frame_number}`}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm text-white">Кадр #{frame.frame_number}</p>
                        <p className="text-xs text-gray-400">{frame.defects_count} дефектов</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}