'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, Send, Users, AlertTriangle, CheckCircle, Settings, RefreshCw } from 'lucide-react'

interface ReminderStats {
  totalStudents: number
  needingReminders: number
  urgentReminders: number
  submittedThisWeek: number
  remindersSentToday: number
}

interface Student {
  id: string
  name: string
  email: string
  needsReminder: boolean
  reminderType: 'initial' | 'follow_up_1' | 'follow_up_2' | 'urgent'
  daysLeft: number
  lastSubmission?: string
}

export default function ReminderManager() {
  const [stats, setStats] = useState<ReminderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'manual' | 'settings'>('overview')

  // Fetch reminder statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/reminders')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching reminder stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Send all reminders
  const sendAllReminders = async () => {
    setSendingReminders(true)
    try {
      const response = await fetch('/api/admin/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'send_all' })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`✅ Enviados ${data.remindersSent} recordatorios exitosamente`)
        fetchStats() // Refresh stats
      } else {
        throw new Error('Failed to send reminders')
      }
    } catch (error) {
      console.error('Error sending reminders:', error)
      alert('❌ Error al enviar recordatorios. Verifica la configuración del email.')
    } finally {
      setSendingReminders(false)
    }
  }

  // Send test reminder
  const sendTestReminder = async (studentId: string) => {
    try {
      const response = await fetch('/api/admin/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'test_reminder',
          userId: studentId
        })
      })
      
      if (response.ok) {
        alert('✅ Recordatorio de prueba enviado')
      } else {
        throw new Error('Failed to send test reminder')
      }
    } catch (error) {
      console.error('Error sending test reminder:', error)
      alert('❌ Error al enviar recordatorio de prueba')
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Bell className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Sistema de Recordatorios
              </h3>
              <p className="text-sm text-slate-600">
                Gestiona recordatorios automáticos para estudiantes
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchStats}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Actualizar estadísticas"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {(['overview', 'manual', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-teal-100 text-teal-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'overview' && 'Resumen'}
              {tab === 'manual' && 'Control Manual'}
              {tab === 'settings' && 'Configuración'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Estudiantes</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalStudents}</p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Enviados</span>
                </div>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.submittedThisWeek}</p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Pendientes</span>
                </div>
                <p className="text-2xl font-bold text-amber-900 mt-1">{stats.needingReminders}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Urgentes</span>
                </div>
                <p className="text-2xl font-bold text-red-900 mt-1">{stats.urgentReminders}</p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-800">Enviados Hoy</span>
                </div>
                <p className="text-2xl font-bold text-teal-900 mt-1">{stats.remindersSentToday}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Progreso Semanal</span>
                <span className="text-sm text-slate-600">
                  {((stats.submittedThisWeek / stats.totalStudents) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(stats.submittedThisWeek / stats.totalStudents) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2">Acciones Rápidas</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={sendAllReminders}
                  disabled={sendingReminders}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {sendingReminders ? 'Enviando...' : 'Enviar Todos los Recordatorios'}
                  </span>
                </button>

                <button
                  onClick={() => window.open('/api/cron/weekly-reminders', '_blank')}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Probar Cron Job</span>
                </button>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800">Configuración de Email</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Para que los recordatorios funcionen, asegúrate de configurar <code>RESEND_API_KEY</code> en tu archivo .env
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3">Configuración del Sistema</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Horario de Envío (Lunes)
                  </label>
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Hora en que se envían los recordatorios automáticos cada lunes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Recordatorios de Seguimiento
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-teal-600" />
                      <span className="ml-2 text-sm text-slate-700">Miércoles (follow-up 1)</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-teal-600" />
                      <span className="ml-2 text-sm text-slate-700">Viernes (follow-up 2)</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-teal-600" />
                      <span className="ml-2 text-sm text-slate-700">Domingo (urgente)</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800">Cron Job Configuration</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    El sistema está configurado para ejecutarse automáticamente cada lunes a las 9:00 AM
                  </p>
                  <code className="block mt-2 text-xs bg-blue-100 p-2 rounded border">
                    0 9 * * 1 → Cada lunes a las 9:00 AM UTC
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}