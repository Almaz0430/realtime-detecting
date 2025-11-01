import { NavLink, Route, Routes } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import ImageDetail from "./pages/ImageDetail"
import Settings from "./pages/Settings"

const navigation = [
  { to: "/", label: "Дашборд", description: "Показатели и события" },
  { to: "/details", label: "Детализация", description: "Анализ конкретной детали" },
  { to: "/settings", label: "Настройки", description: "Параметры алгоритмов" },
]

export default function App() {
  return (
    <div className="min-h-screen bg-background/95 text-text">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="flex w-full max-w-sm flex-col gap-10 border border-surface/70 bg-surface/80 p-6 shadow-xl shadow-black/30 lg:sticky lg:top-0 lg:h-screen lg:max-w-xs lg:p-7">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Панель контроля</p>
            <h1 className="mt-3 text-2xl font-semibold text-text">Quality Coating AI</h1>
            <p className="mt-2 text-sm text-muted">Система мониторинга покрасочной линии</p>
          </div>
          <nav className="flex flex-col gap-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  `group border px-5 py-4 transition rounded-2xl ${
                    isActive
                      ? "border-primary bg-primary/10 text-text"
                      : "border-transparent bg-background/60 text-muted hover:border-surface hover:text-text"
                  }`
                }
                end={item.to === "/"}
                to={item.to}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium uppercase tracking-[0.2em]">{item.label}</span>
                  <span className="text-xs text-muted transition group-hover:text-text">→</span>
                </div>
                <p className="mt-1 text-xs text-muted transition group-hover:text-text">{item.description}</p>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 border border-surface/70 bg-background/80 p-6 shadow-2xl shadow-black/40 lg:min-w-0">
          <Routes>
            <Route element={<Dashboard />} path="/" />
            <Route element={<ImageDetail />} path="/details" />
            <Route element={<Settings />} path="/settings" />
            <Route
              element={
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center text-muted">
                  <p className="text-sm uppercase tracking-[0.3em] text-muted">404</p>
                  <h2 className="text-2xl font-semibold text-text">Страница не найдена</h2>
                  <NavLink className="text-primary transition hover:text-primary-dark" to="/">
                    Вернуться на главную
                  </NavLink>
                </div>
              }
              path="*"
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}
