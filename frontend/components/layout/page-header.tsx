export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div data-reveal className="mb-6">
      <p className="mb-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
      {children && <div className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">{children}</div>}
    </div>
  );
}
