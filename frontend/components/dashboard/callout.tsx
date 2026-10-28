/** Desk note: one plain-English takeaway with a rule on the left. */
export function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside
      data-reveal
      className="mb-6 border-l-[3px] border-note-rule bg-note px-4 py-3 text-[14px] leading-relaxed text-note-foreground"
    >
      <span className="mr-2 font-mono text-[11px] font-medium uppercase tracking-wider">{title}</span>
      {children}
    </aside>
  );
}
