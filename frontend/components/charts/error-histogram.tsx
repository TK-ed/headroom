"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { useChartTokens } from "@/hooks/use-chart-tokens";
import type { AccuracyResponse } from "@/lib/api";
import { signedGw } from "@/lib/format";
import { ANIMATION, CHART_MARGIN, axisProps } from "./shared";

type Bin = AccuracyResponse["histogram"][number];

/** Hours per 0.5 GW error bin. Bars right of zero are hours where wind fell short. */
export function ErrorHistogram({ data }: { data: Bin[] }) {
  const c = useChartTokens();
  const axis = axisProps(c);

  return (
    <ResponsiveContainer width="100%" height={286}>
      <BarChart data={data} margin={CHART_MARGIN} barCategoryGap={2}>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis {...axis} dataKey="from_mw" tickFormatter={(v) => (v / 1000).toFixed(1)} interval={1} />
        <YAxis {...axis} allowDecimals={false} width={48} />
        <ReferenceLine x={0} stroke={c.axis} strokeOpacity={0.5} />
        <Tooltip
          cursor={{ fill: c.grid, fillOpacity: 0.6 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const b = payload[0].payload as Bin;
            return (
              <ChartTooltip
                title={`Error ${signedGw(b.from_mw)} to ${signedGw(b.to_mw)}`}
                rows={[{ color: c.actual, label: "Hours", value: String(b.count) }]}
              />
            );
          }}
        />
        <Bar dataKey="count" fill={c.actual} radius={[4, 4, 0, 0]} maxBarSize={24} {...ANIMATION} />
      </BarChart>
    </ResponsiveContainer>
  );
}
