"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { Legend } from "@/components/dashboard/legend";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import type { AccuracyResponse } from "@/lib/api";
import { axisGw, gw, signedGw } from "@/lib/format";
import { ANIMATION, CHART_MARGIN, axisProps, gwTicks } from "./shared";

type Hour = AccuracyResponse["by_hour"][number];

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function HourlyErrorChart({ data }: { data: Hour[] }) {
  const c = useChartTokens();
  const axis = axisProps(c);
  const ticks = gwTicks(Math.max(...data.map((h) => Math.max(h.mae, h.bias))));

  return (
    <>
      <Legend
        items={[
          { label: "Mean absolute error", color: c.actual, shape: "box" },
          { label: "Bias", color: c.forecast },
        ]}
      />
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis {...axis} dataKey="hour" tickFormatter={(h) => String(h).padStart(2, "0")} interval={2} />
          <YAxis {...axis} ticks={ticks} domain={[Math.min(0, ...data.map((h) => h.bias)), ticks[ticks.length - 1]]} tickFormatter={axisGw} unit=" GW" width={64} />
          <Tooltip
            cursor={{ fill: c.grid, fillOpacity: 0.6 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const h = payload[0].payload as Hour;
              return (
                <ChartTooltip
                  title={hh(h.hour)}
                  rows={[
                    { color: c.actual, label: "MAE", value: gw(h.mae, 2) },
                    { color: c.forecast, label: "Bias", value: signedGw(h.bias, 2) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="mae" fill={c.actual} radius={[4, 4, 0, 0]} maxBarSize={16} {...ANIMATION} />
          <Line dataKey="bias" stroke={c.forecast} strokeWidth={2} dot={false} {...ANIMATION} />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
}
