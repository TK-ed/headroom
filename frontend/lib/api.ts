// Types and fetch helpers for the FastAPI backend.
// The browser always calls same-origin /api/*; app/api/[...path]/route.ts proxies to the backend.

export type Summary = {
  n: number;
  mae: number;
  rmse: number;
  bias: number;
  nmae_pct: number | null;
  p10: number;
  p50: number;
  p90: number;
  max_over: number;
  max_under: number;
  mean_actual: number;
};

export type Meta = {
  decision_window: [string, string];
  delivery_days: string[];
  default_cutoff: string;
  timezone: string;
  forecast_publish_times: string[];
  rows: { actuals: number; forecasts: number };
  source: string;
};

export type DayPoint = {
  time: string;
  forecast: number | null;
  actual: number | null;
  error: number | null;
  publish_time: string | null;
  horizon_h: number | null;
};

export type DayResponse = {
  date: string;
  decision_time: string;
  forecast_publish_time: string | null;
  points: DayPoint[];
  actuals_half_hourly: { time: string; actual: number }[];
  summary: Summary | null;
  energy_mwh: { forecast: number; actual: number };
};

export type AccuracyResponse = {
  cutoff: string;
  overall: Summary;
  by_hour: (Summary & { hour: number })[];
  daily: { date: string; mae: number; bias: number; mean_actual: number }[];
  histogram: { from_mw: number; to_mw: number; count: number }[];
  by_horizon: { from_h: number; to_h: number; n: number; mae: number; bias: number; p10: number; p90: number }[];
  decision_horizon_h: [number, number] | null;
  coverage: { hours: number; scored: number };
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

export const api = {
  meta: () => get<Meta>("/api/meta"),
  day: (date: string, cutoff: string) => get<DayResponse>(`/api/day?date=${date}&cutoff=${cutoff}`),
  accuracy: (cutoff: string) => get<AccuracyResponse>(`/api/accuracy?cutoff=${cutoff}`),
};
