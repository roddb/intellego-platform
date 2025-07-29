'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type ModuleType = 
  | 'welcome'
  | 'profile'
  | 'ai-tutor' 
  | 'reports'
  | 'analytics'
  | 'reminders'
  | 'predictive'
  | 'students'
  | 'study-organizer'

interface LayoutContextType {
  activeModule: ModuleType
  setActiveModule: (module: ModuleType) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

interface LayoutProviderProps {
  children: ReactNode
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [activeModule, setActiveModule] = useState<ModuleType>('welcome')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const value = {
    activeModule,
    setActiveModule,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar
  }

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}