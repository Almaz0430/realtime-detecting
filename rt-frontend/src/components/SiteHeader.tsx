import { useState } from "react"

const locales = [
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
] as const

type Locale = (typeof locales)[number]["id"]

export default function SiteHeader() {
  const [activeLocale, setActiveLocale] = useState<Locale>("ru")

  return (
    <header className="w-full border-b border-white/10 bg-surface text-text shadow-lg shadow-black/30">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted">Paint Defect Detection System</p>
            <h1 className="text-xl font-semibold text-text">Monitoring Console</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span className="text-xs uppercase tracking-[0.35em] text-muted">Язык</span>
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-background/40 px-2 py-1">
            {locales.map((locale) => {
              const isActive = locale.id === activeLocale
              return (
                <button
                  key={locale.id}
                  className={`rounded-full px-3 py-1 transition ${
                    isActive ? "bg-primary text-text shadow-md shadow-primary/40" : "text-muted hover:bg-primary/20 hover:text-text"
                  }`}
                  onClick={() => setActiveLocale(locale.id)}
                  type="button"
                >
                  {locale.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
