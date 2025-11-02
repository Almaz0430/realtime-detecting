export type Detection = {
  bbox: [number, number, number, number]
  class: string
  confidence: number
  class_id: number
}

export type DetectResponse = {
  success: true
  detections: Detection[]
  defect_counts: Record<string, number>
  total_defects: number
  result_image: string
  timestamp: string
  gemini_report?: string
}

export type DetectErrorResponse = {
  success: false
  error: string
}

export type ModelInfoResponse =
  | {
      loaded: true
      model_path: string
      classes: string[]
      colors: Record<string, [number, number, number]>
    }
  | {
      loaded: false
      error: string
    }

export type HealthResponse = {
  status: string
  model_loaded: boolean
  timestamp: string
}

export type ApiInfoResponse = {
  name: string
  version: string
  description: string
  endpoints: Record<string, string>
  model_loaded: boolean
  timestamp: string
}

export type DetectionStats = {
  timestamp: string;
  total_defects: number;
  defect_counts: Record<string, number>;
  confidence_threshold: number;
};

export class ApiError extends Error {
  readonly status: number
  readonly payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

const DEFAULT_API_BASE = "http://localhost:5000"
const API_BASE = (import.meta.env.VITE_API_BASE ?? DEFAULT_API_BASE).replace(/\/$/, "")

function withBase(path: string) {
  if (!API_BASE) {
    return path
  }
  return `${API_BASE}${path}`
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    return {} as T
  }
  try {
    return JSON.parse(text) as T
  } catch (error) {
    throw new ApiError("Failed to parse server response", response.status, text)
  }
}

async function ensureOk<T>(response: Response): Promise<T> {
  const data = await parseJson<T>(response)
  if (!response.ok) {
    throw new ApiError("Request failed", response.status, data)
  }
  return data
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(withBase("/api/health"), {
    headers: { Accept: "application/json" },
  })
  return ensureOk<HealthResponse>(response)
}

export async function fetchModelInfo(): Promise<ModelInfoResponse> {
  const response = await fetch(withBase("/api/model_info"), {
    headers: { Accept: "application/json" },
  })
  return ensureOk<ModelInfoResponse>(response)
}

export async function fetchApiInfo(): Promise<ApiInfoResponse> {
  const response = await fetch(withBase("/"), {
    headers: { Accept: "application/json" },
  })
  return ensureOk<ApiInfoResponse>(response)
}

export async function getStats(): Promise<DetectionStats[]> {
  const response = await fetch(withBase("/api/stats"), {
    headers: { Accept: "application/json" },
  });
  return ensureOk<DetectionStats[]>(response);
}

export async function detectDefects(params: {
  file: File
  confidence?: number
  generateReport?: boolean
}): Promise<DetectResponse> {
  const formData = new FormData()
  formData.append("image", params.file)
  if (typeof params.confidence === "number") {
    formData.append("confidence", params.confidence.toString())
  }
  if (typeof params.generateReport === "boolean") {
    formData.append("generate_report", params.generateReport.toString())
  }

  const response = await fetch(withBase("/api/detect"), {
    method: "POST",
    body: formData,
  })

  const payload = await parseJson<DetectResponse | DetectErrorResponse>(response)
  if (!response.ok || !("success" in payload) || !payload.success) {
    const message = payload && "error" in payload && payload.error ? payload.error : "Detection request failed"
    throw new ApiError(message, response.status, payload)
  }

  return payload
}

// Video detection types
export type VideoDetectionFrame = {
  frame_number: number
  image: string
  defects_count: number
}

export type VideoDetectionResponse = {
  success: true
  summary: {
    total_detections: number
    processed_frames: number
    total_frames: number
    defect_counts: Record<string, number>
    defect_types: string[]
  }
  processing_stats: {
    total_detections: number
    processed_frames: number
    total_frames: number
    defect_summary: Record<string, number>
    output_path: string
  }
  output_filename: string
  video_url?: string
  extracted_frames: VideoDetectionFrame[]
  timestamp: string
}

export type VideoDetectionErrorResponse = {
  success: false
  error: string
}

export async function detectVideoDefects(params: {
  file: File
  confidence?: number
  skipFrames?: number
  extractFrames?: number
}): Promise<VideoDetectionResponse> {
  const formData = new FormData()
  formData.append("video", params.file)
  
  if (typeof params.confidence === "number") {
    formData.append("confidence", params.confidence.toString())
  }
  if (typeof params.skipFrames === "number") {
    formData.append("skip_frames", params.skipFrames.toString())
  }
  if (typeof params.extractFrames === "number") {
    formData.append("extract_frames", params.extractFrames.toString())
  }

  const response = await fetch(withBase("/api/detect_video"), {
    method: "POST",
    body: formData,
  })

  const payload = await parseJson<VideoDetectionResponse | VideoDetectionErrorResponse>(response)
  if (!response.ok || !("success" in payload) || !payload.success) {
    const message = payload && "error" in payload && payload.error ? payload.error : "Video detection request failed"
    throw new ApiError(message, response.status, payload)
  }

  return payload
}
