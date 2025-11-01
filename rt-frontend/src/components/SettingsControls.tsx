import type { ChangeEvent } from "react"

export type SliderField = {
  id: string
  label: string
  value: number
  min: number
  max: number
  unit?: string
}

export type ToggleField = {
  id: string
  label: string
  description?: string
  checked: boolean
}

export type SettingsControlsProps = {
  sliders: SliderField[]
  toggles: ToggleField[]
  onSliderChange?: (id: string, value: number) => void
  onToggleChange?: (id: string, checked: boolean) => void
  onReset?: () => void
  onSave?: () => void
}

export default function SettingsControls({
  sliders,
  toggles,
  onSliderChange,
  onToggleChange,
  onReset,
  onSave,
}: SettingsControlsProps) {
  const handleSlider = (event: ChangeEvent<HTMLInputElement>, id: string) => {
    onSliderChange?.(id, Number(event.target.value))
  }

  const formatUnit = (value: string | undefined) => (value ? ` ${value}` : "")

  return (
    <form className="space-y-6">
      {sliders.map((slider) => (
        <div key={slider.id}>
          <label className="flex items-center justify-between text-sm text-muted" htmlFor={slider.id}>
            {slider.label}
            <span className="text-text">
              {slider.value}
              {formatUnit(slider.unit)}
            </span>
          </label>
          <input
            className="mt-2 h-2 w-full appearance-none rounded-full bg-background accent-primary"
            id={slider.id}
            max={slider.max}
            min={slider.min}
            onChange={(event) => handleSlider(event, slider.id)}
            type="range"
            value={slider.value}
          />
        </div>
      ))}

      <div className="space-y-3 rounded-2xl border border-surface bg-background/60 p-4">
        {toggles.map((toggle) => (
          <label key={toggle.id} className="flex items-start justify-between gap-4 text-sm text-muted" htmlFor={toggle.id}>
            <span>
              <span className="block text-text">{toggle.label}</span>
              {toggle.description ? <span className="text-xs text-muted">{toggle.description}</span> : null}
            </span>
            <input
              checked={toggle.checked}
              className="mt-0.5 h-5 w-5 rounded border border-surface/70 bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              id={toggle.id}
              onChange={(event) => onToggleChange?.(toggle.id, event.target.checked)}
              type="checkbox"
            />
          </label>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button
          className="rounded-full border border-surface/70 bg-surface px-4 py-2 text-sm text-muted transition hover:border-primary hover:text-text"
          onClick={onReset}
          type="button"
        >
          Сбросить
        </button>
        <button
          className="rounded-full border border-transparent bg-primary px-4 py-2 text-sm font-medium text-text transition hover:bg-primary-dark"
          onClick={onSave}
          type="button"
        >
          Сохранить настройки
        </button>
      </div>
    </form>
  )
}
