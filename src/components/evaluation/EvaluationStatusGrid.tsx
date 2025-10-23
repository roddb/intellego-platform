"use client";

import { useState, useEffect } from "react";

interface EvaluationData {
  examDate?: string;
  score?: number;
  evaluationId?: string;
  submitted: boolean;
}

interface StudentEvaluation {
  id: string;
  name: string;
  studentId: string;
  evaluations: {
    [examTopic: string]: EvaluationData;
  };
}

interface EvaluationStatusResponse {
  students: StudentEvaluation[];
  examTopics: string[];
  summary: {
    totalStudents: number;
    totalExams: number;
    completionByTopic: {
      [examTopic: string]: {
        completed: number;
        pending: number;
      };
    };
  };
}

interface NavigationData {
  [subject: string]: {
    [year: string]: string[]; // array of divisions
  };
}

export default function EvaluationStatusGrid() {
  // Filter state
  const [materia, setMateria] = useState<"Física" | "Química" | "">("");
  const [division, setDivision] = useState("");
  const [anioAcademico, setAnioAcademico] = useState("");

  // Navigation data
  const [navigationData, setNavigationData] = useState<NavigationData>({});
  const [isLoadingNav, setIsLoadingNav] = useState(true);

  // Evaluation data
  const [evaluationData, setEvaluationData] =
    useState<EvaluationStatusResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load navigation data on mount
  useEffect(() => {
    fetchNavigationData();
  }, []);

  // Load evaluation data when filters change
  useEffect(() => {
    if (materia && division && anioAcademico) {
      fetchEvaluationData();
    } else {
      setEvaluationData(null);
    }
  }, [materia, division, anioAcademico]);

  const fetchNavigationData = async () => {
    try {
      setIsLoadingNav(true);
      const response = await fetch(
        "/api/instructor/hierarchical?action=navigation"
      );

      if (response.ok) {
        const result = await response.json();
        setNavigationData(result.data || {});
      } else {
        console.error("Failed to fetch navigation data");
      }
    } catch (error) {
      console.error("Error fetching navigation data:", error);
    } finally {
      setIsLoadingNav(false);
    }
  };

  const fetchEvaluationData = async () => {
    try {
      setIsLoadingData(true);
      setError(null);

      const params = new URLSearchParams({
        subject: materia,
        division: division,
        academicYear: anioAcademico,
      });

      const response = await fetch(
        `/api/instructor/evaluation/status?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch evaluation data");
      }

      const data = await response.json();
      setEvaluationData(data);
    } catch (error) {
      console.error("Error fetching evaluation data:", error);
      setError("Error al cargar los datos de evaluaciones");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Derived options for selects
  const availableSubjects = Object.keys(navigationData);
  const availableYears = materia
    ? Object.keys(navigationData[materia] || {})
    : [];
  const availableDivisions =
    materia && anioAcademico
      ? navigationData[materia]?.[anioAcademico] || []
      : [];

  // Calculate completion percentage for a topic
  const getCompletionPercentage = (examTopic: string) => {
    if (!evaluationData) return 0;
    const completion = evaluationData.summary.completionByTopic[examTopic];
    if (!completion) return 0;
    const total = completion.completed + completion.pending;
    return total > 0 ? Math.round((completion.completed / total) * 100) : 0;
  };

  if (isLoadingNav) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-8 w-8 text-teal-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="ml-3 text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-5 rounded-t-lg">
        <div className="flex items-center gap-3">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h3 className="text-xl font-semibold text-white">
            Estado de Evaluaciones
          </h3>
        </div>
        <p className="text-sm text-teal-50 mt-1">
          Visualiza qué alumnos tienen evaluaciones cargadas por examen
        </p>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Materia */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Materia
            </label>
            <select
              value={materia}
              onChange={(e) => {
                setMateria(e.target.value as "Física" | "Química" | "");
                setAnioAcademico("");
                setDivision("");
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            >
              <option value="">Seleccione materia</option>
              {availableSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Año Académico */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Año Académico
            </label>
            <select
              value={anioAcademico}
              onChange={(e) => {
                setAnioAcademico(e.target.value);
                setDivision("");
              }}
              disabled={!materia}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="">Seleccione año</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* División */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              División
            </label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              disabled={!materia || !anioAcademico}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="">Seleccione división</option>
              {availableDivisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!materia || !division || !anioAcademico ? (
          <div className="text-center py-12">
            <svg
              className="h-16 w-16 mx-auto text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-slate-600 font-medium">
              Selecciona materia, año y división para ver el estado de
              evaluaciones
            </p>
          </div>
        ) : isLoadingData ? (
          <div className="text-center py-12">
            <svg
              className="animate-spin h-10 w-10 mx-auto text-teal-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-slate-600">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : evaluationData && evaluationData.students.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="h-16 w-16 mx-auto text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-slate-600 font-medium">
              No hay estudiantes en esta división
            </p>
            <p className="text-slate-500 text-sm mt-2">
              {materia} - {division} ({anioAcademico})
            </p>
          </div>
        ) : evaluationData && evaluationData.examTopics.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="h-16 w-16 mx-auto text-amber-400 mb-4"
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
            <p className="text-slate-600 font-medium">
              No hay evaluaciones cargadas para este curso
            </p>
            <p className="text-slate-500 text-sm mt-2">
              {materia} - {division} ({anioAcademico})
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {evaluationData.summary.totalStudents} estudiantes en el curso
            </p>
          </div>
        ) : evaluationData ? (
          <>
            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-700">
                  Total Estudiantes
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {evaluationData.summary.totalStudents}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm font-medium text-purple-700">
                  Total Exámenes
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {evaluationData.summary.totalExams}
                </p>
              </div>
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                <p className="text-sm font-medium text-teal-700">
                  Total Evaluaciones
                </p>
                <p className="text-2xl font-bold text-teal-900">
                  {Object.values(evaluationData.summary.completionByTopic).reduce(
                    (sum, topic) => sum + topic.completed,
                    0
                  )}
                </p>
              </div>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2 border-slate-300">
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-50 text-left py-3 px-4 font-semibold text-slate-700 border-r border-slate-300">
                      Alumno
                    </th>
                    {evaluationData.examTopics.map((examTopic) => (
                      <th
                        key={examTopic}
                        className="py-3 px-3 font-semibold text-slate-700 border-l border-slate-200"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-sm font-semibold text-slate-800 max-w-[150px] text-center">
                            {examTopic}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="text-green-600 font-medium">
                              {
                                evaluationData.summary.completionByTopic[
                                  examTopic
                                ].completed
                              }
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="text-red-600 font-medium">
                              {
                                evaluationData.summary.completionByTopic[
                                  examTopic
                                ].pending
                              }
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-teal-600 h-1.5 rounded-full transition-all"
                              style={{
                                width: `${getCompletionPercentage(examTopic)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evaluationData.students.map((student, idx) => (
                    <tr
                      key={student.id}
                      className={`${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      } hover:bg-blue-50 transition-colors border-b border-slate-200 last:border-b-0`}
                    >
                      <td className="sticky left-0 z-10 py-3 px-4 border-r border-slate-300 bg-inherit">
                        <div>
                          <p className="font-medium text-slate-800">
                            {student.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {student.studentId}
                          </p>
                        </div>
                      </td>
                      {evaluationData.examTopics.map((examTopic) => {
                        const evaluation = student.evaluations[examTopic];
                        const isSubmitted = evaluation?.submitted;

                        return (
                          <td
                            key={examTopic}
                            className="py-3 px-3 text-center border-l border-slate-200"
                          >
                            {isSubmitted ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-12 h-12 rounded-lg bg-green-100 border-2 border-green-500 flex items-center justify-center">
                                  <span className="text-lg font-bold text-green-700">
                                    {evaluation.score}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="h-3 w-3 text-green-600"
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
                                  <span className="text-xs text-green-600">
                                    Cargada
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <div className="w-12 h-12 rounded-lg bg-red-50 border-2 border-red-300 flex items-center justify-center">
                                  <svg
                                    className="h-6 w-6 text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500"></div>
                <span className="text-slate-600">Evaluación cargada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-50 border-2 border-red-300"></div>
                <span className="text-slate-600">Pendiente</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
