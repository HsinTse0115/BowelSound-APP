export interface AnalysisResult {
  status: 'normal' | 'abnormal';
  frequency: number | null;
  confidence: number | null;
  notes: string;
  waveform: number[];
  spectrogram: number[][];
}
export interface MeasurementResult {
  id: string;
  patientId: string;
  duration: number;
  createdAt: string;
  aiResult: AnalysisResult;
}
export interface MeasurementInput {
  patientId: string;
  hasCaffeine?: boolean;
  symptoms: string[];
  mealTime: string;
}
export interface CapturedAudio {
  uri: string;
  mimeType: string;
  duration: number;
  decibelLevel?: number;
}
export type JobReply = { status: 'processing'; jobId: string }
  | { status: 'completed'; result: MeasurementResult }
  | { status: 'insufficient_audio' }
  | { status: 'failed' };
export type Phase = 'idle' | 'recording' | 'uploading' | 'analyzing' | 'completed' | 'insufficient_audio' | 'analysis_failed' | 'failed' | 'cancelled';
export interface MeasurementState { phase: Phase; message: string; seconds?: number; result?: MeasurementResult }
/** Implement this adapter with the agreed hardware protocol and backend contract.
 * upload MUST send requestId as a server-enforced idempotency key.
 * capture MUST stop at maxSeconds and release the device when aborted.
 */
export interface MeasurementAdapter {
  available: boolean;
  capture: (options: { maxSeconds: number; signal: AbortSignal; onSeconds: (seconds: number) => void }) => Promise<CapturedAudio>;
  upload: (audio: CapturedAudio, input: MeasurementInput, requestId: string, signal: AbortSignal) => Promise<JobReply>;
  poll: (jobId: string, signal: AbortSignal) => Promise<JobReply>;
}
export function validateResult(value: MeasurementResult, input: MeasurementInput, audio: CapturedAudio): MeasurementResult {
  const r = value?.aiResult;
  if (!value || typeof value.id !== 'string' || !value.id || value.patientId !== input.patientId
    || !Number.isFinite(value.duration) || value.duration <= 0 || value.duration > 20 || Math.abs(value.duration - audio.duration) > 0.1
    || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))
    || !r || !['normal', 'abnormal'].includes(r.status) || typeof r.notes !== 'string'
    || !(r.frequency === null || (Number.isFinite(r.frequency) && r.frequency >= 0))
    || !(r.confidence === null || (Number.isFinite(r.confidence) && r.confidence >= 0 && r.confidence <= 1))
    || !Array.isArray(r.waveform) || r.waveform.length > 10000 || !r.waveform.every(v => Number.isFinite(v) && Math.abs(v) <= 1)
    || !Array.isArray(r.spectrogram) || r.spectrogram.length > 256
    || !r.spectrogram.every(row => Array.isArray(row) && row.length <= 256 && row.every(v => Number.isFinite(v) && v >= 0 && v <= 255))) {
    throw new Error('分析資料格式不正確，請聯絡系統管理員。');
  }
  return value;
}
function abortError() { const error = new Error('已取消'); error.name = 'AbortError'; return error; }
function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(abortError()); return; }
    const cancel = () => { clearTimeout(timer); reject(abortError()); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, ms);
    signal.addEventListener('abort', cancel, { once: true });
  });
}
// Abort and timeout even if a faulty adapter never settles its promise.
async function bounded<T>(operation: (signal: AbortSignal) => Promise<T>, parent: AbortSignal, timeout: number): Promise<T> {
  const child = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  let cancel: () => void = () => {};
  try {
    return await Promise.race([new Promise<T>((_, reject) => {
      cancel = () => { child.abort(); reject(abortError()); };
      parent.addEventListener('abort', cancel, { once: true });
      timer = setTimeout(() => { child.abort(); reject(new Error('連線逾時，請重試。')); }, timeout);
      if (parent.aborted) cancel();
    }), Promise.resolve().then(() => {
      if (child.signal.aborted) throw abortError();
      return operation(child.signal);
    })]);
  } finally { clearTimeout(timer!); parent.removeEventListener('abort', cancel); child.abort(); }
}
/** One session per measurement. Retrying reuses the audio/request ID or polls the
 * existing job. It never creates a new upload after receiving a job ID.
 */
