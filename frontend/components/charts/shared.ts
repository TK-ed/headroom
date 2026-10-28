import type { ChartTokens } from "@/hooks/use-chart-tokens";

/** Common Recharts props so every chart shares one quiet axis/grid style. */
export function axisProps(t: ChartTokens) {
  return {
    tick: { fill: t.axis, fontSize: 12 },
    stroke: t.grid,
    tickLine: false,
  } as const;
}

export const CHART_MARGIN = { top: 8, right: 12, bottom: 4, left: -14 };

/** Subtle redraw when filters change; kept short so it never slows reading. */
export const ANIMATION = { animationDuration: 500, animationEasing: "ease-out" } as const;

/** Round GW ticks (0, 0.5, 1 ... or 0, 1, 2 ...) from zero up to the data max. */
export function gwTicks(maxMw: number): number[] {
  const step = maxMw <= 3000 ? 500 : maxMw <= 8000 ? 1000 : 2000;
  const top = Math.ceil(maxMw / step) * step;
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}
