"use client"

import { useState, useEffect } from 'react';

interface DatabaseMetadata {
  exportDate: string;
  exportTime: string;
  version: string;
  platform: string;
  exportType: string;
  totalStudents: number;
  totalReports: number;
  totalFiles: number;
  structure: string;
  sedeBreakdown?: Array<{
    sede: string;
    studentCount: number;
    subjects: string[];
  }>;
}

interface DatabaseManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DatabaseManager({ isOpen, onClose }: DatabaseManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<DatabaseMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPreview();
    }
  }, [isOpen]);

  const fetchPreview = async () => {
    setIsPreviewLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/instructor/database-export?preview=true');
      
      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          throw new Error(`Límite de solicitudes excedido. Intente nuevamente en ${data.resetTime} segundos.`);
        }
        throw new Error('Error al obtener vista previa de la base de datos');
      }
      
      const data = await response.json();
      setMetadata(data.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/instructor/database-export');
      
      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          throw new Error(`Límite de exportaciones excedido. Intente nuevamente en ${data.resetTime} segundos.`);
        }
        throw new Error('Error al exportar la base de datos');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `intellego_database_export_${new Date().toISOString().split('T')[0]}.zip`;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Show success message
      setTimeout(() => {
        alert('Base de datos exportada exitosamente como archivo ZIP');
        onClose();
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Administración de Base de Datos</h2>
              <p className="text-purple-100">
                Exportar información completa organizada por sede, materia, año y alumno
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isPreviewLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Cargando estadísticas...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : metadata ? (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600">{metadata.totalStudents}</div>
                  <div className="text-sm text-blue-700">Estudiantes Totales</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600">{metadata.totalReports}</div>
                  <div className="text-sm text-green-700">Reportes Totales</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-600">{metadata.totalFiles}</div>
                  <div className="text-sm text-purple-700">Archivos JSON</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                  <div className="text-3xl font-bold text-orange-600">{metadata.sedeBreakdown?.length || 0}</div>
                  <div className="text-sm text-orange-700">Sedes</div>
                </div>
              </div>

              {/* Sede Breakdown */}
              {metadata.sedeBreakdown && metadata.sedeBreakdown.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-slate-800 mb-3">Distribución por Sede</h3>
                  <div className="space-y-3">
                    {metadata.sedeBreakdown.map((sede, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-slate-800">{sede.sede}</h4>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm">
                          {sede.studentCount} estudiantes
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {sede.subjects.map((subject, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Structure Preview */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-amber-800 mb-2">Estructura de Exportación (ZIP)</h3>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>📁 Sede (ej: Colegiales)</p>
                  <p className="ml-4">📁 Año Académico (ej: 5to_Año)</p>
                  <p className="ml-8">📁 Materia (ej: Física)</p>
                  <p className="ml-12">📁 Nombre del Alumno (ej: Mercedes_Di_Bernardo)</p>
                  <p className="ml-16">📄 semana_1.json</p>
                  <p className="ml-16">📄 semana_2.json</p>
                  <p className="ml-16">📄 semana_3.json</p>
                  <p className="ml-20">• Cada archivo contiene respuestas de una semana</p>
                  <p className="ml-20">• Optimizado para análisis con IA</p>
                </div>
              </div>

              {/* Export Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Información de Exportación:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Formato: Archivo ZIP con estructura de carpetas</li>
                      <li>Un archivo JSON por cada semana de cada alumno</li>
                      <li>Estructura optimizada para análisis con IA</li>
                      <li>Mínimo uso de tokens para procesamiento</li>
                      <li>Incluye metadata.json con estadísticas globales</li>
                      <li>Compresión DEFLATE nivel 9 para menor tamaño</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              {metadata && (
                <>
                  Última actualización: {metadata.exportDate} {metadata.exportTime}
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                disabled={isLoading || isPreviewLoading || !metadata}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Exportando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Exportar Base de Datos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}