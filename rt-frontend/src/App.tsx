import { NavLink, Route, Routes } from "react-router-dom"
import ScrollToTop from "./components/ScrollToTop"
import Dashboard from "./pages/Dashboard"
import ImageDetail from "./pages/ImageDetail"
import Settings from "./pages/Settings"
import WorkflowDetection from "./pages/WorkflowDetection"
import WorkflowModel from "./pages/WorkflowModel"
import WorkflowStart from "./pages/WorkflowStart"

export default function App() {
  return (
    <div className="min-h-screen bg-background/95 text-text">
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12">
        <ScrollToTop />
        <Routes>
          <Route element={<WorkflowStart />} path="/" />
          <Route element={<WorkflowModel />} path="/workflow/model" />
          <Route element={<WorkflowDetection />} path="/workflow/detection" />
          <Route element={<Dashboard />} path="/dashboard" />
          <Route element={<ImageDetail />} path="/details" />
          <Route element={<Settings />} path="/settings" />
          <Route
            element={
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center text-muted">
                <p className="text-sm uppercase tracking-[0.3em] text-muted">404</p>
                <h2 className="text-2xl font-semibold text-text">Страница не найдена</h2>
                <NavLink className="text-primary transition hover:text-primary-dark" to="/">
                  Вернуться к старту
                </NavLink>
              </div>
            }
            path="*"
          />
        </Routes>
      </main>
    </div>
  )
}
