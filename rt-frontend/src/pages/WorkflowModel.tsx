import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import SettingsControls, { type SliderField, type ToggleField } from "../components/SettingsControls"

const presetPresets = {
  image: {
    defectThreshold: 16,
    coverageSensitivity: 78,
    glossLevel: 52,
    autoNotify: true,
    saveReference: false,
  },
  video: {
    defectThreshold: 12,
    coverageSensitivity: 84,
    glossLevel: 60,
    autoNotify: true,
    saveReference: true,
  },
} as const

type ModeKey = keyof typeof presetPresets

type LocationState = {
  mode?: ModeKey
}

export default function WorkflowModel() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const mode = (state as LocationState | null)?.mode ?? "image"

  const [settings, setSettings] = useState(presetPresets[mode])
  const [advanced, setAdvanced] = useState(false)

  const sliders: SliderField[] = useMemo(
    () => [
      {
        id: "defectThreshold",
        label: "Порог дефектов (% площади)",
        value: settings.defectThreshold,
        min: 5,
        max: 40,
        unit: "%",
      },
      {
        id: "coverageSensitivity",
        label: "Чувствительность покрытия",
        value: settings.coverageSensitivity,
        min: 30,
        max: 100,
        unit: "%",
      },
      {
        id: "glossLevel",
        label: "Контроль блеска",
        value: settings.glossLevel,
        min: 10,
        max: 100,
        unit: "%",
      },
    ],
    [settings.coverageSensitivity, settings.defectThreshold, settings.glossLevel],
  )

  const toggles: ToggleField[] = useMemo(
    () => [
      {
        id: "autoNotify",
        label: "Автоматические уведомления",
        description: "Присылать предупреждения при превышении порогов",
        checked: settings.autoNotify,
      },
      {
        id: "saveReference",
        label: "Сохранять эталонные кадры",
        description: "Использовать исторические данные для автокалибровки",
        checked: settings.saveReference,
      },
    ],
    [settings.autoNotify, settings.saveReference],
  )

  const resetToDefaults = (modeKey: ModeKey) => {
    setSettings(presetPresets[modeKey])
  }

  const handleProceed = () => {
    navigate("/workflow/detection", { state: { settings, mode, advanced } })
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="space-y-4">
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.4em] text-muted">
          <span className="rounded-full border border-primary px-3 py-1 text-primary">Шаг 2</span>
          <span>Настройка модели</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-text">Подберём параметры детекции</h1>
          <p className="max-w-3xl text-muted">
            Мы предложили значения по умолчанию для режима «{mode === "image" ? "Статичные кадры" : "Загрузка видео"}». Вы можете оставить
            их или скорректировать вручную.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-primary px-4 py-2 text-sm text-primary">
          Режим: {mode === "image" ? "статичные кадры" : "загрузка видео"}
        </span>
        <button
          className={`rounded-full border px-4 py-2 text-sm transition ${
            advanced ? "border-primary text-primary" : "border-surface/70 text-muted hover:border-primary hover:text-text"
          }`}
          onClick={() => setAdvanced((prev) => !prev)}
          type="button"
        >
          Продвинутая настройка
        </button>
        <button
          className="rounded-full border border-surface/70 px-4 py-2 text-sm text-muted transition hover:border-primary hover:text-text"
          onClick={() => resetToDefaults(mode)}
          type="button"
        >
          Вернуть параметры по умолчанию
        </button>
      </div>

      <div>
        <Link className="inline-flex items-center gap-2 text-sm text-primary transition hover:text-primary-dark" to="/">
          <span>←</span>
          <span>Назад к выбору входных данных</span>
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-surface/70 bg-surface/90 p-6 shadow-xl shadow-black/30">
          <SettingsControls
            onSliderChange={(id, value) => setSettings((prev) => ({ ...prev, [id]: value }))}
            onToggleChange={(id, checked) => setSettings((prev) => ({ ...prev, [id]: checked }))}
            sliders={sliders}
            toggles={toggles}
          />
        </div>
        <aside className="flex flex-col gap-4 rounded-3xl border border-surface bg-background/60 p-6 text-sm text-muted">
          <h2 className="text-lg font-semibold text-text">Что входит в продвинутый режим?</h2>
          <ul className="space-y-3">
            <li className="rounded-2xl border border-surface/70 bg-background/80 p-4">
              Настройка зон интереса по шаблону детали и уточнение масок.
            </li>
            <li className="rounded-2xl border border-surface/70 bg-background/80 п-4">
              Каскадные модели для разных этапов линий — грунт, цвет, лак.
            </li>
            <li className="rounded-2xl border border-surface/70 bg-background/80 p-4">
              Адаптивное обучение на основе последних 100 результатов.
            </li>
          </ul>
        </aside>
      </section>

      <div className="flex justify-end gap-3">
        <button
          className="rounded-full border border-surface/70 px-6 py-3 text-sm text-muted transition hover:border-primary hover:text-text"
          onClick={() => resetToDefaults(mode)}
          type="button"
        >
          Сбросить
        </button>
        <button
          className="rounded-full border border-transparent bg-primary px-6 py-3 text-sm font-medium text-text transition hover:bg-primary-dark"
          onClick={handleProceed}
          type="button"
        >
          Запустить детекцию
        </button>
      </div>
    </div>
  )
}
