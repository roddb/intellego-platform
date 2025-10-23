'use client'

import { useState } from 'react'
import {
  FileText,
  User,
  History,
  TrendingUp,
  ClipboardCheck,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type TabType = 'reports' | 'profile' | 'history' | 'progress' | 'evaluations' | 'feedbacks'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  userName?: string
}

export default function Sidebar({ activeTab, onTabChange, userName }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const menuItems = [
    { id: 'reports' as TabType, label: 'Reportes', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50', hoverColor: 'hover:bg-blue-100' },
    { id: 'feedbacks' as TabType, label: 'Retroalimentaciones', icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-50', hoverColor: 'hover:bg-purple-100' },
    { id: 'progress' as TabType, label: 'Progreso', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50', hoverColor: 'hover:bg-green-100' },
    { id: 'history' as TabType, label: 'Historial', icon: History, color: 'text-orange-600', bgColor: 'bg-orange-50', hoverColor: 'hover:bg-orange-100' },
    { id: 'evaluations' as TabType, label: 'Evaluaciones', icon: ClipboardCheck, color: 'text-indigo-600', bgColor: 'bg-indigo-50', hoverColor: 'hover:bg-indigo-100' },
    { id: 'profile' as TabType, label: 'Perfil', icon: User, color: 'text-gray-600', bgColor: 'bg-gray-50', hoverColor: 'hover:bg-gray-100' },
  ]

  const handleTabClick = (tab: TabType) => {
    onTabChange(tab)
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-6 h-6 dark:text-white" /> : <Menu className="w-6 h-6 dark:text-white" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out z-40
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">Dashboard</h2>
              {userName && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userName}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-10rem)]">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTabClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${isActive
                    ? `${item.bgColor} ${item.color} dark:bg-opacity-20`
                    : `text-gray-700 dark:text-gray-300 ${item.hoverColor} dark:hover:bg-gray-700`
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`
                    w-5 h-5 flex-shrink-0
                    ${isActive ? item.color : 'text-gray-600 group-hover:' + item.color}
                  `}
                />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`
                        text-sm font-medium truncate
                        ${isActive ? 'font-semibold' : ''}
                      `}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {!isCollapsed && isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={`ml-auto w-1.5 h-1.5 rounded-full ${item.color.replace('text-', 'bg-')}`}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
            aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Colapsar</span>
              </div>
            )}
          </button>

          <div className="p-3">
            {!isCollapsed ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Intellego Platform v1.0
              </div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-green-500 mx-auto" title="Sistema activo" />
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Spacer */}
      <div className={`
        hidden lg:block transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'}
      `} />
    </>
  )
}
