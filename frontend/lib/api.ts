type ApiErrorPayload = {
  message?: string
  error?: string
  success?: boolean
  needsVerification?: boolean
  bannedWord?: string
  timeoutUntil?: string
  timeoutReason?: string
}

export class ApiError extends Error {
  status: number
  payload?: ApiErrorPayload

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api'

async function parseErrorPayload(res: Response): Promise<ApiErrorPayload | undefined> {
  const contentType = res.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      return (await res.json()) as ApiErrorPayload
    }
    const text = await res.text()
    if (!text) return undefined
    return { message: text }
  } catch {
    return undefined
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`

  // Build headers - only add Content-Type for non-FormData bodies
  const headers: Record<string, string> = {}

  // Copy existing headers
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>
    Object.assign(headers, existingHeaders)
  }

  // Add Content-Type for non-FormData bodies if not already set
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  // Add Authorization header as fallback when cookie isn't available
  // This handles cases where SameSite cookies aren't sent (e.g., cross-site scenarios)
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('token')
    if (localToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${localToken}`
      console.log('[API] Added Authorization header from localStorage')
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!res.ok) {
    const payload = await parseErrorPayload(res)
    const message = payload?.message || `Request failed with status ${res.status}`

    throw new ApiError(res.status, message, payload)
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return (undefined as unknown) as T
  }

  const data = (await res.json()) as T

  // AUTO-STORE: If this is an auth response with a token, store it in localStorage immediately
  // This is the centralized fix for cross-domain production (Vercel → Render)  
  if (typeof window !== 'undefined' && data && typeof data === 'object' && 'token' in data) {
    const tokenValue = (data as any).token
    if (typeof tokenValue === 'string' && tokenValue.length > 0) {
      const isAuthEndpoint = path.includes('/auth/login') ||
        path.includes('/auth/register') ||
        path.includes('/auth/google-login')
      if (isAuthEndpoint) {
        try {
          window.localStorage.setItem('token', tokenValue)
          console.log('[API] Auto-stored auth token in localStorage')
        } catch (e) {
          console.error('[API] Failed to store token:', e)
        }
      }
    }
  }

  return data
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' })
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: body instanceof FormData ? body : (body === undefined ? undefined : JSON.stringify(body)),
  })
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: body instanceof FormData ? body : (body === undefined ? undefined : JSON.stringify(body)),
  })
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    body: body instanceof FormData ? body : (body === undefined ? undefined : JSON.stringify(body)),
  })
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' })
}
