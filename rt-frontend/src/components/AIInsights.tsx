import { useMemo } from "react"
import { ChartBarIcon, ExclamationTriangleIcon, CheckCircleIcon, DocumentTextIcon } from "@heroicons/react/24/outline"

interface Detection {
  class: string
  confidence: number
  bbox: [number, number, number, number]
}

interface AIInsightsProps {
  detections: Detection[]
  geminiReport?: string
}

export default function AIInsights({ detections, geminiReport }: AIInsightsProps) {
  // Функция для простого форматирования markdown-подобного текста
  const formatGeminiReport = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Заголовки
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-semibold text-text mt-4 mb-2">{line.replace('### ', '')}</h3>
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold text-text mt-6 mb-3">{line.replace('## ', '')}</h2>
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold text-text mt-6 mb-4">{line.replace('# ', '')}</h1>
        }
        
        // Жирный текст
        if (line.includes('**')) {
          const parts = line.split('**')
          return (
            <p key={index} className="text-sm text-muted mb-2">
              {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i} className="text-text font-semibold">{part}</strong> : part
              )}
            </p>
          )
        }
        
        // Списки
        if (line.startsWith('*   ') || line.startsWith('- ')) {
          return <li key={index} className="text-sm text-muted ml-4 mb-1">{line.replace(/^\*   |^- /, '')}</li>
        }
        
        // Разделители
        if (line.trim() === '***') {
          return <hr key={index} className="border-white/10 my-4" />
        }
        
        // Обычные строки
        if (line.trim()) {
          return <p key={index} className="text-sm text-muted mb-2">{line}</p>
        }
        
        // Пустые строки
        return <br key={index} />
      })
  }
  const insights = useMemo(() => {
    if (!detections || detections.length === 0) {
      return {
        severity: "good" as const,
        title: "Отличное состояние",
        description: "Дефекты не обнаружены. Поверхность в хорошем состоянии.",
        recommendations: ["Продолжайте регулярный осмотр", "Поддерживайте текущий уровень ухода"],
        stats: { total: 0, critical: 0, minor: 0 }
      }
    }

    const stats = detections.reduce(
      (acc, detection) => {
        acc.total++
        if (detection.confidence > 0.8) {
          acc.critical++
        } else {
          acc.minor++
        }
        return acc
      },
      { total: 0, critical: 0, minor: 0 }
    )

    const severity = stats.critical > 3 ? "critical" : stats.critical > 0 ? "warning" : "minor"
    
    const severityConfig = {
      critical: {
        title: "Критические дефекты обнаружены",
        description: "Обнаружены серьезные дефекты, требующие немедленного внимания.",
        recommendations: [
          "Немедленно обратитесь к специалисту",
          "Прекратите эксплуатацию до устранения дефектов",
          "Проведите детальную диагностику"
        ]
      },
      warning: {
        title: "Обнаружены дефекты средней степени",
        description: "Найдены дефекты, которые требуют планового ремонта.",
        recommendations: [
          "Запланируйте ремонт в ближайшее время",
          "Контролируйте развитие дефектов",
          "Рассмотрите профилактические меры"
        ]
      },
      minor: {
        title: "Незначительные дефекты",
        description: "Обнаружены мелкие дефекты, не требующие срочного вмешательства.",
        recommendations: [
          "Проведите профилактический осмотр",
          "Рассмотрите косметический ремонт",
          "Продолжайте мониторинг состояния"
        ]
      }
    }

    return {
      severity,
      ...severityConfig[severity],
      stats
    }
  }, [detections])

  const getSeverityIcon = () => {
    switch (insights.severity) {
      case "critical":
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
      case "warning":
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
      case "minor":
        return <ChartBarIcon className="h-6 w-6 text-blue-400" />
      default:
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />
    }
  }

  const getSeverityColor = () => {
    switch (insights.severity) {
      case "critical":
        return "border-red-500/30 bg-red-500/10"
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/10"
      case "minor":
        return "border-blue-500/30 bg-blue-500/10"
      default:
        return "border-green-500/30 bg-green-500/10"
    }
  }

  return (
    <section className={`rounded-2xl border p-6 shadow-lg shadow-black/40 ${getSeverityColor()}`}>
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {geminiReport ? <DocumentTextIcon className="h-6 w-6 text-primary" /> : getSeverityIcon()}
          <h2 className="text-xl font-semibold text-text">
            {geminiReport ? "Отчет ИИ Анализа" : "Анализ ИИ"}
          </h2>
        </div>
        {!geminiReport && (
          <>
            <h3 className="text-lg font-medium text-text mb-2">{insights.title}</h3>
            <p className="text-sm text-muted">{insights.description}</p>
          </>
        )}
      </header>

      {geminiReport ? (
        // Отображение отчета Gemini
        <div className="prose prose-invert max-w-none">
          <div className="rounded-xl border border-white/10 bg-background/70 p-6 max-h-96 overflow-auto">
            {formatGeminiReport(geminiReport)}
          </div>
        </div>
      ) : (
        // Стандартное отображение
        <div className="grid gap-6 md:grid-cols-2">
          {/* Статистика */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted mb-3">Статистика дефектов</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-background/70 px-4 py-3">
                <span className="text-text">Всего дефектов</span>
                <span className="text-lg font-semibold text-text">{insights.stats.total}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-background/70 px-4 py-3">
                <span className="text-text">Критические</span>
                <span className="text-lg font-semibold text-red-400">{insights.stats.critical}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-background/70 px-4 py-3">
                <span className="text-text">Незначительные</span>
                <span className="text-lg font-semibold text-yellow-400">{insights.stats.minor}</span>
              </div>
            </div>
          </div>

          {/* Рекомендации */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted mb-3">Рекомендации</h4>
            <ul className="space-y-2">
              {insights.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3 rounded-xl border border-white/10 bg-background/70 px-4 py-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-text">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Детали дефектов - показываем всегда */}
      {detections && detections.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted mb-3">Обнаруженные дефекты</h4>
          <div className="grid gap-2 max-h-48 overflow-auto">
            {detections.map((detection, index) => (
              <div key={index} className="flex items-center justify-between rounded-xl border border-white/10 bg-background/70 px-4 py-2">
                <div>
                  <span className="text-text font-medium">{detection.class}</span>
                  <span className="text-xs text-muted ml-2">
                    Координаты: [{detection.bbox.map(v => v.toFixed(1)).join(", ")}]
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    detection.confidence > 0.8 ? 'text-red-400' : 
                    detection.confidence > 0.6 ? 'text-yellow-400' : 'text-blue-400'
                  }`}>
                    {(detection.confidence * 100).toFixed(1)}%
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    detection.confidence > 0.8 ? 'bg-red-400' : 
                    detection.confidence > 0.6 ? 'bg-yellow-400' : 'bg-blue-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}