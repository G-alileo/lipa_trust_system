import React from "react";

export function SkeletonText({ width = "w-full", size = "base", className = "" }) {
  const sizeClasses = {
    sm: "skeleton-text-sm",
    base: "",
    lg: "skeleton-text-lg",
    xl: "skeleton-text-xl",
  };

  return (
    <div className={`skeleton skeleton-text ${sizeClasses[size]} ${width} ${className}`} />
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`skeleton skeleton-card ${className}`} />
  );
}

export function SkeletonAvatar({ className = "" }) {
  return (
    <div className={`skeleton skeleton-avatar ${className}`} />
  );
}

export function SkeletonButton({ className = "" }) {
  return (
    <div className={`skeleton skeleton-button ${className}`} />
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="flex gap-4 p-4 bg-ink-100">
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonText key={index} width="w-1-4" className="h-4" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-ink-200">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonText
              key={colIndex}
              width={colIndex === 0 ? "w-2-3" : "w-1-3"}
              className="h-4"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCampaignCard() {
  return (
    <div className="card glass p-6 space-y-4">
      <div className="flex justify-between items-start">
        <SkeletonText width="w-2-3" size="lg" />
        <SkeletonText width="w-16" size="sm" />
      </div>

      <SkeletonText width="w-full" />
      <SkeletonText width="w-3-4" />

      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="flex justify-between">
          <SkeletonText width="w-1-3" size="sm" />
          <SkeletonText width="w-1-4" size="sm" />
        </div>
      </div>

      <SkeletonButton />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <SkeletonText width="w-32" size="sm" />
          <SkeletonText width="w-48" size="xl" />
        </div>
        <SkeletonButton />
      </div>

      {/* Campaign grid */}
      <div>
        <SkeletonText width="w-32" size="lg" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCampaignCard key={index} />
          ))}
        </div>
      </div>

      {/* Contributions table */}
      <div>
        <SkeletonText width="w-40" size="lg" className="mb-4" />
        <SkeletonTable rows={5} columns={4} />
      </div>
    </div>
  );
}