export const BACK_BASE_URL = import.meta.env.VITE_BACK_BASE_URL as string

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `요청이 실패했습니다 (${res.status})`)
  }
  return res.json() as Promise<T>
}

export function apiUrl(path: string, params?: Record<string, string | undefined>): string {
  const url = new URL(path, BACK_BASE_URL)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }
  return url.toString()
}

export async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const res = await fetch(apiUrl(path, params))
  return parseJsonOrThrow<T>(res)
}

export async function apiPostForm<T>(path: string, form: Record<string, string>): Promise<T> {
  const body = new URLSearchParams(form)
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  return parseJsonOrThrow<T>(res)
}

export async function apiPostQuery<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(apiUrl(path, params), { method: 'POST' })
  return parseJsonOrThrow<T>(res)
}

export async function apiPostJson<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return parseJsonOrThrow<T>(res)
}

// back이 엑셀 미리보기 응답에 내려주는 downloadPath/savePath는
// frontt 프록시 라우트 기준 경로("/pogo/5pc/download")이므로,
// back의 실제 API 경로("/api/pogo/5pc/download")로 보정한다.
export function toBackApiPath(frontProxyPath: string): string {
  return `/api${frontProxyPath}`
}
