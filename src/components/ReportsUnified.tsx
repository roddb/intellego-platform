'use client'

import { useState } from 'react'
import { FileText, BarChart3, History, Calendar } from 'lucide-react'
import WeeklyProgressBar from './WeeklyProgressBar'
import WeeklyReportForm from './WeeklyReportForm'
import ReportHistory from './ReportHistory'

interface ReportsUnifiedProps {
  userId: string
  onReportSubmit: (data: any) => Promise<void>
  canSubmit: boolean
  isLoading?: boolean
  successMessage?: string
}

type ReportTab = 'progress' | 'form' | 'history'

export default function ReportsUnified({ 
  userId, 
  onReportSubmit, 
  canSubmit, 
  isLoading = false, 
  successMessage 
}: ReportsUnifiedProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('progress')

  const tabs = [
    {
      id: 'progress' as ReportTab,
      title: 'Progreso Semanal',
      description: 'Visualiza tu avance semanal',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'form' as ReportTab,
      title: 'Nuevo Reporte',
      description: 'Completa tu reporte semanal',
      icon: FileText,
      color: 'bg-teal-100 text-teal-600'
    },
    {
      id: 'history' as ReportTab,
      title: 'Historial',
      description: 'Revisa reportes anteriores',
      icon: History,
      color: 'bg-purple-100 text-purple-600'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'progress':
        return <WeeklyProgressBar />
      
      case 'form':
        return (
          <div>
            {successMessage && (
              <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-xl text-green-800 text-center">
                {successMessage}
              </div>
            )}
            <WeeklyReportForm 
              onSubmit={onReportSubmit}
              canSubmit={canSubmit}
              isLoading={isLoading}
            />
          </div>
        )
      
      case 'history':
        return <ReportHistory userId={userId} />
      
      default:
        return <WeeklyProgressBar />
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full">
          <Calendar className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-800">
            Gestión de Reportes Semanales
          </span>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900">
          Reportes
        </h1>
        
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Gestiona tus reportes semanales, visualiza tu progreso y revisa tu historial académico
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-100 border-slate-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${tab.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-slate-900">{tab.title}</h3>
                    <p className="text-sm text-slate-600">{tab.description}</p>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-teal-500 rounded-full ml-auto"></div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-slate-900">💡 Consejo</h3>
            <p className="text-sm text-slate-600">
              Mantén una rutina constante enviando tus reportes el mismo día cada semana
            </p>
          </div>
          
          <div className="flex space-x-3">
            {canSubmit && (
              <button
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                Completar Reporte
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('history')}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Ver Historial
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}