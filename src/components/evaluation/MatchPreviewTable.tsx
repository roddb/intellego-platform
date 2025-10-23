"use client";

import { useState, useEffect } from "react";

interface MatchPreview {
  fileName: string;
  studentId: string | null;
  studentName: string | null;
  matchConfidence: number;
  status: "matched" | "not_found" | "low_confidence";
}

interface Student {
  id: string;
  name: string;
  email?: string;
}

interface MatchPreviewTableProps {
  matches: MatchPreview[];
  availableStudents: Student[];
  onConfirm: (finalMatches: Map<string, string>) => void;
  onBack: () => void;
  isProcessing: boolean;
}

export default function MatchPreviewTable({
  matches,
  availableStudents,
  onConfirm,
  onBack,
  isProcessing,
}: MatchPreviewTableProps) {
  // Map: fileName -> studentId (or 'exclude')
  const [assignments, setAssignments] = useState<Map<string, string>>(
    new Map()
  );

  // Initialize assignments from matches
  useEffect(() => {
    const initialAssignments = new Map<string, string>();
    matches.forEach((match) => {
      if (match.studentId) {
        initialAssignments.set(match.fileName, match.studentId);
      }
    });
    setAssignments(initialAssignments);
  }, [matches]);

  const handleAssignmentChange = (fileName: string, studentId: string) => {
    const newAssignments = new Map(assignments);
    if (studentId === "exclude") {
      newAssignments.delete(fileName);
    } else {
      newAssignments.set(fileName, studentId);
    }
    setAssignments(newAssignments);
  };

  const handleConfirm = () => {
    // Filter out excluded files
    const finalMatches = new Map(
      Array.from(assignments.entries()).filter(
        ([_, studentId]) => studentId !== "exclude"
      )
    );
    onConfirm(finalMatches);
  };

  // Calculate stats
  const totalMatches = matches.length;
  const assignedCount = assignments.size;
  const excludedCount = totalMatches - assignedCount;
  const readyToProcess = assignedCount > 0;

  // Get status badge
  const getStatusBadge = (match: MatchPreview) => {
    if (match.status === "matched") {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
          ✓ Match {match.matchConfidence.toFixed(0)}%
        </span>
      );
    } else if (match.status === "low_confidence") {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
          ⚠️ Baja confianza {match.matchConfidence.toFixed(0)}%
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
          ✗ No encontrado
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-600 font-medium mb-1">Total</p>
          <p className="text-2xl font-bold text-blue-900">{totalMatches}</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600 font-medium mb-1">Asignados</p>
          <p className="text-2xl font-bold text-green-900">{assignedCount}</p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm text-slate-600 font-medium mb-1">Excluidos</p>
          <p className="text-2xl font-bold text-slate-900">{excludedCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Archivo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Estudiante Asignado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {matches.map((match) => {
              const currentAssignment = assignments.get(match.fileName);
              const isExcluded = !currentAssignment;

              return (
                <tr
                  key={match.fileName}
                  className={isExcluded ? "bg-slate-50 opacity-60" : ""}
                >
                  {/* File Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-slate-400"
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
                      <span className="font-medium text-slate-800">
                        {match.fileName}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">{getStatusBadge(match)}</td>

                  {/* Student Assignment Dropdown */}
                  <td className="px-4 py-3">
                    <select
                      value={currentAssignment || ""}
                      onChange={(e) =>
                        handleAssignmentChange(match.fileName, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    >
                      {!currentAssignment && (
                        <option value="">Seleccione un estudiante</option>
                      )}

                      {/* Suggested match (if exists) */}
                      {match.studentId && (
                        <option value={match.studentId}>
                          {match.studentName} (Sugerido)
                        </option>
                      )}

                      {/* All available students */}
                      {availableStudents
                        .filter((s) => s.id !== match.studentId) // Don't duplicate suggested
                        .map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                    </select>
                  </td>

                  {/* Exclude Button */}
                  <td className="px-4 py-3">
                    {!isExcluded ? (
                      <button
                        onClick={() =>
                          handleAssignmentChange(match.fileName, "exclude")
                        }
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Excluir
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // Re-include with original match if exists
                          if (match.studentId) {
                            handleAssignmentChange(
                              match.fileName,
                              match.studentId
                            );
                          }
                        }}
                        className="px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded transition-colors"
                      >
                        Incluir
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Warnings */}
      {matches.some(
        (m) => m.status === "low_confidence" || m.status === "not_found"
      ) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Atención requerida</p>
              <ul className="list-disc list-inside space-y-1">
                {matches.filter((m) => m.status === "low_confidence").length >
                  0 && (
                  <li>
                    {
                      matches.filter((m) => m.status === "low_confidence")
                        .length
                    }{" "}
                    archivo(s) con baja confianza de match. Verifique la
                    asignación.
                  </li>
                )}
                {matches.filter((m) => m.status === "not_found").length > 0 && (
                  <li>
                    {matches.filter((m) => m.status === "not_found").length}{" "}
                    archivo(s) sin match automático. Asigne manualmente o
                    excluya.
                  </li>
                )}
              </ul>
            </div>
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
            <p className="font-medium mb-1">Instrucciones:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Revise cada asignación sugerida</li>
              <li>Corrija manualmente usando el dropdown si es necesario</li>
              <li>Use "Excluir" para omitir archivos del procesamiento</li>
              <li>
                Solo los archivos asignados serán procesados al confirmar
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        <button
          onClick={handleConfirm}
          disabled={!readyToProcess || isProcessing}
          className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Procesando...
            </>
          ) : (
            <>
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Confirmar y Procesar ({assignedCount} exámenes)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