export class MeasurementSession {
  private controller?: AbortController;
  private audio?: CapturedAudio;
  private jobId?: string;
  private running = false;
  private terminal = false;
  constructor(private adapter: MeasurementAdapter, private input: MeasurementInput, private requestId: string,
    private emit: (state: MeasurementState) => void,
    private timing = { requestMs: 30000, pollMs: 2000, maxPolls: 60 }) {}
  cancel() { this.controller?.abort(); this.terminal = true; }
  async run() {
    if (this.running || this.terminal) return;
    this.running = true;
    this.controller = new AbortController();
    const signal = this.controller.signal;
    try {
      if (!this.adapter.available) throw new Error('硬體與分析服務尚未串接，無法開始量測。');
      if (!this.audio) {
        this.emit({ phase: 'recording', message: '收音中，最長 20 秒。', seconds: 0 });
        this.audio = await bounded(s => this.adapter.capture({ maxSeconds: 20, signal: s,
          onSeconds: seconds => { if (!signal.aborted && !s.aborted) this.emit({ phase: 'recording', message: '收音中', seconds: Math.min(20, Math.max(0, seconds)) }); },
        }), signal, 25000);
        if (!this.audio?.uri || !this.audio.mimeType || !Number.isFinite(this.audio.duration) || this.audio.duration <= 0 || this.audio.duration > 20) {
          this.audio = undefined;
          throw new Error('沒有收到有效的音訊，請確認裝置後重試。');
        }
      }
      let reply: JobReply;
      if (this.jobId) {
        this.emit({ phase: 'analyzing', message: '正在查詢分析結果…' });
        reply = await bounded(s => this.adapter.poll(this.jobId!, s), signal, this.timing.requestMs);
      } else {
        this.emit({ phase: 'uploading', message: '音訊上傳中，請稍候…' });
        reply = await bounded(s => this.adapter.upload(this.audio!, this.input, this.requestId, s), signal, this.timing.requestMs);
      }
      let polls = 0;
      while (reply?.status === 'processing') {
        if (typeof reply.jobId !== 'string' || !reply.jobId || (this.jobId && reply.jobId !== this.jobId)) throw new Error('分析工作編號不一致，請聯絡系統管理員。');
        this.jobId = reply.jobId;
        this.emit({ phase: 'analyzing', message: '分析中，請稍候…' });
        if (polls++ >= this.timing.maxPolls) throw new Error('分析仍在進行，請稍後按重試查詢結果，不需重新收音。');
        await wait(this.timing.pollMs, signal);
        reply = await bounded(s => this.adapter.poll(this.jobId!, s), signal, this.timing.requestMs);
      }
      if (signal.aborted) throw abortError();
      if (reply?.status === 'insufficient_audio') {
        this.terminal = true;
        this.emit({ phase: 'insufficient_audio', message: '收音品質不足，無法分析。請確認裝置位置與環境後重新量測。' });
      } else if (reply?.status === 'completed') {
        const result = validateResult(reply.result, this.input, this.audio);
        this.terminal = true;
        this.emit({ phase: 'completed', message: '分析完成', result });
      } else if (reply?.status === 'failed') {
        // A terminal server failure cannot be restarted by polling; offer a new capture.
        this.terminal = true;
        this.emit({ phase: 'analysis_failed', message: '這次分析未成功，沒有產生結果。請重新量測。' });
      } else throw new Error('伺服器回應格式不正確，請重試或聯絡系統管理員。');
    } catch (error) {
      this.emit({ phase: signal.aborted ? 'cancelled' : 'failed', message: signal.aborted
        ? '已停止本次操作。已送出的資料可能仍由伺服器處理。'
        : error instanceof Error ? error.message : '連線失敗，請重試。' });
    } finally { this.running = false; }
  }
}
