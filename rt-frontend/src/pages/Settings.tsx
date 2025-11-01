import { useMemo, useState } from "react"
import SettingsControls, { type SliderField, type ToggleField } from "../components/SettingsControls"

const initialSettings = {
  defectThreshold: 18,
  coverageSensitivity: 72,
  glossLevel: 54,
  autoNotify: true,
  saveReference: false,
}

export default function Settings() {
  const [settings, setSettings] = useState(initialSettings)

  const sliderFields: SliderField[] = useMemo(
    () => [
      {
        id: "defectThreshold",
        label: "Порог дефектов (% площади)",
        value: settings.defectThreshold,
        min: 5,
        max: 50,
        unit: "%",
      },
      {
        id: "coverageSensitivity",
        label: "Чувствительность покрытия",
        value: settings.coverageSensitivity,
        min: 20,
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

  const toggleFields: ToggleField[] = useMemo(
    () => [
      {
        id: "autoNotify",
        label: "Автоматические уведомления об аномалиях",
        description: "Отправлять сообщения при превышении порога дефектов",
        checked: settings.autoNotify,
      },
      {
        id: "saveReference",
        label: "Сохранять эталонные снимки",
        description: "Использовать последние 50 деталей для автокалибровки",
        checked: settings.saveReference,
      },
    ],
    [settings.autoNotify, settings.saveReference],
  )

  const handleSliderChange = (id: string, value: number) => {
    setSettings((prev) => ({ ...prev, [id]: value }))
  }

  const handleToggleChange = (id: string, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [id]: checked }))
  }

  const handleReset = () => setSettings(initialSettings)
  const handleSave = () => console.log("settings", settings)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-text">Настройки анализа</h1>
        <p className="text-muted">
          Управляйте алгоритмами контроля качества и пороговыми значениями для автоматического обнаружения дефектов
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-surface/70 bg-surface/90 p-6 shadow-xl shadow-black/30">
          <SettingsControls
            onReset={handleReset}
            onSave={handleSave}
            onSliderChange={handleSliderChange}
            onToggleChange={handleToggleChange}
            sliders={sliderFields}
            toggles={toggleFields}
          />
        </div>

        <aside className="flex flex-col gap-6 rounded-3xl border border-surface/70 bg-surface/80 p-6 shadow-xl shadow-black/30">
          <div>
            <h2 className="text-lg font-medium text-text">Профиль линии</h2>
            <p className="text-sm text-muted">Гибкая настройка порогов для каждой серии деталей</p>
          </div>
          <div className="grid gap-3 text-sm text-muted">
            <div className="rounded-2xl border border-surface bg-background/70 p-4">
              <p className="text-text">Серия 480-490</p>
              <p>Стандарт: дефекты &lt; 12%, покрытия &gt; 96%</p>
            </div>
            <div className="rounded-2xl border border-surface bg-background/70 p-4">
              <p className="text-text">Серия 500-520</p>
              <p>Стандарт: дефекты &lt; 8%, покрытия &gt; 98%</p>
            </div>
            <div className="rounded-2xl border border-surface bg-background/70 p-4">
              <p className="text-text">Пилотная серия</p>
              <p>Автокалибровка на основе последних 50 деталей</p>
            </div>
          </div>
          <div className="rounded-2xl border border-surface bg-background/60 p-4 text-sm text-muted">
            <p className="text-text">Совет</p>
            <p className="mt-2">
              Используйте динамический порог для деталей с увеличенным временем полимеризации — система автоматически пересчитает
              эталон.
            </p>
          </div>
        </aside>
      </section>
    </div>
  )
}
