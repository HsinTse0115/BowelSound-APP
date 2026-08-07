const DEFAULT_TIMEOUT_MS = 10000;

export function normalizeApiUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('請輸入 API 伺服器網址');

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('API 網址格式不正確');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('API 網址必須使用 http 或 https');
  }

  return parsed.toString().replace(/\/$/, '');
}

export async function apiRequest(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${normalizeApiUrl(baseUrl)}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('連線逾時，請確認伺服器位址與網路狀態');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
