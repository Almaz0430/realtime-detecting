import { useState, useRef } from "react"
import { PhotoIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline"
import { ApiError, detectDefects, type DetectResponse } from "../api/client"

interface ImageDefectDetectionProps {
  onAnalysisComplete?: (result: DetectResponse) => void
  className?: string
}

export default function ImageDefectDetection({ onAnalysisComplete, className = "" }: ImageDefectDetectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [confidence, setConfidence] = useState(0.5)
  const [generateReport, setGenerateReport] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResult, setProcessingResult] = useState<DetectResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file ?? null)
    setProcessingResult(null)
    setError(null)
    
    // Создаем превью изображения
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedFile) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await detectDefects({
        file: selectedFile,
        confidence: confidence,
        generateReport: generateReport,
      })

      setProcessingResult(result)
      onAnalysisComplete?.(result)
    } catch (err) {
      console.error("Ошибка при анализе изображения:", err)
      if (err instanceof ApiError) {
        setError(`Ошибка API: ${err.message}`)
      } else {
        setError("Произошла неожиданная ошибка при анализе изображения")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const resetAnalysis = () => {
    setSelectedFile(null)
    setProcessingResult(null)
    setError(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Шапка компонента */}
      <div className="rounded-2xl border border-white/10 bg-neutral-800/80 p-6 shadow-lg shadow-black/40">
        <header>
          <h2 className="text-xl font-semibold text-white">Анализ изображения</h2>
          <p className="text-sm text-gray-400">Загрузите фотографию для детального анализа дефектов окраски</p>
        </header>
      </div>

      {/* Сообщение о завершении анализа */}
      {processingResult && (
        <div className="mb-8 flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 p-3">
          <span className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircleIcon className="h-5 w-5 text-green-400" /> Анализ изображения завершен успешно
          </span>
          <button
            onClick={resetAnalysis}
            className="text-xs text-green-400 hover:text-green-300 underline"
          >
            Загрузить новое изображение
          </button>
        </div>
      )}

      {/* Форма для загрузки и настроек */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Блок загрузки файла */}
        <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6">
          <h3 className="text-base font-semibold text-white mb-4">1. Загрузка файла</h3>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" // pointer-events-none чтобы не перекрывать hover
            />
            <div
              className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-neutral-900/70 px-6 text-center transition-all duration-300 ease-in-out hover:border-red-500 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <PhotoIcon className="h-10 w-10 text-red-500 transition-transform duration-300 group-hover:text-red-500" />
              <p className="mt-2 text-sm text-white">Перетащите изображение сюда или нажмите для выбора</p>
              <p className="text-xs text-gray-400">Максимальный размер: 10MB</p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-3 rounded-lg border border-white/10 bg-neutral-800/80 p-3">
              <p className="text-sm text-white">
                🖼️ {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            </div>
          )}

          {/* Превью изображения */}
          {previewUrl && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2">Превью:</h4>
              <div className="rounded-lg overflow-hidden border border-white/10">
                <img 
                  src={previewUrl} 
                  alt="Превью загруженного изображения"
                  className="w-full max-h-64 object-contain bg-neutral-900/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Блок настроек */}
        <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 space-y-4">
          <h3 className="text-base font-semibold text-white mb-4">2. Настройки анализа</h3>
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
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer range-lg accent-red-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Низкая (0.1)</span>
                <span className="text-red-500 font-medium">{confidence.toFixed(2)}</span>
                <span>Высокая (0.9)</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Более высокие значения дают меньше ложных срабатываний, но могут пропустить некоторые дефекты
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <label htmlFor="gemini-toggle" className="text-sm font-medium text-white">
              Генерировать AI анализ
            </label>
            <button
              type="button"
              id="gemini-toggle"
              onClick={() => setGenerateReport(!generateReport)}
              className={`${generateReport ? 'bg-red-500' : 'bg-neutral-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-900`}
            >
              <span
                className={`${generateReport ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>

        {/* Кнопка анализа */}
        <div className="flex justify-start pt-6 border-t border-white/10">
          <button
            type="submit"
            disabled={!selectedFile || isProcessing}
            className="rounded-xl bg-red-500 px-8 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              Анализ изображения...
            </span>
          ) : (
            "Начать анализ"
          )}
        </button>
        </div>
      </form>

      {/* Блок для вывода ошибок */}
      {error && (
        <div className="mt-8 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Блок с результатами анализа */}
      {processingResult && (
        <div className="rounded-2xl border border-white/10 bg-neutral-800/80 p-6 shadow-lg shadow-black/40 space-y-4">
          <h3 className="text-lg font-semibold text-white">Результаты анализа</h3>
          
          {/* Статистика */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <div className="text-2xl font-bold text-red-500">{processingResult.total_defects}</div>
              <div className="text-sm text-gray-400">Всего дефектов</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <div className="text-2xl font-bold text-red-500">{processingResult.detections.length}</div>
              <div className="text-sm text-gray-400">Обнаружений</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4">
              <div className="text-2xl font-bold text-red-500">
                {Object.keys(processingResult.defect_counts).length}
              </div>
              <div className="text-sm text-gray-400">Типов дефектов</div>
            </div>
          </div>

          {/* Типы дефектов */}
          {Object.keys(processingResult.defect_counts).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Найденные дефекты:</h4>
              <div className="space-y-2">
                {Object.entries(processingResult.defect_counts).map(([defectType, count]) => (
                  <div key={defectType} className="flex justify-between items-center p-2 rounded border border-white/10 bg-neutral-900/30">
                    <span className="text-sm text-white capitalize">{defectType}</span>
                    <span className="text-sm font-medium text-red-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Отчет Gemini */}
          {processingResult.gemini_report && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">AI анализ:</h4>
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                <p className="text-sm text-white whitespace-pre-wrap">{processingResult.gemini_report?.replace(/[\*#]/g, "")}</p>
              </div>
            </div>
          )}

          {/* Результирующее изображение */}
          {processingResult.result_image && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Изображение с выделенными дефектами:</h4>
              <div className="rounded-lg overflow-hidden border border-white/10 flex justify-center">
                <img 
                  src={`data:image/jpeg;base64,${processingResult.result_image}`}
                  alt="Результат анализа с выделенными дефектами"
                  className="max-w-full max-h-96 object-contain bg-neutral-900/50"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}