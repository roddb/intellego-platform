"use client";

import { useState, useEffect } from 'react';

interface CostStats {
  totalCost: number;
  totalOperations: number; // Renamed from totalFeedbacks
  averageCost: number;
  minCost: number;
  maxCost: number;
  feedbackCosts?: {
    totalCost: number;
    count: number;
    avgCost: number;
  };
  evaluationCosts?: {
    totalCost: number;
    count: number;
    avgCost: number;
  };
  breakdown?: Record<string, { cost: number; count: number }>;
}

type Period = 'today' | 'week' | 'month' | 'all';
type GroupBy = 'day' | 'week' | 'subject' | 'none';
type OperationType = 'all' | 'feedback' | 'evaluation';

/**
 * APICostDashboard - Panel de control de costos de API Claude (INSTRUCTOR ONLY)
 *
 * Muestra estadísticas de costos de la API de Claude Haiku 4.5
 * - Costo total, promedio, mínimo y máximo
 * - Filtros por período y materia
 * - Agrupación por día, semana o materia
 * - Solo visible para instructores
 */
export default function APICostDashboard() {
  const [stats, setStats] = useState<CostStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filters
  const [period, setPeriod] = useState<Period>('month');
  const [subject, setSubject] = useState<string>('');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [operationType, setOperationType] = useState<OperationType>('all');

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ period, operationType });
      if (subject) params.append('subject', subject);
      if (groupBy !== 'none') params.append('groupBy', groupBy);

      const response = await fetch(`/api/instructor/costs?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al obtener estadísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching cost stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchStats();
    }
  }, [period, subject, groupBy, operationType, isExpanded]);

  // Format currency
  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(cost);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-slate-800">
              Costos de API Claude
            </h3>
            <p className="text-sm text-slate-500">
              Monitoreo de gastos en generación de feedback AI
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Período
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="all">Todos los tiempos</option>
              </select>
            </div>

            {/* Operation Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de operación
              </label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as OperationType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Todas</option>
                <option value="feedback">Reportes (Feedback)</option>
                <option value="evaluation">Exámenes (Evaluación)</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Materia
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Todas</option>
                <option value="Física">Física</option>
                <option value="Química">Química</option>
              </select>
            </div>

            {/* Group By Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Agrupar por
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="none">Sin agrupar</option>
                <option value="day">Por día</option>
                <option value="week">Por semana</option>
                <option value="subject">Por materia</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Stats Display */}
          {!isLoading && stats && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 font-medium mb-1">
                    Costo Total
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {formatCost(stats.totalCost)}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium mb-1">
                    Operaciones
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {stats.totalOperations}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium mb-1">
                    Promedio
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatCost(stats.averageCost)}
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-sm text-amber-600 font-medium mb-1">
                    Rango
                  </div>
                  <div className="text-sm font-semibold text-amber-900">
                    {formatCost(stats.minCost)} - {formatCost(stats.maxCost)}
                  </div>
                </div>
              </div>

              {/* Breakdown by Operation Type (only when operationType is 'all') */}
              {operationType === 'all' && stats.feedbackCosts && stats.evaluationCosts && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Feedback Costs Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-5 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="text-sm font-semibold text-blue-800">Reportes Semanales</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-600">Total</span>
                        <span className="text-lg font-bold text-blue-900">{formatCost(stats.feedbackCosts.totalCost)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-600">Cantidad</span>
                        <span className="text-sm font-semibold text-blue-800">{stats.feedbackCosts.count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-600">Promedio</span>
                        <span className="text-sm font-semibold text-blue-800">{formatCost(stats.feedbackCosts.avgCost)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Evaluation Costs Card */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-5 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <h4 className="text-sm font-semibold text-emerald-800">Corrección de Exámenes</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-emerald-600">Total</span>
                        <span className="text-lg font-bold text-emerald-900">{formatCost(stats.evaluationCosts.totalCost)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-emerald-600">Cantidad</span>
                        <span className="text-sm font-semibold text-emerald-800">{stats.evaluationCosts.count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-emerald-600">Promedio</span>
                        <span className="text-sm font-semibold text-emerald-800">{formatCost(stats.evaluationCosts.avgCost)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Breakdown Table */}
              {stats.breakdown && Object.keys(stats.breakdown).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Desglose detallado
                  </h4>
                  <div className="bg-slate-50 rounded-lg overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            {groupBy === 'subject' ? 'Materia' : groupBy === 'day' ? 'Fecha' : 'Período'}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Feedbacks
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Costo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {Object.entries(stats.breakdown).map(([key, value]) => (
                          <tr key={key} className="hover:bg-slate-100 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                              {key}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 text-right">
                              {value.count}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900 font-semibold text-right">
                              {formatCost(value.cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Info Note */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Nota:</strong> Los costos mostrados son los cargados realmente por la API de Claude Haiku 4.5.
                  Incluyen descuentos por Prompt Caching (70-90% de ahorro en requests con caché).
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
