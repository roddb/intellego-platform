'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, Users, FileText, Calendar, Award, Clock } from 'lucide-react'

interface AnalyticsData {
  submissionTrends: Array<{
    week: string
    submissions: number
    total: number
    rate: number
  }>
  studentPerformance: Array<{
    studentName: string
    reportsSubmitted: number
    completionRate: number
    averageScore: number
    lastSubmission: string
  }>
  weeklyStats: {
    totalStudents: number
    activeStudents: number
    avgSubmissionRate: number
    totalReports: number
    weeklyGrowth: number
  }
  engagementMetrics: Array<{
    name: string
    value: number
    color: string
  }>
  timeDistribution: Array<{
    day: string
    morning: number
    afternoon: number
    evening: number
  }>
}

interface InstructorAnalyticsProps {
  className?: string
}

export default function InstructorAnalytics({ className = '' }: InstructorAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<'week' | 'month' | 'semester'>('month')

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedTimeFrame])

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/instructor/analytics?timeframe=${selectedTimeFrame}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTooltipValue = (value: any, name: string) => {
    if (name === 'rate') return `${value}%`
    return value
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatTooltipValue(entry.value, entry.dataKey)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-6 ${className}`}>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className={`p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center ${className}`}>
        <p className="text-slate-500 dark:text-slate-400">No se pudieron cargar los datos de analytics</p>
      </div>
    )
  }

  const { submissionTrends, studentPerformance, weeklyStats, engagementMetrics, timeDistribution } = analyticsData

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          📊 Analytics Dashboard
        </h2>
        <div className="flex gap-2">
          {['week', 'month', 'semester'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeFrame(timeframe as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeFrame === timeframe
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {timeframe === 'week' ? 'Semana' : timeframe === 'month' ? 'Mes' : 'Semestre'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{weeklyStats.totalStudents}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Total Estudiantes</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{weeklyStats.totalReports}</p>
              <p className="text-xs text-green-600 dark:text-green-400">Reportes Enviados</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                {weeklyStats.avgSubmissionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">Tasa de Envío</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                {weeklyStats.activeStudents}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Estudiantes Activos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Trends */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          📈 Tendencia de Envíos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={submissionTrends}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="week" 
              className="text-xs"
              tick={{ fill: 'currentColor', fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="submissions"
              stackId="1"
              stroke="#14b8a6"
              fill="#14b8a6"
              fillOpacity={0.6}
              name="Reportes Enviados"
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Tasa de Envío (%)"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Metrics */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            🎯 Métricas de Engagement
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={engagementMetrics}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {engagementMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Time Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            🕐 Distribución de Horarios
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeDistribution}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="day" 
                className="text-xs"
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="morning" stackId="a" fill="#fbbf24" name="Mañana" />
              <Bar dataKey="afternoon" stackId="a" fill="#f59e0b" name="Tarde" />
              <Bar dataKey="evening" stackId="a" fill="#d97706" name="Noche" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Student Performance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            👥 Rendimiento por Estudiante
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Reportes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Completitud
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Último Envío
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {studentPerformance.map((student, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {student.studentName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {student.reportsSubmitted}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-2 mr-2">
                        <div
                          className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${student.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {student.completionRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {student.lastSubmission}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}