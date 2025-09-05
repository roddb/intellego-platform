'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import FeedbackViewer from './FeedbackViewer';

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
  const [showFeedback, setShowFeedback] = useState(false);
  
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
      // Compare dates without time component
      // Handle both ISO format (with time) and simple date format
      const reportWeekStart = r.weekStart.split('T')[0];
      return reportWeekStart === weekStart && r.subject === subject;
    });
    
    if (!report) return 'pending';
    // Three distinct states: pending, completed without feedback, completed with feedback
    return report.hasFeedback ? 'completed-with-feedback' : 'completed-without-feedback';
  };
  
  // Get unique subjects from reports
  const getSubjects = () => {
    const subjectsSet = new Set(reports.map(r => r.subject));
    return Array.from(subjectsSet).sort();
  };
  
  const handleViewFeedback = (report: Report) => {
    setSelectedReport(report);
    setShowFeedback(true);
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
                            {status === 'completed-with-feedback' && report ? (
                              <button
                                onClick={() => handleViewFeedback(report)}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                title="Ver devolución"
                              >
                                📝 Devolución
                              </button>
                            ) : status === 'completed-without-feedback' ? (
                              <span className="px-2 py-1 text-xs text-green-600 font-medium">
                                ✅ Entregado
                              </span>
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
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">📝 Devolución</span>
              <span>Con devolución</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-green-600 font-medium text-xs">✅ Entregado</span>
              <span>Sin devolución</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-gray-400 text-xs">⏱️ Pendiente</span>
              <span>No entregado</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Feedback Modal */}
      {showFeedback && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Devolución - {selectedReport.subject}
              </h3>
              <button
                onClick={() => {
                  setShowFeedback(false);
                  setSelectedReport(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <FeedbackViewer 
                isOpen={showFeedback}
                onClose={() => {
                  setShowFeedback(false);
                  setSelectedReport(null);
                }}
                weekStart={selectedReport.weekStart.split('T')[0]}
                subject={selectedReport.subject}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}