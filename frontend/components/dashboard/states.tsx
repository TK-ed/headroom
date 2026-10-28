import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div aria-busy className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-96 max-w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-md border border-destructive/40 bg-card px-5 py-4 text-sm">
      <p className="font-medium">Couldn&apos;t load the data.</p>
      <p className="mt-1 text-muted-foreground">{message}. Check that the API is running and try again.</p>
    </div>
  );
}
