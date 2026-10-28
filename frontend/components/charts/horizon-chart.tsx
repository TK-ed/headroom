"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { Legend } from "@/components/dashboard/legend";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import type { AccuracyResponse } from "@/lib/api";
import { axisGw, gw, signedGw } from "@/lib/format";
import { ANIMATION, CHART_MARGIN, axisProps } from "./shared";

type Bucket = AccuracyResponse["by_horizon"][number] & { mid: number; band: [number, number] };

/** MAE and P10–P90 error by lead time; shades the horizons the desk actually uses. */
export function HorizonChart({ data, used }: { data: AccuracyResponse["by_horizon"]; used: [number, number] | null }) {
  const c = useChartTokens();
  const axis = axisProps(c);
  const rows: Bucket[] = data.map((h) => ({ ...h, mid: (h.from_h + h.to_h) / 2, band: [h.p10, h.p90] }));

  return (
    <>
      <Legend
        items={[
          { label: "Mean absolute error", color: c.forecast },
          { label: "P10–P90 error", color: c.band, shape: "box" },
          { label: "Horizons used at this decision time", color: c.grid, shape: "box" },
        ]}
      />
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={rows} margin={CHART_MARGIN}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          {used && <ReferenceArea x1={used[0]} x2={used[1]} fill={c.grid} fillOpacity={0.7} />}
          <XAxis {...axis} dataKey="mid" type="number" domain={[0, 48]} ticks={[0, 12, 24, 36, 48]} tickFormatter={(h) => `${h} h`} />
          <YAxis {...axis} tickFormatter={axisGw} unit=" GW" width={64} />
          <ReferenceLine y={0} stroke={c.axis} strokeOpacity={0.4} />
          <Tooltip
            cursor={{ stroke: c.axis, strokeOpacity: 0.4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const h = payload[0].payload as Bucket;
              return (
                <ChartTooltip
                  title={`${h.from_h}–${h.to_h} h ahead · ${h.n} forecasts`}
                  rows={[
                    { color: c.forecast, label: "MAE", value: gw(h.mae, 2) },
                    { color: c.band, label: "P10 / P90", value: `${signedGw(h.p10)} / ${signedGw(h.p90)}` },
                  ]}
                />
              );
            }}
          />
          <Area dataKey="band" stroke="none" fill={c.band} fillOpacity={1} {...ANIMATION} />
          <Line dataKey="mae" stroke={c.forecast} strokeWidth={2} dot={{ r: 4, fill: c.forecast, stroke: c.surface, strokeWidth: 2 }} {...ANIMATION} />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
