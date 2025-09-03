"use client"

import { useState, useEffect } from 'react';

interface FeedbackViewerProps {
  isOpen: boolean;
  onClose: () => void;
  weekStart: string;
  subject: string;
}

interface Feedback {
  id: string;
  weekStart: string;
  subject: string;
  score?: number;
  generalComments?: string;
  strengths?: string[];
  improvements?: string[];
  aiAnalysis?: string;
  skillsMetrics?: {
    comprehension: number;
    criticalThinking: number;
    selfRegulation: number;
    practicalApplication: number;
    metacognition: number;
  };
  createdAt: string;
  instructor: {
    name: string;
    email: string;
  };
}

export default function FeedbackViewer({ isOpen, onClose, weekStart, subject }: FeedbackViewerProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && weekStart && subject) {
      fetchFeedback();
    }
  }, [isOpen, weekStart, subject]);

  const fetchFeedback = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/student/feedback?weekStart=${weekStart}&subject=${subject}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('No hay retroalimentación disponible para esta semana');
        } else {
          throw new Error('Error al cargar retroalimentación');
        }
        return;
      }
      
      const data = await response.json();
      if (data.exists) {
        setFeedback(data.feedback);
      } else {
        setError('No hay retroalimentación disponible para esta semana');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '✨';
    if (score >= 70) return '👍';
    if (score >= 60) return '💪';
    return '📚';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Retroalimentación</h2>
              <p className="text-teal-100">
                {subject} - Semana del {weekStart}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-teal-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Cargando retroalimentación...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-600">{error}</p>
            </div>
          ) : feedback ? (
            <>
              {/* Score Display */}
              {feedback.score !== undefined && (
                <div className="mb-6 text-center">
                  <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreColor(feedback.score)}`}>
                    <div>
                      <div className="text-4xl font-bold">{feedback.score}</div>
                      <div className="text-sm">de 100</div>
                      <div className="text-2xl mt-1">{getScoreEmoji(feedback.score)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* General Comments */}
              {feedback.generalComments && (
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                    </svg>
                    Comentarios Generales
                  </h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700">{feedback.generalComments}</p>
                  </div>
                </div>
              )}

              {/* Strengths and Improvements Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Strengths */}
                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Fortalezas
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {feedback.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            <span className="text-slate-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Areas for Improvement */}
                {feedback.improvements && feedback.improvements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Áreas de Mejora
                    </h3>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {feedback.improvements.map((improvement, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-600 mr-2">→</span>
                            <span className="text-slate-700">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills Metrics */}
              {feedback.skillsMetrics && (
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Métricas de Habilidades
                  </h3>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Comprensión Conceptual</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${feedback.skillsMetrics.comprehension}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 w-10 text-right">
                            {feedback.skillsMetrics.comprehension}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Pensamiento Crítico</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${feedback.skillsMetrics.criticalThinking}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 w-10 text-right">
                            {feedback.skillsMetrics.criticalThinking}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Autorregulación</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${feedback.skillsMetrics.selfRegulation}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 w-10 text-right">
                            {feedback.skillsMetrics.selfRegulation}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Aplicación Práctica</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${feedback.skillsMetrics.practicalApplication}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 w-10 text-right">
                            {feedback.skillsMetrics.practicalApplication}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Reflexión Metacognitiva</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${feedback.skillsMetrics.metacognition}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 w-10 text-right">
                            {feedback.skillsMetrics.metacognition}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {feedback.aiAnalysis && (
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Análisis Detallado
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-slate-700">{feedback.aiAnalysis}</p>
                  </div>
                </div>
              )}

              {/* Instructor Info */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Evaluado por: {feedback.instructor.name}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(feedback.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}