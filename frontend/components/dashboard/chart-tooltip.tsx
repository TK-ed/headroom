export type TooltipRow = { label: string; value: string; color: string };

/** Body for Recharts' <Tooltip content>. */
export function ChartTooltip({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="min-w-40 rounded-md border bg-popover px-3 py-2 text-[13px] text-popover-foreground shadow-sm">
      <div className="mb-1 text-xs text-muted-foreground">{title}</div>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-full" style={{ background: row.color }} />
          <span className="text-muted-foreground">{row.label}</span>
          <span className="tnum ml-auto font-medium">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
