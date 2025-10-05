'use client'

import { motion } from 'framer-motion'

interface SkeletonCardProps {
  variant?: 'default' | 'list' | 'card' | 'text'
  className?: string
  lines?: number
}

export function SkeletonCard({ variant = 'default', className = '', lines = 3 }: SkeletonCardProps) {
  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
          </div>
        </div>
      </motion.div>
    )
  }

  // Default variant
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-200 dark:bg-slate-700 rounded"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    </div>
  )
}

// Specialized skeleton for reports
export function ReportSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="animate-pulse">
            {/* Header */}
            <div className="flex items-center mb-6">
              <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 mr-3" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
            </div>

            {/* Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Form Section */}
              <div className="space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-4" />
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  </div>
                ))}
              </div>

              {/* Calendar Section */}
              <div className="space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-4" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
                {[1, 2, 3, 4].map((k) => (
                  <div key={k} className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
