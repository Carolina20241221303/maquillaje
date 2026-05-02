const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const ABSOLUTE_URL_REGEX = /^https?:\/\//i
const LOCAL_IMAGE_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', 'backend', 'maquillaje_backend'])

function getNormalizedBaseUrl(): string {
  return ABSOLUTE_URL_REGEX.test(API_BASE)
    ? API_BASE
    : `${window.location.origin}${API_BASE.startsWith('/') ? API_BASE : `/${API_BASE}`}`
}

export function resolveImageUrl(rawUrl?: string | null, cacheBuster?: number): string | null {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return null

  let resolved: string
  if (ABSOLUTE_URL_REGEX.test(trimmed)) {
    try {
      const parsed = new URL(trimmed)
      if (LOCAL_IMAGE_HOSTS.has(parsed.hostname)) {
        resolved = new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, getNormalizedBaseUrl()).toString()
      } else {
        resolved = parsed.toString()
      }
    } catch {
      resolved = trimmed
    }
  } else {
    const normalizedBase = getNormalizedBaseUrl()
    const normalizedPath = trimmed.startsWith('static/') ? `/${trimmed}` : trimmed
    resolved = new URL(normalizedPath, normalizedBase).toString()
  }

  if (!cacheBuster) return resolved
  const separator = resolved.includes('?') ? '&' : '?'
  return `${resolved}${separator}v=${cacheBuster}`
}
