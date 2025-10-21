'use client';

import { useState, useEffect } from 'react';

type BatchResult = {
  total: number;
  successful: number;
  failed: number;
  failedReports: Array<{ reportId: string; error: string }>;
  totalCost: number;
  totalTimeMs: number;
};

type PendingCounts = {
  Física: number;
  Química: number;
  total: number;
};

type ReportDetail = {
  id: string;
  studentName: string;
  studentId: string;
  division: string;
  academicYear: string;
  sede: string;
  weekStart: string;
  weekEnd: string;
  submittedAt: string;
};

export function BatchFeedbackGenerator() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingCounts, setPendingCounts] = useState<PendingCounts | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [progress, setProgress] = useState(0);

  // Async processing states
  const [asyncJob, setAsyncJob] = useState<{
    isRunning: boolean;
    totalReports: number;
    processedReports: number;
    subject?: string;
  } | null>(null);

  // New states for details
  const [expandedSubject, setExpandedSubject] = useState<'Física' | 'Química' | null>(null);
  const [subjectDetails, setSubjectDetails] = useState<{[key: string]: ReportDetail[]}>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // States for individual processing
  const [processingReports, setProcessingReports] = useState<Set<string>>(new Set());
  const [processedReports, setProcessedReports] = useState<Set<string>>(new Set());
  const [reportErrors, setReportErrors] = useState<{[reportId: string]: string}>({});

  // Fetch pending reports count on mount
  useEffect(() => {
    fetchPendingCount();
  }, []);

  // Polling effect for async job progress
  useEffect(() => {
    if (!asyncJob?.isRunning) return;

    const pollInterval = setInterval(async () => {
      try {
        // Get current pending count
        const url = asyncJob.subject
          ? `/api/instructor/feedback/batch-generate-async?subject=${encodeURIComponent(asyncJob.subject)}`
          : '/api/instructor/feedback/batch-generate-async';

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch progress');

        const data = await response.json();
        const pendingNow = data.pendingReports;
        const processed = asyncJob.totalReports - pendingNow;

        // Update progress
        setAsyncJob(prev => prev ? { ...prev, processedReports: processed } : null);
        setProgress(Math.round((processed / asyncJob.totalReports) * 100));

        // Check if complete
        if (pendingNow === 0) {
          console.log('✅ Async job completed!');
          setAsyncJob(null);
          setIsProcessing(false);
          setProgress(100);

          // Refresh counts and show success
          await fetchPendingCount();
          setResult({
            total: asyncJob.totalReports,
            successful: asyncJob.totalReports,
            failed: 0,
            failedReports: [],
            totalCost: asyncJob.totalReports * 0.005,
            totalTimeMs: 0
          });
        }
      } catch (err) {
        console.error('Error polling progress:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [asyncJob]);

  const fetchPendingCount = async () => {
    setIsLoadingCounts(true);
    try {
      const response = await fetch('/api/instructor/feedback/batch-generate');
      if (response.ok) {
        const data = await response.json();
        setPendingCounts(data.pendingReports);
      } else if (response.status === 403) {
        // Silently ignore 403 errors (e.g., when impersonating a student)
        setPendingCounts(null);
      } else {
        console.error('Failed to fetch pending count:', response.statusText);
      }
    } catch (err) {
      console.error('Failed to fetch pending count:', err);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const fetchSubjectDetails = async (subject: 'Física' | 'Química') => {
    // If already expanded and same subject, collapse it
    if (expandedSubject === subject) {
      setExpandedSubject(null);
      return;
    }

    // If already loaded, just expand
    if (subjectDetails[subject]) {
      setExpandedSubject(subject);
      return;
    }

    // Load details
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/instructor/feedback/batch-generate?subject=${encodeURIComponent(subject)}`);
      if (response.ok) {
        const data = await response.json();
        setSubjectDetails(prev => ({
          ...prev,
          [subject]: data.details || []
        }));
        setExpandedSubject(subject);
      } else if (response.status === 403) {
        // Silently ignore 403 errors (e.g., when impersonating a student)
        return;
      } else {
        console.error('Failed to fetch subject details:', response.statusText);
      }
    } catch (err) {
      console.error('Failed to fetch subject details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleGenerateBatch = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      // Start async job
      const response = await fetch('/api/instructor/feedback/batch-generate-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start background job');
      }

      const data = await response.json();

      if (!data.jobStarted) {
        setError(data.message || 'No reports to process');
        setIsProcessing(false);
        return;
      }

      console.log(`🚀 Async job started: ${data.totalReports} reports`);

      // Set up async job tracking
      setAsyncJob({
        isRunning: true,
        totalReports: data.totalReports,
        processedReports: 0,
        subject: data.subject
      });

      // Polling will start automatically via useEffect

    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
      setAsyncJob(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleProcessSingle = async (reportId: string, studentName: string) => {
    // Add to processing set
    setProcessingReports(prev => new Set([...prev, reportId]));
    setReportErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[reportId];
      return newErrors;
    });

    try {
      console.log(`🚀 Processing single report: ${reportId} (${studentName})`);

      const response = await fetch('/api/instructor/feedback/generate-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate feedback');
      }

      // Success! Mark as processed
      console.log(`✅ Report ${reportId} processed successfully`);
      setProcessedReports(prev => new Set([...prev, reportId]));

      // Small delay to ensure DB has finished writing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh counts first
      await fetchPendingCount();

      // Force refetch of subject details to ensure fresh data
      if (expandedSubject) {
        // Clear cache
        setSubjectDetails(prev => {
          const newDetails = {...prev};
          delete newDetails[expandedSubject];
          return newDetails;
        });

        // Refetch fresh data from server
        try {
          const response = await fetch(`/api/instructor/feedback/batch-generate?subject=${encodeURIComponent(expandedSubject)}`);
          if (response.ok) {
            const data = await response.json();
            setSubjectDetails(prev => ({
              ...prev,
              [expandedSubject]: data.details || []
            }));
          }
        } catch (e) {
          console.error('Failed to refetch subject details:', e);
        }
      }

    } catch (err: any) {
      console.error(`❌ Failed to process report ${reportId}:`, err.message);
      setReportErrors(prev => ({
        ...prev,
        [reportId]: err.message
      }));
    } finally {
      // Remove from processing set
      setProcessingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h3 className="text-xl font-semibold text-slate-800">
            Generación de Feedback AI - Batch
          </h3>
        </div>
        <p className="text-sm text-slate-600">
          Genera feedback automático para todos los reportes semanales pendientes usando Claude Haiku 4.5
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Pending Reports Counter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Física Card - Clickeable */}
          <button
            onClick={() => fetchSubjectDetails('Física')}
            disabled={isLoadingCounts || (pendingCounts?.Física || 0) === 0}
            className={`p-4 rounded-lg border text-left transition-all ${
              expandedSubject === 'Física'
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-md'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 mb-1">Física</p>
              {expandedSubject === 'Física' && (
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {isLoadingCounts ? '...' : pendingCounts?.Física || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Click para ver detalles</p>
          </button>

          {/* Química Card - Clickeable */}
          <button
            onClick={() => fetchSubjectDetails('Química')}
            disabled={isLoadingCounts || (pendingCounts?.Química || 0) === 0}
            className={`p-4 rounded-lg border text-left transition-all ${
              expandedSubject === 'Química'
                ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-200'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-md'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 mb-1">Química</p>
              {expandedSubject === 'Química' && (
                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {isLoadingCounts ? '...' : pendingCounts?.Química || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Click para ver detalles</p>
          </button>

          {/* Total - No clickeable */}
          <div className="p-4 bg-teal-50 rounded-lg border-2 border-teal-500">
            <p className="text-sm font-medium text-teal-700 mb-1">Total Pendientes</p>
            <p className="text-3xl font-bold text-teal-600">
              {isLoadingCounts ? '...' : pendingCounts?.total || 0}
            </p>
          </div>
        </div>

        {/* Details Table */}
        {expandedSubject && (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Reportes pendientes de {expandedSubject} ({subjectDetails[expandedSubject]?.length || 0})
              </h4>
              <button
                onClick={() => setExpandedSubject(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="text-center py-8">
                <svg className="animate-spin h-6 w-6 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-slate-600 mt-2">Cargando detalles...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-2 px-3 font-medium text-slate-700">Alumno</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-700">Curso</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-700">Fecha Reporte</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-700">Enviado</th>
                      <th className="text-center py-2 px-3 font-medium text-slate-700">Procesar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectDetails[expandedSubject]?.map((report) => {
                      const isProcessing = processingReports.has(report.id);
                      const isProcessed = processedReports.has(report.id);
                      const hasError = reportErrors[report.id];

                      return (
                        <tr key={report.id} className={`border-b border-slate-200 hover:bg-white transition-colors ${isProcessed ? 'bg-green-50' : ''}`}>
                          <td className="py-2 px-3">
                            <div>
                              <p className="font-medium text-slate-800">{report.studentName}</p>
                              <p className="text-xs text-slate-500">{report.studentId}</p>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-700">
                            {report.academicYear} {report.division}
                          </td>
                          <td className="py-2 px-3 text-slate-700">
                            {formatDate(report.weekStart)}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-xs">
                            {formatDate(report.submittedAt)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isProcessed ? (
                              <div className="flex items-center justify-center gap-1 text-green-600">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs">Procesado</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => handleProcessSingle(report.id, report.studentName)}
                                  disabled={isProcessing || isProcessed}
                                  className="p-1.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center"
                                  title={isProcessing ? 'Procesando...' : 'Procesar reporte'}
                                >
                                  {isProcessing ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </button>
                                {hasError && (
                                  <span className="text-xs text-red-600 max-w-[120px] truncate" title={hasError}>
                                    Error
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">
              {pendingCounts?.total === 0
                ? '¡Todo al día! No hay reportes pendientes'
                : `${pendingCounts?.total || 0} reportes esperando feedback`
              }
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Costo estimado: ~${((pendingCounts?.total || 0) * 0.005).toFixed(2)} USD
            </p>
          </div>
          <button
            onClick={handleGenerateBatch}
            disabled={isProcessing || pendingCounts?.total === 0 || isLoadingCounts}
            className="ml-4 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              'Generar Feedback AI'
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isProcessing && asyncJob && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {asyncJob.isRunning ? 'Procesando en background...' : 'Procesando...'}
              </span>
              <span className="font-medium text-slate-800">
                {asyncJob.processedReports} de {asyncJob.totalReports} completados ({progress}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-teal-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <p>
                Procesamiento asíncrono activado. Puedes navegar a otras páginas.
              </p>
              <p className="font-medium">
                ~{Math.ceil((asyncJob.totalReports - asyncJob.processedReports) / 5 * 15)}s restantes
              </p>
            </div>
          </div>
        )}

        {/* Success Results */}
        {result && !error && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 space-y-3">
                <p className="font-semibold text-green-900">Procesamiento completado</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Total procesados:</span>{' '}
                    <span className="font-semibold text-slate-800">{result.total}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Exitosos:</span>{' '}
                    <span className="font-semibold text-green-600">
                      {result.successful}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Fallidos:</span>{' '}
                    <span className="font-semibold text-red-600">
                      {result.failed}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Tiempo:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {(result.totalTimeMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Costo:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      ${result.totalCost.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Tasa de éxito:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {((result.successful / result.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {result.failed > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
                    <p className="text-sm font-medium text-red-900 mb-2">
                      Reportes fallidos ({result.failed}):
                    </p>
                    <ul className="text-xs space-y-1 text-red-800">
                      {result.failedReports.slice(0, 5).map(fr => (
                        <li key={fr.reportId} className="font-mono">
                          {fr.reportId}: {fr.error}
                        </li>
                      ))}
                      {result.failedReports.length > 5 && (
                        <li className="italic">
                          ... y {result.failedReports.length - 5} más
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-red-900 mb-1">Error al generar feedback</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-medium">Información importante:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>El procesamiento usa rúbricas oficiales según la fase del reporte</li>
                <li>Costo aproximado: $0.005 USD por reporte (con prompt caching)</li>
                <li>Los reportes se procesan de 5 en 5 para evitar sobrecarga</li>
                <li>Si un reporte falla, se reintenta automáticamente hasta 3 veces</li>
                <li>El sistema también se ejecuta automáticamente cada noche a las 2 AM</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
