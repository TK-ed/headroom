const UK = "Europe/London";

export const gw = (mw: number, digits = 1) => `${(mw / 1000).toFixed(digits)} GW`;

export const signedGw = (mw: number, digits = 1) => `${mw >= 0 ? "+" : "−"}${gw(Math.abs(mw), digits)}`;

export const gwh = (mwh: number) => `${(mwh / 1000).toFixed(0)} GWh`;

export const pct = (v: number | null) => (v == null ? "–" : `${v.toFixed(1)}%`);

export const ukTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { timeZone: UK, hour: "2-digit", minute: "2-digit" });

export const ukDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: UK,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const ukDate = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export const axisGw = (mw: number) => {
  const v = mw / 1000;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};
