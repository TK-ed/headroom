import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A numbered figure: title, one-line caption, optional actions, then the chart or table. */
export function Panel({
  figure,
  title,
  caption,
  actions,
  children,
  className,
}: {
  figure?: number;
  title: string;
  caption?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card data-reveal className={cn("gap-3 rounded-md py-4 shadow-none", className)}>
      <CardHeader className="flex flex-col items-start justify-between gap-3 px-5 sm:flex-row sm:gap-4">
        <div>
          <h2 className="text-[15px] font-semibold">
            {figure != null && <span className="mr-2 font-mono text-xs font-normal text-muted-foreground">Fig. {figure}</span>}
            {title}
          </h2>
          {caption && <p className="mt-0.5 text-[13px] text-muted-foreground">{caption}</p>}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="px-3 sm:px-5">{children}</CardContent>
    </Card>
  );
}
