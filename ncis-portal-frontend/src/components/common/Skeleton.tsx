import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  width,
  height
}) => {
  const roundedClass =
    variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'rounded' : 'rounded-lg';

  return (
    <div
      className={`skeleton-shimmer bg-slate-200/80 dark:bg-slate-800/80 ${roundedClass} ${className}`}
      style={{ width, height }}
    />
  );
};

export const KpiCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-24 h-4" />
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>
      <Skeleton variant="text" className="w-32 h-8" />
      <Skeleton variant="text" className="w-40 h-3" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6
}) => {
  return (
    <div className="w-full space-y-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
        <Skeleton variant="text" className="w-48 h-5" />
        <Skeleton variant="rect" className="w-32 h-8" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 items-center py-2">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                variant="text"
                className="h-4"
                style={{ width: c === 0 ? '25%' : c === 1 ? '15%' : '12%' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 260 }) => {
  return (
    <div
      className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
      style={{ height }}
    >
      <div className="flex justify-between items-center mb-4">
        <Skeleton variant="text" className="w-36 h-5" />
        <Skeleton variant="rect" className="w-20 h-6" />
      </div>
      <div className="flex-1 flex items-end gap-3 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rect"
            className="flex-1"
            style={{ height: `${20 + ((i * 17) % 75)}%` }}
          />
        ))}
      </div>
    </div>
  );
};
