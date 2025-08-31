"use client"

import { useState, useRef } from 'react';
import { FeedbackJSON } from '@/lib/feedback-processor';

interface FeedbackUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackUploadModal({ isOpen, onClose }: FeedbackUploadModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [jsonContent, setJsonContent] = useState<FeedbackJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [processedFiles, setProcessedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFiles(e.target.files);
    }
  };

  const handleMultipleFiles = async (files: FileList) => {
    setError(null);
    setUploadResult(null);
    setProcessedFiles([]);
    
    const filesArray = Array.from(files);
    const jsonFiles = filesArray.filter(file => file.type === "application/json" || file.name.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      setError("Por favor, seleccione al menos un archivo JSON válido");
      return;
    }
    
    if (jsonFiles.length > 100) {
      setError("Máximo 100 archivos permitidos por carga");
      return;
    }
    
    setFileCount(jsonFiles.length);
    
    // Combined JSON structure
    const combinedJSON: FeedbackJSON = {
      metadata: {
        instructor: "",
        generated_at: new Date().toISOString(),
        version: "1.0"
      },
      feedbacks: []
    };
    
    const errorFiles: string[] = [];
    const successFiles: string[] = [];
    
    for (const file of jsonFiles) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        
        // Validate and extract feedbacks
        if (json.feedbacks && Array.isArray(json.feedbacks)) {
          combinedJSON.feedbacks.push(...json.feedbacks);
          successFiles.push(file.name);
          
          // Use first valid instructor email found
          if (!combinedJSON.metadata.instructor && json.metadata?.instructor) {
            combinedJSON.metadata.instructor = json.metadata.instructor;
          }
        } else {
          errorFiles.push(file.name);
        }
      } catch (err) {
        errorFiles.push(file.name);
      }
    }
    
    setProcessedFiles(successFiles);
    
    if (combinedJSON.feedbacks.length === 0) {
      setError(`No se pudieron procesar feedbacks válidos. Archivos con error: ${errorFiles.join(', ')}`);
      setJsonContent(null);
      return;
    }
    
    // Remove duplicates based on student_email + week_start + subject
    const uniqueFeedbacks = removeDuplicates(combinedJSON.feedbacks);
    const duplicatesRemoved = combinedJSON.feedbacks.length - uniqueFeedbacks.length;
    
    combinedJSON.feedbacks = uniqueFeedbacks;
    setJsonContent(combinedJSON);
    
    if (errorFiles.length > 0) {
      setError(`Archivos con error (${errorFiles.length}): ${errorFiles.join(', ')}`);
    } else if (duplicatesRemoved > 0) {
      setError(`Se eliminaron ${duplicatesRemoved} feedbacks duplicados`);
    }
  };
  
  // Helper function to remove duplicates
  const removeDuplicates = (feedbacks: any[]) => {
    const seen = new Set();
    return feedbacks.filter(fb => {
      const key = `${fb.student_email}-${fb.week_start}-${fb.subject}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const handleFile = (file: File) => {
    // Keep for backward compatibility - single file
    const fileList = new DataTransfer();
    fileList.items.add(file);
    handleMultipleFiles(fileList.files);
  };

  const handleUpload = async () => {
    if (!jsonContent) {
      setError("No hay contenido para cargar");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/instructor/feedback/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonContent),
      });

      const data = await response.json();
      
      if (!response.ok && response.status !== 207) {
        throw new Error(data.details || data.error || 'Error al cargar feedback');
      }

      setUploadResult(data);
      setJsonContent(null); // Clear after successful upload
      
      // Show success message
      if (data.success) {
        setTimeout(() => {
          alert(`Feedback cargado exitosamente. ${data.summary.successful} de ${data.summary.total} procesados.`);
          onClose();
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/instructor/feedback/upload');
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'feedback_template.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al descargar plantilla');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Cargar Devoluciones</h2>
              <p className="text-green-100">
                Suba el archivo JSON con las retroalimentaciones de sus estudiantes
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Download Template Button */}
          <div className="mb-6 text-center">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Plantilla JSON
            </button>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-slate-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileInput}
              multiple
              className="hidden"
            />
            
            <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            
            <p className="text-slate-600 mb-2">
              Arrastre y suelte sus archivos JSON aquí o
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Seleccionar Archivos
            </button>
            <p className="text-sm text-slate-500 mt-2">
              Máximo 100 archivos JSON a la vez
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Files Processed Info */}
          {processedFiles.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-700">
                  {processedFiles.length} archivo(s) procesados correctamente
                </p>
              </div>
            </div>
          )}

          {/* JSON Content Preview */}
          {jsonContent && jsonContent.metadata && jsonContent.feedbacks && !uploadResult && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-800 mb-3">Vista Previa del Contenido Combinado</h3>
              <div className="bg-slate-100 rounded-lg p-4">
                <div className="mb-3">
                  <span className="font-medium text-slate-700">Archivos procesados:</span>
                  <span className="ml-2 text-slate-600">{fileCount}</span>
                </div>
                <div className="mb-3">
                  <span className="font-medium text-slate-700">Instructor:</span>
                  <span className="ml-2 text-slate-600">{jsonContent.metadata.instructor}</span>
                </div>
                <div className="mb-3">
                  <span className="font-medium text-slate-700">Total de Feedbacks únicos:</span>
                  <span className="ml-2 text-slate-600">{jsonContent.feedbacks.length}</span>
                </div>
                
                {/* Preview first 3 feedbacks */}
                <div className="mt-4">
                  <h4 className="font-medium text-slate-700 mb-2">Primeros registros:</h4>
                  <div className="space-y-2">
                    {jsonContent.feedbacks.slice(0, 3).map((fb, idx) => (
                      <div key={idx} className="bg-white rounded p-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Estudiante:</span> {fb.student_email}
                          </div>
                          <div>
                            <span className="font-medium">ID:</span> {fb.student_id}
                          </div>
                          <div>
                            <span className="font-medium">Semana:</span> {fb.week_start}
                          </div>
                          <div>
                            <span className="font-medium">Materia:</span> {fb.subject}
                          </div>
                          {fb.feedback?.score && (
                            <div>
                              <span className="font-medium">Puntaje:</span> {fb.feedback.score}/100
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {jsonContent.feedbacks.length > 3 && (
                    <p className="text-slate-500 text-sm mt-2">
                      ... y {jsonContent.feedbacks.length - 3} más
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-800 mb-3">Resultado del Procesamiento</h3>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{uploadResult.summary.total}</div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{uploadResult.summary.successful}</div>
                  <div className="text-sm text-green-700">Exitosos</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{uploadResult.summary.failed}</div>
                  <div className="text-sm text-red-700">Fallidos</div>
                </div>
              </div>

              {/* Errors Display */}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Errores Encontrados:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadResult.errors.map((err: any, idx: number) => (
                      <div key={idx} className="text-sm text-red-700">
                        • {err.studentEmail} ({err.subject}, {err.week}): {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={isLoading}
            >
              Cerrar
            </button>
            {jsonContent && !uploadResult && (
              <button
                onClick={handleUpload}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Cargar Feedback
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}