import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function MissionSkeleton() {
  return (
    <Card className="h-full">
      <div className="w-full h-48 bg-muted animate-pulse rounded-t-lg" />
      <CardHeader className="space-y-3">
        <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        <div className="h-4 bg-muted animate-pulse rounded w-full" />
        <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        <div className="flex gap-4 pt-2 border-t">
          <div className="h-4 bg-muted animate-pulse rounded w-16" />
          <div className="h-4 bg-muted animate-pulse rounded w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-4 bg-muted animate-pulse rounded w-full mb-2" />
        <div className="h-4 bg-muted animate-pulse rounded w-5/6 mb-2" />
        <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
      </CardContent>
    </Card>
  );
}


