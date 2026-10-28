"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { Legend } from "@/components/dashboard/legend";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import { axisGw, gw, ukTime } from "@/lib/format";
import { ANIMATION, CHART_MARGIN, axisProps } from "./shared";

export type DayRow = { t: number; actual?: number; forecast?: number; band?: [number, number] };

/** Forecast at decision time, its likely range, and the half-hourly actual. */
export function DayForecastChart({ rows }: { rows: DayRow[] }) {
  const c = useChartTokens();
  const axis = axisProps(c);

  return (
    <>
      <Legend
        items={[
          { label: "Forecast at decision time", color: c.forecast },
          { label: "Likely range (P10–P90 of January errors)", color: c.band, shape: "box" },
          { label: "Actual", color: c.actual },
        ]}
      />
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={rows} margin={CHART_MARGIN}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis
            {...axis}
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t) => ukTime(new Date(t).toISOString())}
            minTickGap={44}
          />
          <YAxis {...axis} tickFormatter={axisGw} domain={[0, "auto"]} unit=" GW" width={64} />
          <Tooltip
            cursor={{ stroke: c.axis, strokeOpacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload as DayRow;
              const out = [];
              if (r.forecast != null) out.push({ color: c.forecast, label: "Forecast", value: gw(r.forecast, 2) });
              if (r.band) out.push({ color: c.band, label: "Range", value: `${gw(r.band[0])} – ${gw(r.band[1])}` });
              if (r.actual != null) out.push({ color: c.actual, label: "Actual", value: gw(r.actual, 2) });
              return <ChartTooltip title={ukTime(new Date(label as number).toISOString())} rows={out} />;
            }}
          />
          <Area dataKey="band" stroke="none" fill={c.band} fillOpacity={1} connectNulls {...ANIMATION} />
          <Line dataKey="forecast" stroke={c.forecast} strokeWidth={2} dot={false} connectNulls {...ANIMATION} />
          <Line dataKey="actual" stroke={c.actual} strokeWidth={2} dot={false} connectNulls {...ANIMATION} />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
