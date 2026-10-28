"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import type { AccuracyResponse } from "@/lib/api";
import { axisGw, gw, signedGw, ukDate } from "@/lib/format";
import { ANIMATION, CHART_MARGIN, axisProps } from "./shared";

type Day = AccuracyResponse["daily"][number];

/** Daily bias; rounded end is always the data end, square at the zero line. */
export function DailyBiasChart({ data }: { data: Day[] }) {
  const c = useChartTokens();
  const axis = axisProps(c);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis {...axis} dataKey="date" tickFormatter={(d: string) => String(Number(d.slice(8)))} interval={2} />
        <YAxis {...axis} tickFormatter={axisGw} unit=" GW" width={64} />
        <ReferenceLine y={0} stroke={c.axis} strokeOpacity={0.5} />
        <Tooltip
          cursor={{ fill: c.grid, fillOpacity: 0.6 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as Day;
            return (
              <ChartTooltip
                title={ukDate(d.date)}
                rows={[
                  { color: c.forecast, label: "Bias", value: signedGw(d.bias, 2) },
                  { color: c.forecast, label: "MAE", value: gw(d.mae, 2) },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="bias" fill={c.forecast} maxBarSize={14} {...ANIMATION}>
          {data.map((d) => (
            <Cell key={d.date} radius={(d.bias >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]) as unknown as number} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
