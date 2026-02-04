import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    count?: number;
}

/**
 * Skeleton Component
 * 
 * A loading placeholder component that mimics the shape of content
 * while data is being fetched.
 * 
 * @example
 * ```tsx
 * // Single skeleton
 * <Skeleton variant="rectangular" height={200} />
 * 
 * // Multiple text lines
 * <Skeleton variant="text" count={3} />
 * 
 * // Card skeleton
 * <div className="p-4 bg-slate-800 rounded-lg">
 *   <Skeleton variant="circular" width={48} height={48} />
 *   <Skeleton variant="text" width="60%" />
 *   <Skeleton variant="rectangular" height={100} />
 * </div>
 * ```
 */
const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width = '100%',
    height,
    count = 1
}) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'circular':
                return 'rounded-full';
            case 'rectangular':
                return 'rounded-lg';
            case 'text':
            default:
                return 'rounded';
        }
    };

    const getDefaultHeight = () => {
        if (height) return height;
        switch (variant) {
            case 'circular':
                return width;
            case 'text':
                return '1em';
            case 'rectangular':
            default:
                return '100px';
        }
    };

    const skeletonStyle = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof getDefaultHeight() === 'number' ? `${getDefaultHeight()}px` : getDefaultHeight()
    };

    const baseClasses = `
    bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800
    animate-pulse
    ${getVariantClasses()}
    ${className}
  `;

    if (count > 1) {
        return (
            <div className="space-y-3">
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className={baseClasses} style={skeletonStyle} />
                ))}
            </div>
        );
    }

    return <div className={baseClasses} style={skeletonStyle} />;
};

/**
 * CardSkeleton Component
 * 
 * Pre-built skeleton for card layouts
 */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
    const single = (
        <div className="p-6 bg-slate-800/50 rounded-xl ring-1 ring-slate-700 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                </div>
            </div>
            <Skeleton variant="rectangular" height={120} />
            <div className="flex gap-2">
                <Skeleton variant="rectangular" width={80} height={32} />
                <Skeleton variant="rectangular" width={80} height={32} />
            </div>
        </div>
    );

    if (count > 1) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index}>{single}</div>
                ))}
            </div>
        );
    }

    return single;
};

/**
 * ListSkeleton Component
 * 
 * Pre-built skeleton for list layouts
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="text" width="50%" />
                    </div>
                    <Skeleton variant="rectangular" width={60} height={32} />
                </div>
            ))}
        </div>
    );
};

/**
 * TableSkeleton Component
 * 
 * Pre-built skeleton for table layouts
 */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
    rows = 5,
    cols = 4
}) => {
    return (
        <div className="overflow-hidden bg-slate-800/50 rounded-xl ring-1 ring-slate-700">
            {/* Header */}
            <div className="grid gap-4 p-4 border-b border-slate-700" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: cols }).map((_, index) => (
                    <Skeleton key={index} variant="text" width="80%" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="grid gap-4 p-4 border-b border-slate-700/50" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <Skeleton key={colIndex} variant="text" width={colIndex === 0 ? '60%' : '50%'} />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Skeleton;
