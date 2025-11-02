import { useState } from "react";
import { VideoCameraIcon, PhotoIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import ScrollToTop from "./components/ScrollToTop";
import SiteHeader from "./components/SiteHeader";
import VideoDefectDetection from "./components/VideoDefectDetection";
import ImageDefectDetection from "./components/ImageDefectDetection";
import { type VideoDetectionResponse, type DetectResponse } from "./api/client";
import DashboardPage from "./pages/DashboardPage"; // Импортируем новую страницу

type AnalysisMode = "video" | "image" | "dashboard"; // Добавляем новый режим

export default function App() {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("image");

  const handleVideoAnalysisComplete = (result: VideoDetectionResponse) => {
    console.log('Анализ видео завершен:', result)
  }

  const handleImageAnalysisComplete = (result: DetectResponse) => {
    console.log('Анализ изображения завершен:', result)
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <ScrollToTop />
      <SiteHeader />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-white mb-8">
            Обнаружение дефектов окраски автомобилей
          </h1>
          
          {/* Переключатель режимов */}
          <div className="mb-8">
            <div className="flex rounded-xl border border-white/10 bg-gray-800/50 p-1">
              <button
                onClick={() => setAnalysisMode("image")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition flex items-center justify-center gap-2 ${
                  analysisMode === "image"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <PhotoIcon className="h-4 w-4" />
                Анализ изображения
              </button>
              <button
                onClick={() => setAnalysisMode("video")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition flex items-center justify-center gap-2 ${
                  analysisMode === "video"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <VideoCameraIcon className="h-4 w-4" />
                Анализ видео
              </button>
              <button // Добавляем кнопку для дашборда
                onClick={() => setAnalysisMode("dashboard")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition flex items-center justify-center gap-2 ${
                  analysisMode === "dashboard"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <ChartBarIcon className="h-4 w-4" />
                Аналитика
              </button>
            </div>
          </div>

          {/* Компоненты анализа */}
          {analysisMode === "video" ? (
            <VideoDefectDetection 
              onAnalysisComplete={handleVideoAnalysisComplete}
              className="w-full"
            />
          ) : analysisMode === "image" ? (
            <ImageDefectDetection 
              onAnalysisComplete={handleImageAnalysisComplete}
              className="w-full"
            />
          ) : (
            <DashboardPage />
          )}
        </div>
      </main>
    </div>
  );
}
