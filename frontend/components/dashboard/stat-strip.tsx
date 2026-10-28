import { cn } from "@/lib/utils";

/** A row of key figures sharing one frame; the 1px gaps show the border colour as rules. */
export function StatStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-reveal
      className={cn("mb-6 grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  note,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-card px-5 py-4">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className={cn("tnum mt-1 font-semibold tracking-tight", emphasis ? "text-[34px] leading-none" : "text-2xl")}>
        {value}
      </div>
      {note && <div className="mt-1.5 text-xs leading-snug text-muted-foreground">{note}</div>}
    </div>
  );
}
