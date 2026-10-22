import type { MeasurementAdapter } from './measurement';

/** Handoff boundary. Replace this with the agreed device/API implementation.
 * No invented endpoints, fabricated audio, or random analysis results.
 * A health-check response alone must not set available=true.
 */
export function getMeasurementAdapter(baseUrl: string): MeasurementAdapter {
  void baseUrl; // Reserved for the backend adapter.
  const unavailable = async (): Promise<never> => { throw new Error('硬體與分析服務尚未串接。'); };
  return { available: false, capture: unavailable, upload: unavailable, poll: unavailable };
}
