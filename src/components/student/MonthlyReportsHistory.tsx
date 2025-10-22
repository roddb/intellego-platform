'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Report {
  id: string;
  weekStart: string;
  weekEnd: string;
  subject: string;
  submittedAt: string;
  hasFeedback?: boolean;
}

interface MonthlyReportsHistoryProps {
  userId: string;
  className?: string;
}

export default function MonthlyReportsHistory({ userId, className = "" }: MonthlyReportsHistoryProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDetails, setReportDetails] = useState<any | null>(null);
  
  // Get month name in Spanish
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  // Check if can navigate to next month (not future)
  const canGoNext = () => {
    const today = new Date();
    return currentMonth.getFullYear() < today.getFullYear() ||
           (currentMonth.getFullYear() === today.getFullYear() && 
            currentMonth.getMonth() < today.getMonth());
  };
  
  // Fetch reports for the current month
  useEffect(() => {
    fetchMonthReports();
  }, [currentMonth, userId]);
  
  const fetchMonthReports = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      // Extend the date range to include weeks that overlap with the month
      // Start from the Monday of the week containing the first day of the month
      // End at the Sunday of the week containing the last day of the month
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // Find Monday of the week containing the first day
      const startWeek = new Date(firstDayOfMonth);
      const startDayOfWeek = startWeek.getDay();
      const diffToMonday = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
      startWeek.setDate(startWeek.getDate() + diffToMonday);
      
      // Find Sunday of the week containing the last day
      const endWeek = new Date(lastDayOfMonth);
      const endDayOfWeek = endWeek.getDay();
      const diffToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
      endWeek.setDate(endWeek.getDate() + diffToSunday);
      
      const startDate = startWeek.toISOString().split('T')[0];
      const endDate = endWeek.toISOString().split('T')[0];
      
      const response = await fetch(
        `/api/student/reports-history?userId=${userId}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Get weeks of the month
  const getWeeksOfMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeks = [];
    let currentWeek = new Date(firstDay);
    
    // Find the Monday of the first week
    const dayOfWeek = currentWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentWeek.setDate(currentWeek.getDate() + diff);
    
    while (currentWeek <= lastDay) {
      const weekStart = new Date(currentWeek);
      const weekEnd = new Date(currentWeek);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Include weeks that have ANY overlap with the current month
      // A week overlaps if it starts before or during the month AND ends during or after the month
      if (weekStart <= lastDay && weekEnd >= firstDay) {
        weeks.push({
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0],
          weekNumber: weeks.length + 1
        });
      }
      
      currentWeek.setDate(currentWeek.getDate() + 7);
    }
    
    return weeks;
  };
  
  // Get report status for a specific week and subject
  const getReportStatus = (weekStart: string, subject: string) => {
    const report = reports.find(r => {
      // Convert both dates to YYYY-MM-DD format for simple comparison
      const reportDate = r.weekStart.split('T')[0];
      const weekStartDate = new Date(weekStart + 'T00:00:00.000Z');
      const weekEndDate = new Date(weekStart + 'T00:00:00.000Z');
      weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
      
      const reportDateObj = new Date(reportDate + 'T00:00:00.000Z');
      
      return reportDateObj >= weekStartDate && 
             reportDateObj <= weekEndDate && 
             r.subject === subject;
    });
    
    if (!report) return 'pending';
    return report.hasFeedback === true ? 'completed-with-feedback' : 'completed-without-feedback';
  };
  
  // Get unique subjects from reports
  const getSubjects = () => {
    const subjectsSet = new Set(reports.map(r => r.subject));
    return Array.from(subjectsSet).sort();
  };
  
  const handleViewReport = async (report: Report) => {
    setSelectedReport(report);
    setShowReportModal(true);

    // Fetch the full report details to show student's answers
    try {
      const response = await fetch(`/api/student/report-details?reportId=${report.id}`);
      if (response.ok) {
        const data = await response.json();
        setReportDetails(data);
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
    }
  };
  
  const weeks = getWeeksOfMonth();
  const subjects = getSubjects();
  

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Historial de Entregas
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <span className="px-4 py-2 font-medium text-gray-800 min-w-[150px] text-center capitalize">
            {getMonthName(currentMonth)}
          </span>
          
          <button
            onClick={goToNextMonth}
            disabled={!canGoNext()}
            className={`p-2 rounded-lg transition-colors ${
              canGoNext() 
                ? 'hover:bg-gray-100' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay reportes registrados para este mes
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">
                    Semana
                  </th>
                  {subjects.map(subject => (
                    <th key={subject} className="text-center py-2 px-3 text-sm font-medium text-gray-700">
                      {subject}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, index) => (
                  <tr key={week.start} className="border-b border-gray-100">
                    <td className="py-3 px-3 text-sm text-gray-600">
                      Semana {week.weekNumber}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(week.start).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: 'short' 
                        })} - {new Date(week.end).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </div>
                    </td>
                    {subjects.map(subject => {
                      const status = getReportStatus(week.start, subject);
                      const report = reports.find(r => {
                        const reportWeekStart = r.weekStart.split('T')[0];
                        return reportWeekStart === week.start && r.subject === subject;
                      });
                      
                      return (
                        <td key={`${week.start}-${subject}`} className="py-3 px-3">
                          <div className="flex justify-center">
                            {(status === 'completed-with-feedback' || status === 'completed-without-feedback') && report ? (
                              <button
                                onClick={() => handleViewReport(report)}
                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors border border-green-200"
                                title="Ver mis respuestas"
                              >
                                ✅ Entregado
                              </button>
                            ) : (
                              <span className="px-2 py-1 text-xs text-gray-400">
                                ⏱️ Pendiente
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-200 rounded text-xs">✅ Entregado</span>
              <span>Reporte entregado (click para ver tus respuestas)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-gray-400 text-xs">⏱️ Pendiente</span>
              <span>No entregado</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Student Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold">Tu Reporte</h3>
                <p className="text-sm text-teal-100">
                  {selectedReport.subject} - Semana del {new Date(selectedReport.weekStart).toLocaleDateString('es-AR')}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedReport(null);
                  setReportDetails(null);
                }}
                className="text-white hover:text-teal-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {!reportDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Cargando tus respuestas...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {reportDetails.answers && reportDetails.answers.map((answer: any, index: number) => (
                    <div key={answer.questionId || index} className="border-l-4 border-teal-500 pl-4 py-2">
                      <h4 className="font-semibold text-slate-800 mb-2">{answer.questionText}</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{answer.answer || 'No respondido'}</p>
                    </div>
                  ))}

                  {(!reportDetails.answers || reportDetails.answers.length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      <p>No se encontraron respuestas para este reporte.</p>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-slate-200 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Enviado el {new Date(selectedReport.submittedAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 rounded-b-xl">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">
                  💡 Tip: Para ver la retroalimentación del instructor, ve al tab "Retroalimentaciones"
                </p>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setSelectedReport(null);
                    setReportDetails(null);
                  }}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}