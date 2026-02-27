'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-skeleton ${className}`}
    />
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Chat panel skeleton */}
      <div className="w-[420px] flex flex-col border-r border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Skeleton className="w-24 h-6" />
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/2 h-4" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <div className="space-y-2 max-w-[80%]">
              <Skeleton className="w-48 h-4" />
              <Skeleton className="w-32 h-4" />
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
      </div>

      {/* Code panel skeleton */}
      <div className="flex-1 flex flex-col">
        {/* View mode toggle */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-800">
          <Skeleton className="w-20 h-8 rounded-lg" />
          <Skeleton className="w-20 h-8 rounded-lg" />
          <Skeleton className="w-20 h-8 rounded-lg" />
        </div>

        {/* Code area */}
        <div className="flex-1 flex">
          {/* File tree */}
          <div className="w-56 border-r border-gray-200 dark:border-gray-800 p-3 space-y-2">
            <Skeleton className="w-full h-8 rounded-lg" />
            <Skeleton className="w-4/5 h-5" />
            <Skeleton className="w-3/5 h-5 ml-4" />
            <Skeleton className="w-3/5 h-5 ml-4" />
            <Skeleton className="w-4/5 h-5" />
            <Skeleton className="w-3/5 h-5 ml-4" />
          </div>

          {/* Editor */}
          <div className="flex-1 p-4 space-y-2">
            <Skeleton className="w-1/3 h-4" />
            <Skeleton className="w-2/3 h-4" />
            <Skeleton className="w-1/2 h-4" />
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-1/4 h-4" />
            <Skeleton className="w-2/3 h-4" />
            <Skeleton className="w-1/2 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Nav skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Skeleton className="w-32 h-6" />
          <div className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="w-full max-w-4xl mx-auto text-center space-y-8">
          <Skeleton className="w-48 h-8 rounded-full mx-auto" />
          <Skeleton className="w-96 h-12 mx-auto" />
          <Skeleton className="w-64 h-6 mx-auto" />
          <Skeleton className="w-full max-w-4xl h-40 rounded-3xl mx-auto" />
          <div className="flex gap-3 justify-center">
            <Skeleton className="w-32 h-10 rounded-full" />
            <Skeleton className="w-32 h-10 rounded-full" />
            <Skeleton className="w-32 h-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
