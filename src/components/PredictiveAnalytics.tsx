'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingDown, TrendingUp, Users, Clock, CheckCircle, AlertCircle, Info, Brain, Target, Calendar } from 'lucide-react'

interface Alert {
  id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  studentId: string
  studentName: string
  title: string
  description: string
  recommendation: string
  createdAt: string
  acknowledged: boolean
  data?: any
}

interface PredictiveInsight {
  studentId: string
  studentName: string
  riskScore: number
  trends: {
    submissionConsistency: number
    challengeFrequency: number
    achievementFrequency: number
    goalCompletionRate: number
    engagementLevel: number
  }
  predictions: {
    likelyToMissNextDeadline: boolean
    likelyToNeedSupport: boolean
    likelyToExceed: boolean
  }
  recommendations: string[]
}

interface RiskDistribution {
  low: number
  medium: number
  high: number
  critical: number
}

interface AlertsSummary {
  total: number
  critical: number
  warning: number
  info: number
  unacknowledged: number
}

export default function PredictiveAnalytics({ className = '' }: { className?: string }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'insights' | 'interventions'>('overview')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [insights, setInsights] = useState<PredictiveInsight[]>([])
  const [summary, setSummary] = useState<AlertsSummary | null>(null)
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<PredictiveInsight | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load all data in parallel
      const [alertsRes, insightsRes, summaryRes, riskRes] = await Promise.all([
        fetch('/api/analytics/predictive?action=alerts'),
        fetch('/api/analytics/predictive?action=insights'),
        fetch('/api/analytics/predictive?action=summary'),
        fetch('/api/analytics/predictive?action=risk_distribution')
      ])

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setAlerts(alertsData.alerts)
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json()
        setInsights(insightsData.insights)
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setSummary(summaryData.summary)
      }

      if (riskRes.ok) {
        const riskData = await riskRes.json()
        setRiskDistribution(riskData.riskDistribution)
      }

    } catch (error) {
      console.error('Error loading predictive analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/analytics/predictive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'acknowledge_alert',
          alertId
        })
      })

      if (response.ok) {
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ))
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const generateInterventionPlan = async (studentId: string) => {
    try {
      const response = await fetch('/api/analytics/predictive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_intervention_plan',
          studentId
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Plan de intervención generado:\n\nPrioridad: ${data.interventionPlan.priority}\nPlazo: ${data.interventionPlan.timeline}\n\nAcciones:\n${data.interventionPlan.actions.map((a: any) => `- ${a.action}`).join('\n')}`)
      }
    } catch (error) {
      console.error('Error generating intervention plan:', error)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore > 80) return 'text-red-600 bg-red-100'
    if (riskScore > 60) return 'text-orange-600 bg-orange-100'
    if (riskScore > 30) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getRiskLevel = (riskScore: number) => {
    if (riskScore > 80) return 'Crítico'
    if (riskScore > 60) return 'Alto'
    if (riskScore > 30) return 'Medio'
    return 'Bajo'
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
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
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Análisis Predictivo
            </h3>
            <p className="text-sm text-slate-600">
              Identificación temprana de riesgos y oportunidades
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Resumen', icon: TrendingUp },
            { id: 'alerts', label: 'Alertas', icon: AlertTriangle, count: summary?.unacknowledged },
            { id: 'insights', label: 'Análisis', icon: Users },
            { id: 'interventions', label: 'Intervenciones', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Críticas</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-1">{summary.critical}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Advertencias</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">{summary.warning}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Informativas</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{summary.info}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Pendientes</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{summary.unacknowledged}</p>
                </div>
              </div>
            )}

            {/* Risk Distribution */}
            {riskDistribution && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3">Distribución de Riesgo</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-full bg-green-200 rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-800">{riskDistribution.low}</p>
                      <p className="text-sm text-green-700">Bajo</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-yellow-200 rounded-lg p-3">
                      <p className="text-2xl font-bold text-yellow-800">{riskDistribution.medium}</p>
                      <p className="text-sm text-yellow-700">Medio</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-orange-200 rounded-lg p-3">
                      <p className="text-2xl font-bold text-orange-800">{riskDistribution.high}</p>
                      <p className="text-sm text-orange-700">Alto</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-red-200 rounded-lg p-3">
                      <p className="text-2xl font-bold text-red-800">{riskDistribution.critical}</p>
                      <p className="text-sm text-red-700">Crítico</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Risk Students */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3">Estudiantes de Mayor Riesgo</h4>
              <div className="space-y-2">
                {insights.slice(0, 5).map((insight) => (
                  <div key={insight.studentId} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="font-medium text-slate-900">{insight.studentName}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(insight.riskScore)}`}>
                        {getRiskLevel(insight.riskScore)} ({insight.riskScore}%)
                      </span>
                      <button
                        onClick={() => setSelectedStudent(insight)}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${alert.acknowledged ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.description}</p>
                      <p className="text-sm font-medium mt-2">Estudiante: {alert.studentName}</p>
                      <p className="text-sm mt-1"><strong>Recomendación:</strong> {alert.recommendation}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Reconocer</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => generateInterventionPlan(alert.studentId)}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      <Target className="h-3 w-3" />
                      <span>Plan</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">
                  No hay alertas activas
                </h4>
                <p className="text-slate-600">
                  Todos los estudiantes están progresando sin problemas detectados
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.studentId} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">{insight.studentName}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(insight.riskScore)}`}>
                    Riesgo: {getRiskLevel(insight.riskScore)} ({insight.riskScore}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-600">Consistencia</p>
                    <p className="text-lg font-semibold text-slate-900">{insight.trends.submissionConsistency}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600">Desafíos</p>
                    <p className="text-lg font-semibold text-slate-900">{insight.trends.challengeFrequency}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600">Logros</p>
                    <p className="text-lg font-semibold text-slate-900">{insight.trends.achievementFrequency}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600">Engagement</p>
                    <p className="text-lg font-semibold text-slate-900">{insight.trends.engagementLevel}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600">Predicciones</p>
                    <div className="flex justify-center space-x-1">
                      {insight.predictions.likelyToNeedSupport && <span className="text-red-500">⚠️</span>}
                      {insight.predictions.likelyToExceed && <span className="text-green-500">⭐</span>}
                      {insight.predictions.likelyToMissNextDeadline && <span className="text-yellow-500">⏰</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-slate-800 mb-2">Recomendaciones:</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {insight.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'interventions' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3">Estrategias de Intervención</h4>
              <div className="space-y-4">
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-red-800">Intervención Inmediata (Riesgo Crítico)</h5>
                  <ul className="text-sm text-slate-600 mt-2 space-y-1">
                    <li>• Contacto inmediato con el estudiante</li>
                    <li>• Reunión individual urgente</li>
                    <li>• Evaluación de barreras específicas</li>
                    <li>• Plan de apoyo personalizado</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-orange-800">Monitoreo Intensivo (Riesgo Alto)</h5>
                  <ul className="text-sm text-slate-600 mt-2 space-y-1">
                    <li>• Check-ins semanales</li>
                    <li>• Recursos de apoyo adicionales</li>
                    <li>• Ajustes en la carga de trabajo</li>
                    <li>• Mentoría entre pares</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-yellow-800">Apoyo Preventivo (Riesgo Medio)</h5>
                  <ul className="text-sm text-slate-600 mt-2 space-y-1">
                    <li>• Recordatorios personalizados</li>
                    <li>• Estrategias de estudio</li>
                    <li>• Grupos de estudio</li>
                    <li>• Seguimiento quincenal</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-green-800">Potenciación (Alto Rendimiento)</h5>
                  <ul className="text-sm text-slate-600 mt-2 space-y-1">
                    <li>• Desafíos adicionales</li>
                    <li>• Oportunidades de liderazgo</li>
                    <li>• Proyectos independientes</li>
                    <li>• Mentoría de otros estudiantes</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800">Cronograma de Seguimiento</h4>
                  <div className="text-sm text-blue-700 mt-2 space-y-1">
                    <p><strong>Diario:</strong> Monitoreo automático de patrones</p>
                    <p><strong>Semanal:</strong> Generación de alertas y análisis</p>
                    <p><strong>Quincenal:</strong> Revisión de planes de intervención</p>
                    <p><strong>Mensual:</strong> Evaluación de efectividad de intervenciones</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Análisis Detallado: {selectedStudent.studentName}</h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-sm text-slate-600">Puntuación de Riesgo</p>
                  <p className={`text-2xl font-bold ${selectedStudent.riskScore > 60 ? 'text-red-600' : selectedStudent.riskScore > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {selectedStudent.riskScore}%
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <p className="text-sm text-slate-600">Nivel de Riesgo</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {getRiskLevel(selectedStudent.riskScore)}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded">
                <h4 className="font-medium text-slate-900 mb-3">Tendencias</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Consistencia de envíos:</p>
                    <p className="font-semibold">{selectedStudent.trends.submissionConsistency}%</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Frecuencia de desafíos:</p>
                    <p className="font-semibold">{selectedStudent.trends.challengeFrequency}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Frecuencia de logros:</p>
                    <p className="font-semibold">{selectedStudent.trends.achievementFrequency}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Nivel de engagement:</p>
                    <p className="font-semibold">{selectedStudent.trends.engagementLevel}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded">
                <h4 className="font-medium text-slate-900 mb-3">Predicciones</h4>
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center space-x-2 ${selectedStudent.predictions.likelyToMissNextDeadline ? 'text-red-600' : 'text-green-600'}`}>
                    <span>{selectedStudent.predictions.likelyToMissNextDeadline ? '⚠️' : '✅'}</span>
                    <span>Probabilidad de perder próxima fecha límite: {selectedStudent.predictions.likelyToMissNextDeadline ? 'Alta' : 'Baja'}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${selectedStudent.predictions.likelyToNeedSupport ? 'text-yellow-600' : 'text-green-600'}`}>
                    <span>{selectedStudent.predictions.likelyToNeedSupport ? '⚠️' : '✅'}</span>
                    <span>Necesidad de apoyo adicional: {selectedStudent.predictions.likelyToNeedSupport ? 'Sí' : 'No'}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${selectedStudent.predictions.likelyToExceed ? 'text-green-600' : 'text-gray-600'}`}>
                    <span>{selectedStudent.predictions.likelyToExceed ? '⭐' : '◯'}</span>
                    <span>Probabilidad de superar expectativas: {selectedStudent.predictions.likelyToExceed ? 'Alta' : 'Normal'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded">
                <h4 className="font-medium text-slate-900 mb-3">Recomendaciones</h4>
                <ul className="space-y-2 text-sm">
                  {selectedStudent.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => generateInterventionPlan(selectedStudent.studentId)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Generar Plan de Intervención
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}