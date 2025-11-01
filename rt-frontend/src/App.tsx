import ScrollToTop from "./components/ScrollToTop"
import SiteHeader from "./components/SiteHeader"
import DetectionPage from "./pages/DetectionPage"

export default function App() {
  return (
    <div className="min-h-screen bg-background/95 text-text">
      <ScrollToTop />
      <SiteHeader />
      <main>
        <DetectionPage />
      </main>
    </div>
  )
}
