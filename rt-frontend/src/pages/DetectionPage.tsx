import VideoDefectDetection from "../components/VideoDefectDetection"
import { type VideoDetectionResponse } from "../api/client"

export default function DetectionPage() {
  const handleAnalysisComplete = (result: VideoDetectionResponse) => {
    console.log('Анализ завершен:', result)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text mb-8">
          Обнаружение дефектов окраски автомобилей
        </h1>
        
        <VideoDefectDetection 
          onAnalysisComplete={handleAnalysisComplete}
          className="w-full"
        />
      </div>
    </div>
  )
}