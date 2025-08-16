'use client'

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Type definitions
interface WeekData {
  studentCount: number;
  reportCount: number;
  completionRate: number;
  subjects: string[];
}

interface WeeklyDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubject?: string;
  sede?: string;
  academicYear?: string;
  division?: string;
}

type DownloadFormat = 'JSON' | 'CSV';

interface LoadingState {
  preview: boolean;
  download: boolean;
}

interface ErrorState {
  message: string;
  type: 'preview' | 'download' | null;
}

// Utility functions
const getWeekRange = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  return { start, end };
};

const formatWeekRange = (start: Date, end: Date) => {
  return `${format(start, 'dd/MM', { locale: es })} - ${format(end, 'dd/MM/yyyy', { locale: es })}`;
};

// Real API data fetching function
const fetchWeekData = async (
  start: Date,
  end: Date,
  filters: {
    subject?: string;
    sede?: string;
    academicYear?: string;
    division?: string;
  }
): Promise<WeekData> => {
  try {
    const params = new URLSearchParams({
      action: 'weekly-preview',
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
    });

    // Add optional filters
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.academicYear) params.append('academicYear', filters.academicYear);
    if (filters.division) params.append('division', filters.division);

    const response = await fetch(`/api/instructor/hierarchical?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Process the hierarchical data to extract summary info
    const data = result.data;
    let studentCount = 0;
    let reportCount = 0;
    const subjects = new Set<string>();

    // Count students and reports from hierarchical data
    Object.values(data.hierarchicalData || {}).forEach((years: any) => {
      Object.values(years).forEach((courses: any) => {
        Object.values(courses).forEach((courseData: any) => {
          if (courseData.students) {
            studentCount += courseData.students.length;
            courseData.students.forEach((student: any) => {
              if (student.report) {
                reportCount++;
              }
            });
          }
          if (courseData.subject) {
            subjects.add(courseData.subject);
          }
        });
      });
    });

    const completionRate = studentCount > 0 ? Math.round((reportCount / studentCount) * 100) : 0;

    return {
      studentCount,
      reportCount,
      completionRate,
      subjects: Array.from(subjects),
    };
  } catch (error) {
    console.error('Error fetching week data:', error);
    throw new Error('No se pudieron cargar los datos de la semana');
  }
};

// Real download function implementation
const downloadWeekData = async (
  start: Date,
  end: Date,
  downloadFormat: DownloadFormat,
  filters: {
    subject?: string;
    sede?: string;
    academicYear?: string;
    division?: string;
  }
): Promise<void> => {
  try {
    const params = new URLSearchParams({
      action: 'weekly-download',
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
      format: downloadFormat.toLowerCase(),
    });

    // Add optional filters
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.academicYear) params.append('academicYear', filters.academicYear);
    if (filters.division) params.append('division', filters.division);

    const response = await fetch(`/api/instructor/hierarchical?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error de descarga ${response.status}: ${response.statusText}`);
    }

    // Get the blob and create download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    
    // Generate filename with date range and format
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    const extension = downloadFormat.toLowerCase();
    a.download = `reporte_semanal_${startStr}_a_${endStr}.${extension}`;
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log(`✅ Descarga completada: ${a.download}`);
  } catch (error) {
    console.error('Error durante la descarga:', error);
    throw new Error('No se pudo completar la descarga. Inténtalo de nuevo.');
  }
};

export default function WeeklyDownloadModal({
  isOpen,
  onClose,
  selectedSubject,
  sede,
  academicYear,
  division,
}: WeeklyDownloadModalProps) {
  // State management
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('JSON');
  const [loading, setLoading] = useState<LoadingState>({ preview: false, download: false });
  const [error, setError] = useState<ErrorState>({ message: '', type: null });

  // Calculate week range from selected date
  const weekRange = getWeekRange(parseISO(selectedDate));
  const weekRangeText = formatWeekRange(weekRange.start, weekRange.end);

  // Clear error when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError({ message: '', type: null });
      setWeekData(null);
    }
  }, [isOpen]);

  // Fetch preview data when date changes
  useEffect(() => {
    if (isOpen && selectedDate) {
      handlePreviewData();
    }
  }, [selectedDate, isOpen]);

  const handlePreviewData = async () => {
    setLoading(prev => ({ ...prev, preview: true }));
    setError({ message: '', type: null });
    
    try {
      const data = await fetchWeekData(weekRange.start, weekRange.end, {
        subject: selectedSubject,
        sede,
        academicYear,
        division,
      });
      setWeekData(data);
    } catch (err) {
      setError({
        message: 'Error al cargar la vista previa de datos',
        type: 'preview',
      });
      setWeekData(null);
    } finally {
      setLoading(prev => ({ ...prev, preview: false }));
    }
  };

  const handleDownload = async () => {
    if (!weekData) return;
    
    setLoading(prev => ({ ...prev, download: true }));
    setError({ message: '', type: null });
    
    try {
      await downloadWeekData(weekRange.start, weekRange.end, downloadFormat, {
        subject: selectedSubject,
        sede,
        academicYear,
        division,
      });
      
      // Close modal on successful download
      onClose();
    } catch (err) {
      setError({
        message: 'Error al descargar los datos',
        type: 'download',
      });
    } finally {
      setLoading(prev => ({ ...prev, download: false }));
    }
  };

  const handleClose = () => {
    if (!loading.download) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 mac-modal-backdrop z-40"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="mac-modal w-full max-w-lg">
          {/* Header */}
          <div className="mac-modal-header flex items-center justify-between p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Descargar Reporte Semanal
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Exportar datos de progreso estudiantil
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading.download}
              className="mac-close-button disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cerrar modal"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Date Selection */}
            <div className="mac-section-card p-4 space-y-3">
              <label htmlFor="week-date" className="block text-sm font-semibold text-slate-700">
                📅 Seleccionar Semana
              </label>
              <input
                id="week-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={loading.download}
                className="mac-input mac-input-focus disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-600 font-medium">
                  Semana: {weekRangeText}
                </p>
              </div>
            </div>

            {/* Data Preview */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Vista Previa de Datos</span>
              </h3>
              
              {loading.preview ? (
                <div className="mac-loading-card p-6">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="mac-spinner w-5 h-5"></div>
                    <span className="text-sm text-slate-600 font-medium">Cargando datos...</span>
                  </div>
                </div>
              ) : error.type === 'preview' ? (
                <div className="mac-error-card p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <span className="text-sm text-red-700 font-medium">{error.message}</span>
                      <button
                        onClick={handlePreviewData}
                        className="block mt-2 text-xs text-red-600 hover:text-red-800 font-semibold transition-colors"
                      >
                        🔄 Reintentar
                      </button>
                    </div>
                  </div>
                </div>
              ) : weekData ? (
                <div className="mac-preview-card p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Estudiantes</p>
                        <p className="text-lg font-bold text-slate-800">{weekData.studentCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Reportes</p>
                        <p className="text-lg font-bold text-slate-800">{weekData.reportCount}</p>
                      </div>
                    </div>
                    <div className="col-span-2 bg-white/50 rounded-lg p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">Tasa de Completitud</span>
                        <span className="text-lg font-bold text-teal-600">{weekData.completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${weekData.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 font-medium mb-2">Materias incluidas</p>
                      <div className="flex flex-wrap gap-1">
                        {weekData.subjects.map((subject, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-lg"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mac-section-card p-6">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-500 font-medium">
                      Selecciona una fecha para ver la vista previa
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div className="mac-section-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Formato de Descarga</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(['JSON', 'CSV'] as DownloadFormat[]).map((format) => (
                  <label 
                    key={format} 
                    className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      downloadFormat === format 
                        ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-100' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    } ${loading.download ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="download-format"
                      value={format}
                      checked={downloadFormat === format}
                      onChange={(e) => setDownloadFormat(e.target.value as DownloadFormat)}
                      disabled={loading.download}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                        downloadFormat === format ? 'bg-teal-100' : 'bg-slate-100'
                      }`}>
                        {format === 'JSON' ? (
                          <svg className={`w-4 h-4 ${downloadFormat === format ? 'text-teal-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        ) : (
                          <svg className={`w-4 h-4 ${downloadFormat === format ? 'text-teal-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${
                        downloadFormat === format ? 'text-teal-700' : 'text-slate-600'
                      }`}>
                        {format}
                      </span>
                      <p className={`text-xs mt-1 ${
                        downloadFormat === format ? 'text-teal-600' : 'text-slate-500'
                      }`}>
                        {format === 'JSON' ? 'Datos estructurados' : 'Hoja de cálculo'}
                      </p>
                    </div>
                    {downloadFormat === format && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error.type === 'download' && (
              <div className="mac-error-card p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-700 font-medium">{error.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200/30">
            <button
              onClick={handleClose}
              disabled={loading.download}
              className="mac-button mac-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleDownload}
              disabled={!weekData || loading.download || loading.preview}
              className="mac-button mac-button-teal disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading.download ? (
                <>
                  <div className="mac-spinner w-4 h-4 border-white border-t-transparent"></div>
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Descargar {downloadFormat}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}