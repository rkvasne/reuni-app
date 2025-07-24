'use client';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'calendar' | 'slider';
  count?: number;
  className?: string;
}

export default function SkeletonLoader({
  variant = 'card',
  count = 1,
  className = ""
}: SkeletonLoaderProps) {
  const renderCardSkeleton = () => (
    <div className="card p-4 animate-pulse">
      <div className="h-48 bg-neutral-200 rounded-lg mb-4"></div>
      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-neutral-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-neutral-200 rounded w-2/3 mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="h-8 bg-neutral-200 rounded w-20"></div>
        <div className="h-8 bg-neutral-200 rounded w-16"></div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-neutral-200 rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  const renderCalendarSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 bg-neutral-200 rounded w-32"></div>
        <div className="h-6 bg-neutral-200 rounded w-16"></div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-8 bg-neutral-200 rounded"></div>
        ))}
      </div>
    </div>
  );

  const renderSliderSkeleton = () => (
    <div className="flex gap-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-72">
          <div className="card p-3">
            <div className="h-32 bg-neutral-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'calendar':
        return renderCalendarSkeleton();
      case 'slider':
        return renderSliderSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={count > 1 ? 'mb-4' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}