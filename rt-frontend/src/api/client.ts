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

export async function detectDefects(params: { file: File; confidence?: number }): Promise<DetectResponse> {
  const formData = new FormData()
  formData.append("image", params.file)
  if (typeof params.confidence === "number") {
    formData.append("confidence", params.confidence.toString())
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
