"use client";

import { useState } from "react";
import { DailyBiasChart } from "@/components/charts/daily-bias-chart";
import { ErrorHistogram } from "@/components/charts/error-histogram";
import { HorizonChart } from "@/components/charts/horizon-chart";
import { HourlyErrorChart } from "@/components/charts/hourly-error-chart";
import { Callout } from "@/components/dashboard/callout";
import { Panel } from "@/components/dashboard/panel";
import { Stat, StatStrip } from "@/components/dashboard/stat-strip";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { CutoffSelect } from "@/components/filters/cutoff-select";
import { FilterBar } from "@/components/filters/filter-field";
import { PageHeader } from "@/components/layout/page-header";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/hooks/use-data";
import { api, type AccuracyResponse } from "@/lib/api";
import { gw, pct, signedGw, ukDate } from "@/lib/format";

export default function ForecastReviewPage() {
  const [cutoff, setCutoff] = useState("09:00");
  const { data, error } = useData(() => api.accuracy(cutoff), [cutoff]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const o = data.overall;
  const total = data.histogram.reduce((s, b) => s + b.count, 0);
  const tooHigh = data.histogram.filter((b) => b.from_mw >= 0).reduce((s, b) => s + b.count, 0);

  return (
    <Reveal>
      <PageHeader eyebrow="Forecast review · January 2026" title="How far can we trust the day-ahead wind forecast?">
        We scored all {o.n} delivery hours against the forecast the desk had at decision time. Error is forecast minus
        actual, so a positive number means the wind didn&apos;t turn up and the gap had to be bought.
      </PageHeader>

      <FilterBar>
        <CutoffSelect value={cutoff} onChange={setCutoff} />
      </FilterBar>

      <Callout title="Desk note">
        The forecast was too high in <b>{Math.round((100 * tooHigh) / total)}% of hours</b>, by {gw(o.bias, 2)} on
        average. To be covered 9 hours out of 10, plan on <b>{gw(o.p90)} less wind</b> than forecast.
      </Callout>

      <StatStrip>
        <Stat
          emphasis
          label="Mean absolute error"
          value={<CountUp value={o.mae / 1000} format={(v) => `${v.toFixed(2)} GW`} />}
          note={`${pct(o.nmae_pct)} of average wind output (${gw(o.mean_actual)})`}
        />
        <Stat label="Bias" value={<CountUp value={o.bias / 1000} format={(v) => signedGw(v * 1000, 2)} />} note="Positive means the forecast runs high" />
        <Stat label="RMSE" value={gw(o.rmse, 2)} note="Weights the big misses more" />
        <Stat label="P10 / P90 error" value={`${signedGw(o.p10)} / ${signedGw(o.p90)}`} note={`Worst single hour ${signedGw(o.max_over)}`} />
      </StatStrip>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          figure={2}
          title="Error grows with lead time"
          caption={`Every forecast issued 0–48 h ahead. At ${cutoff} the desk works ${data.decision_horizon_h?.[0]}–${data.decision_horizon_h?.[1]} h out.`}
        >
          <HorizonChart data={data.by_horizon} used={data.decision_horizon_h} />
        </Panel>

        <Panel figure={3} title="Most misses are on the high side" caption="Hours per 0.5 GW error bin. Right of zero means less wind than forecast.">
          <ErrorHistogram data={data.histogram} />
        </Panel>

        <Panel figure={4} title="Error by hour of day" caption="Mean absolute error and bias for each delivery hour.">
          <HourlyErrorChart data={data.by_hour} />
        </Panel>

        <Tabs defaultValue="chart">
          <Panel
            figure={5}
            title="Error by delivery day"
            caption="Daily bias. The tall bars are the days you'd have been short."
            className="h-full"
            actions={
              <TabsList>
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            }
          >
            <TabsContent value="chart">
              <DailyBiasChart data={data.daily} />
            </TabsContent>
            <TabsContent value="table">
              <DailyTable data={data.daily} />
            </TabsContent>
          </Panel>
        </Tabs>
      </div>
    </Reveal>
  );
}

function DailyTable({ data }: { data: AccuracyResponse["daily"] }) {
  return (
    <div className="max-h-[260px] overflow-y-auto">
      <Table className="tnum">
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead className="text-right">MAE</TableHead>
            <TableHead className="text-right">Bias</TableHead>
            <TableHead className="text-right">Avg actual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((d) => (
            <TableRow key={d.date}>
              <TableCell>{ukDate(d.date)}</TableCell>
              <TableCell className="text-right">{gw(d.mae, 2)}</TableCell>
              <TableCell className="text-right">{signedGw(d.bias, 2)}</TableCell>
              <TableCell className="text-right">{gw(d.mean_actual)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
