"use client";

import { useState, useCallback } from "react";

interface UploadedFile {
  file: File;
  name: string;
  size: number;
}

interface FileUploadZoneProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function FileUploadZone({
  files,
  onFilesChange,
  onNext,
  onBack,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File validation
  const validateFile = (file: File): string | null => {
    // Check extension
    if (!file.name.endsWith(".md")) {
      return `"${file.name}" no es un archivo .md`;
    }

    // Check size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return `"${file.name}" excede el tamaño máximo de 5MB`;
    }

    // Check if already uploaded
    if (files.some((f) => f.name === file.name)) {
      return `"${file.name}" ya fue agregado`;
    }

    return null;
  };

  // Handle file selection
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      setError(null);
      const newFiles: UploadedFile[] = [];
      const errors: string[] = [];

      Array.from(fileList).forEach((file) => {
        const validationError = validateFile(file);

        if (validationError) {
          errors.push(validationError);
        } else {
          newFiles.push({
            file,
            name: file.name,
            size: file.size,
          });
        }
      });

      if (errors.length > 0) {
        setError(errors.join(", "));
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }
    },
    [files, onFilesChange]
  );

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    handleFiles(e.dataTransfer.files);
  };

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Remove file
  const handleRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? "border-teal-500 bg-teal-50"
            : "border-slate-300 bg-slate-50 hover:border-teal-400"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <svg
            className={`w-16 h-16 ${
              isDragging ? "text-teal-500" : "text-slate-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div>
            <p className="text-lg font-medium text-slate-700 mb-1">
              Arrastra archivos .md aquí
            </p>
            <p className="text-sm text-slate-500">o haz clic para seleccionar</p>
          </div>

          <input
            type="file"
            multiple
            accept=".md"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />

          <label
            htmlFor="file-upload"
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer transition-colors"
          >
            Seleccionar Archivos
          </label>

          <p className="text-xs text-slate-500 mt-2">
            Máximo 5MB por archivo • Solo archivos .md
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-slate-800 mb-3">
            Archivos Cargados ({files.length})
          </h3>

          <div className="space-y-2">
            {files.map((uploadedFile, index) => (
              <div
                key={`${uploadedFile.name}-${index}`}
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-teal-300 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <svg
                    className="w-8 h-8 text-teal-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(index)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={`Eliminar ${uploadedFile.name}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">📋 Convención de nombres (todos estos formatos funcionan):</p>
            <div className="space-y-2">
              <div>
                <p className="font-semibold text-xs mb-1">✓ Recomendado (más confiable):</p>
                <code className="px-2 py-1 bg-blue-100 rounded text-xs block">Apellido_Nombre.md</code>
                <p className="text-xs text-blue-600 mt-0.5 ml-2">Ejemplos: Rosiello_Ana.md, Greco_Candela.md</p>
              </div>

              <div>
                <p className="font-semibold text-xs mb-1">✓ También aceptados:</p>
                <ul className="text-xs space-y-0.5 ml-2">
                  <li>• Solo apellido: <code className="px-1 bg-blue-100 rounded">Rosiello.md</code></li>
                  <li>• Con espacio: <code className="px-1 bg-blue-100 rounded">Rosiello Ana.md</code></li>
                  <li>• Apellido compuesto: <code className="px-1 bg-blue-100 rounded">Di_Bernardo_Juan.md</code></li>
                  <li>• Nombre primero: <code className="px-1 bg-blue-100 rounded">Ana Rosiello.md</code></li>
                </ul>
              </div>

              <p className="text-xs font-medium text-blue-700 pt-2 border-t border-blue-200">
                💡 El sistema busca automáticamente por apellido y nombre completo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
        >
          Anterior
        </button>

        <button
          onClick={onNext}
          disabled={files.length === 0}
          className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          Continuar al Paso 3
        </button>
      </div>
    </div>
  );
}
