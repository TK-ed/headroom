"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { DayForecastChart, type DayRow } from "@/components/charts/day-forecast-chart";
import { Panel } from "@/components/dashboard/panel";
import { Stat, StatStrip } from "@/components/dashboard/stat-strip";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { CutoffSelect } from "@/components/filters/cutoff-select";
import { DaySelect } from "@/components/filters/day-select";
import { FilterBar } from "@/components/filters/filter-field";
import { PageHeader } from "@/components/layout/page-header";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useData } from "@/hooks/use-data";
import { api, type DayPoint } from "@/lib/api";
import { gw, signedGw, ukDate, ukDateTime, ukTime } from "@/lib/format";

export default function DeliveryPlanPage() {
  const meta = useData(api.meta, []);
  const [date, setDate] = useState("");
  const [cutoff, setCutoff] = useState("09:00");

  useEffect(() => {
    if (meta.data && !date) {
      setDate(meta.data.delivery_days[14]);
      setCutoff(meta.data.default_cutoff);
    }
  }, [meta.data, date]);

  const day = useData(() => (date ? api.day(date, cutoff) : Promise.resolve(null)), [date, cutoff]);
  const acc = useData(() => api.accuracy(cutoff), [cutoff]);

  const rows = useMemo(() => buildRows(day.data?.points ?? [], day.data?.actuals_half_hourly ?? [], acc.data?.overall), [day.data, acc.data]);

  const error = meta.error ?? day.error ?? acc.error;
  if (error) return <ErrorState message={error} />;
  if (!meta.data || !day.data || !acc.data) return <LoadingState />;

  const d = day.data;
  const o = acc.data.overall;
  const meanForecast = d.energy_mwh.forecast / d.points.length;
  const firm = Math.max(meanForecast - o.p90, 0);

  return (
    <Reveal>
      <PageHeader eyebrow="Day-ahead desk" title={`Delivery plan for ${ukDate(d.date)}`}>
        This is the national wind forecast you had at {cutoff} the day before, with the range January&apos;s errors
        say to expect. Size the day-ahead purchase against the firm figure, not the headline forecast.
      </PageHeader>

      <FilterBar>
        <DaySelect days={meta.data.delivery_days} value={date} onChange={setDate} />
        <CutoffSelect value={cutoff} onChange={setCutoff} />
      </FilterBar>

      <StatStrip>
        <Stat
          label="Forecast in hand"
          value={d.forecast_publish_time ? ukTime(d.forecast_publish_time) : "–"}
          note={d.forecast_publish_time ? `Issued ${ukDateTime(d.forecast_publish_time)}` : "No forecast before cutoff"}
        />
        <Stat label="Forecast wind energy" value={<CountUp value={d.energy_mwh.forecast / 1000} format={(v) => `${v.toFixed(0)} GWh`} />} note={`Average ${gw(meanForecast)} through the day`} />
        <Stat
          emphasis
          label="Firm wind (9 hours in 10)"
          value={<CountUp value={firm / 1000} format={(v) => `${v.toFixed(1)} GW`} />}
          note={
            <span className="inline-flex items-center gap-1">
              Average forecast minus {gw(o.p90)}
              <Tooltip>
                <TooltipTrigger aria-label="How firm wind is worked out">
                  <Info className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-64">
                  In January the forecast was too high by {gw(o.p90)} or more in only 1 hour in 10 (the P90 error).
                  Taking that off the forecast gives a level of wind you could count on in about 9 hours out of 10.
                </TooltipContent>
              </Tooltip>
            </span>
          }
        />
        <Stat
          label="What actually happened"
          value={`${(d.energy_mwh.actual / 1000).toFixed(0)} GWh`}
          note={d.summary ? `Hindsight. Day MAE ${gw(d.summary.mae, 2)}, bias ${signedGw(d.summary.bias, 2)}` : "No actuals yet"}
        />
      </StatStrip>

      <Tabs defaultValue="chart">
        <Panel
          figure={1}
          title="Wind generation through the delivery day"
          caption="GW, UK time. Forecast is hourly, actual is half-hourly."
          actions={
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Hourly table</TabsTrigger>
            </TabsList>
          }
        >
          <TabsContent value="chart">
            <DayForecastChart rows={rows} />
          </TabsContent>
          <TabsContent value="table">
            <HourlyTable points={d.points} />
          </TabsContent>
        </Panel>
      </Tabs>
    </Reveal>
  );
}

/** Merge hourly forecast and half-hourly actual onto one time axis, adding the error band. */
function buildRows(points: DayPoint[], actuals: { time: string; actual: number }[], overall?: { p10: number; p90: number }): DayRow[] {
  if (!overall) return [];
  const byTime = new Map<number, DayRow>();
  for (const a of actuals) {
    const t = Date.parse(a.time);
    byTime.set(t, { t, actual: a.actual });
  }
  for (const p of points) {
    if (p.forecast == null) continue;
    const t = Date.parse(p.time);
    // error = forecast - actual, so the plausible actual sits between forecast - p90 and forecast - p10
    byTime.set(t, { ...(byTime.get(t) ?? { t }), forecast: p.forecast, band: [p.forecast - overall.p90, p.forecast - overall.p10] });
  }
  return [...byTime.values()].sort((a, b) => a.t - b.t);
}

function HourlyTable({ points }: { points: DayPoint[] }) {
  return (
    <div className="max-h-[340px] overflow-y-auto">
      <Table className="tnum">
        <TableHeader>
          <TableRow>
            <TableHead>Hour</TableHead>
            <TableHead className="text-right">Forecast</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Error</TableHead>
            <TableHead className="text-right">Lead time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {points.map((p) => (
            <TableRow key={p.time}>
              <TableCell>{ukTime(p.time)}</TableCell>
              <TableCell className="text-right">{p.forecast != null ? gw(p.forecast, 2) : "–"}</TableCell>
              <TableCell className="text-right">{p.actual != null ? gw(p.actual, 2) : "–"}</TableCell>
              <TableCell className="text-right">{p.error != null ? signedGw(p.error, 2) : "–"}</TableCell>
              <TableCell className="text-right">{p.horizon_h != null ? `${p.horizon_h} h` : "–"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
