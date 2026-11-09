const DEFAULT_TIMEOUT_MS = 10000;
export class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); this.name = 'ApiError'; }
}
export function normalizeApiUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ApiError('尚未設定連線網址，請到「我的」完成連線設定。');
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : 'http://' + trimmed;
  let parsed: URL;
  try { parsed = new URL(withProtocol); } catch { throw new ApiError('網址格式不正確，請確認後再試。'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new ApiError('請輸入 http 或 https 網址，不含帳密、查詢參數或頁面標記。');
  }
  return parsed.toString().replace(/\/+$/, '');
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '操作未完成，請稍後再試。';
}
function aborted() { const error = new Error('已取消連線。'); error.name = 'AbortError'; return error; }
function httpError(status: number): ApiError {
  const message = status === 401 || status === 403 ? '目前無法存取這份資料，請聯絡管理人員。'
    : status === 404 ? '找不到資料或服務，請重新載入或確認連線網址。'
    : status === 409 ? '資料已有相關紀錄或已被修改，請重新載入後確認。'
    : status === 400 || status === 422 ? '填寫內容未被接受，請檢查欄位；若仍無法儲存，請聯絡管理人員。'
    : status === 413 ? '檔案太大，請選擇較小的音檔。'
    : status === 429 ? '操作太頻繁，請稍候再試。'
    : '服務暫時無法處理，請稍後再試。';
  return new ApiError(message, status);
}
async function request<T>(baseUrl: string, path: string, init: RequestInit, timeoutMs: number, read: (r: Response) => Promise<T>): Promise<T> {
  const url = normalizeApiUrl(baseUrl) + (path.startsWith('/') ? path : '/' + path);
  const controller = new AbortController();
  const parent = init.signal;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel = () => {};
  const writing = !['GET', 'HEAD'].includes((init.method || 'GET').toUpperCase());
  const uncertain = writing ? '尚未確認是否儲存成功，請先重新載入確認，避免重複送出。' : '請確認網路與連線網址後再試。';
  try {
    return await Promise.race([
      new Promise<never>((_, reject) => {
        cancel = () => { reject(aborted()); controller.abort(); };
        parent?.addEventListener('abort', cancel, { once: true });
        timer = setTimeout(() => { reject(new ApiError('連線逾時。' + uncertain)); controller.abort(); }, timeoutMs);
        if (parent?.aborted) cancel();
      }),
      Promise.resolve().then(async () => {
        if (controller.signal.aborted) throw aborted();
        let response: Response;
        try { response = await fetch(url, { ...init, signal: controller.signal }); }
        catch (cause) {
          if (controller.signal.aborted) throw aborted();
          throw new ApiError('無法連線。' + uncertain);
        }
        if (!response.ok) throw httpError(response.status);
        try { return await read(response); }
        catch (cause) {
          if (controller.signal.aborted) throw aborted();
          throw new ApiError('收到的資料格式不正確，請重新載入確認。');
        }
      }),
    ]);
  } finally { clearTimeout(timer); parent?.removeEventListener('abort', cancel); }
}
// Use apiJson for JSON responses so the timeout also covers reading the body.
export function apiRequest(baseUrl: string, path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return request(baseUrl, path, init, timeoutMs, async response => response);
}
export function apiJson<T>(baseUrl: string, path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return request(baseUrl, path, init, timeoutMs, response => response.json() as Promise<T>);
}
