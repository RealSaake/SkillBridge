import React from 'react';
import { WidgetType } from '../../types/widget-types';

interface WidgetSkeletonProps {
  widgetType: WidgetType;
  width?: number;
  height?: number;
}

const SkeletonLine: React.FC<{ width?: string; height?: string; className?: string }> = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '' 
}) => (
  <div className={`${width} ${height} bg-gray-200 rounded animate-pulse ${className}`} />
);

const SkeletonCircle: React.FC<{ size?: string; className?: string; style?: React.CSSProperties }> = ({ 
  size = 'w-8 h-8', 
  className = '',
  style
}) => (
  <div className={`${size} bg-gray-200 rounded-full animate-pulse ${className}`} style={style} />
);

const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
    <div className="flex justify-between items-end h-32">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 rounded-t animate-pulse"
          style={{
            width: '12%',
            height: `${Math.random() * 80 + 20}%`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  </div>
);

const SkeletonRadar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-100 rounded-lg p-4 flex items-center justify-center ${className}`}>
    <div className="relative w-48 h-48">
      <SkeletonCircle size="w-48 h-48" className="absolute inset-0" />
      <SkeletonCircle size="w-32 h-32" className="absolute inset-8" />
      <SkeletonCircle size="w-16 h-16" className="absolute inset-16" />
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-24 bg-gray-200 animate-pulse"
          style={{
            top: '50%',
            left: '50%',
            transformOrigin: 'bottom',
            transform: `translate(-50%, -100%) rotate(${i * 60}deg)`
          }}
        />
      ))}
    </div>
  </div>
);

const SkeletonKanban: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
    <div className="grid grid-cols-3 gap-4 h-full">
      {[...Array(3)].map((_, colIndex) => (
        <div key={colIndex} className="bg-white rounded-lg p-3">
          <SkeletonLine width="w-20" className="mb-3" />
          {[...Array(Math.floor(Math.random() * 3) + 1)].map((_, cardIndex) => (
            <div key={cardIndex} className="bg-gray-50 rounded p-2 mb-2">
              <SkeletonLine width="w-full" className="mb-1" />
              <SkeletonLine width="w-3/4" height="h-3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const SkeletonDocument: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
    <div className="bg-white rounded shadow-sm p-4 h-full">
      <div className="space-y-3">
        <SkeletonLine width="w-1/3" height="h-6" />
        <SkeletonLine width="w-full" />
        <SkeletonLine width="w-full" />
        <SkeletonLine width="w-2/3" />
        <div className="my-4">
          <SkeletonLine width="w-1/4" height="h-5" className="mb-2" />
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-3/4" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SkeletonLine width="w-1/2" height="h-4" className="mb-1" />
            <SkeletonLine width="w-full" height="h-3" />
          </div>
          <div>
            <SkeletonLine width="w-1/2" height="h-4" className="mb-1" />
            <SkeletonLine width="w-full" height="h-3" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SkeletonMap: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
    <div className="bg-gray-200 rounded h-full relative animate-pulse">
      {[...Array(8)].map((_, i) => (
        <SkeletonCircle
          key={i}
          size="w-3 h-3"
          className="absolute"
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
    </div>
  </div>
);

export const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ 
  widgetType, 
  width = 400, 
  height = 300 
}) => {
  const containerStyle = {
    width: `${width}px`,
    height: `${height}px`
  };

  const renderSkeletonContent = () => {
    switch (widgetType) {
      case 'github-activity':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <SkeletonCircle size="w-10 h-10" />
              <div className="flex-1">
                <SkeletonLine width="w-32" className="mb-1" />
                <SkeletonLine width="w-24" height="h-3" />
              </div>
            </div>
            <SkeletonChart className="flex-1" />
            <div className="grid grid-cols-3 gap-2">
              <SkeletonLine width="w-full" height="h-8" />
              <SkeletonLine width="w-full" height="h-8" />
              <SkeletonLine width="w-full" height="h-8" />
            </div>
          </div>
        );

      case 'skill-radar':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <SkeletonLine width="w-32" className="mx-auto mb-2" />
              <SkeletonLine width="w-48" height="h-3" className="mx-auto" />
            </div>
            <SkeletonRadar className="flex-1" />
          </div>
        );

      case 'roadmap-board':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <SkeletonLine width="w-40" />
              <SkeletonLine width="w-20" height="h-8" />
            </div>
            <SkeletonKanban className="flex-1" />
          </div>
        );

      case 'resume-reviewer':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <SkeletonLine width="w-36" />
              <SkeletonLine width="w-24" height="h-8" />
            </div>
            <SkeletonDocument className="flex-1" />
          </div>
        );

      case 'job-insights':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <SkeletonLine width="w-32" />
              <div className="flex space-x-2">
                <SkeletonLine width="w-16" height="h-6" />
                <SkeletonLine width="w-16" height="h-6" />
              </div>
            </div>
            <SkeletonMap className="flex-1" />
          </div>
        );

      case 'learning-resources':
        return (
          <div className="space-y-4">
            <SkeletonLine width="w-40" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <SkeletonCircle size="w-8 h-8" />
                  <div className="flex-1">
                    <SkeletonLine width="w-3/4" className="mb-1" />
                    <SkeletonLine width="w-1/2" height="h-3" />
                  </div>
                  <SkeletonLine width="w-16" height="h-6" />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <SkeletonLine width="w-48" />
            <div className="space-y-2">
              <SkeletonLine width="w-full" />
              <SkeletonLine width="w-3/4" />
              <SkeletonLine width="w-1/2" />
            </div>
            <div className="bg-gray-100 rounded h-32 animate-pulse" />
          </div>
        );
    }
  };

  return (
    <div 
      className="widget-skeleton p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
      style={containerStyle}
    >
      <div className="h-full flex flex-col">
        {renderSkeletonContent()}
      </div>
    </div>
  );
};