"use client";

import { Card, CardContent } from "@/components/ui/card";

export function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </CardContent>
    </Card>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="break-inside-avoid">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}
