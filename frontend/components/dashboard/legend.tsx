export type LegendEntry = { label: string; color: string; shape?: "line" | "box" };

export function Legend({ items }: { items: LegendEntry[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-5 gap-y-1 px-2 text-[13px] text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            aria-hidden
            className={item.shape === "box" ? "h-2.5 w-3.5 rounded-[2px]" : "h-0.5 w-4 rounded-full"}
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
