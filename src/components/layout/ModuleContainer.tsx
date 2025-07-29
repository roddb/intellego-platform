'use client'

import { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useLayout } from './LayoutProvider'

interface ModuleContainerProps {
  children: ReactNode
  title: string
  description?: string
  className?: string
}

export default function ModuleContainer({ 
  children, 
  title, 
  description, 
  className = '' 
}: ModuleContainerProps) {
  const { setActiveModule } = useLayout()

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Module Header */}
      <div className="mb-6">
        <button
          onClick={() => setActiveModule('welcome')}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Volver al Dashboard</span>
        </button>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-slate-600">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Module Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}