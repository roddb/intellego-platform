/**
 * Visor de resultados de evaluación CONSUDEC
 * Muestra score, feedback, fortalezas y mejoras por pregunta
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Award,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  Calculator,
  CheckSquare,
  XSquare,
} from 'lucide-react';
import type { SubmissionResult } from '@/types/consudec-activity';
import {
  getLevelLabel,
  getLevelColor,
  getLevelIcon,
  formatDate,
  formatPercentage,
} from '@/lib/consudec-utils';
import LatexRenderer from '@/components/ui/LatexRenderer';

interface SubmissionResultViewerProps {
  submission: SubmissionResult;
  onBack?: () => void;
  className?: string;
}

export default function SubmissionResultViewer({
  submission,
  onBack,
  className = '',
}: SubmissionResultViewerProps) {
  // Estado para expandir/colapsar preguntas
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(submission.activity.questions.map((q) => q.id)) // Todas expandidas por defecto
  );

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Determinar score final (manual override o AI)
  const finalScore = submission.manualScore ?? submission.overallScore ?? 0;
  const hasManualOverride = submission.manualScore !== null && submission.manualScore !== undefined;

  // Obtener nivel general
  const overallLevel =
    finalScore >= 85
      ? 'excellent'
      : finalScore >= 70
      ? 'good'
      : finalScore >= 50
      ? 'satisfactory'
      : 'insufficient';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con score general */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg border border-slate-200 p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-slate-800">
                {submission.activity.title}
              </h2>
              {/* 🆕 Badge de tipo de actividad */}
              {submission.activity.activityType === 'clinical' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                  ⚡ Caso Clínico
                </span>
              )}
            </div>
            <p className="text-slate-600 text-sm">{submission.activity.description}</p>
          </div>
          <Award className="w-10 h-10 text-blue-500 flex-shrink-0" />
        </div>

        {/* Score principal */}
        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-200">
          {/* Score circle */}
          <div className="flex-shrink-0">
            <div
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${getLevelColor(
                overallLevel
              )}`}
            >
              <span className="text-3xl font-bold text-slate-800">{finalScore}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>

          {/* Info del nivel */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getLevelIcon(overallLevel)}</span>
              <span className="text-xl font-semibold text-slate-800">
                {getLevelLabel(overallLevel)}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Porcentaje logrado: <strong>{formatPercentage(submission.percentageAchieved || 0)}</strong>
            </p>

            {hasManualOverride && (
              <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <User className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <strong>Evaluación ajustada manualmente</strong>
                  {submission.overallScore !== null && (
                    <p className="mt-1">
                      Score IA original: <strong>{submission.overallScore}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex-shrink-0 text-right text-xs text-slate-500">
            {submission.submittedAt && (
              <div className="flex items-center justify-end gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Entregado: {formatDate(submission.submittedAt)}</span>
              </div>
            )}
            {submission.evaluatedAt && (
              <div className="flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Evaluado: {formatDate(submission.evaluatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Caso educativo (colapsable) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
      >
        <details className="group">
          <summary className="cursor-pointer font-semibold text-slate-800 flex items-center justify-between">
            <span>📖 Ver Caso Educativo</span>
            <ChevronDown className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-4 prose prose-sm max-w-none text-slate-700">
            <LatexRenderer text={submission.activity.caseText} className="whitespace-pre-wrap" />
          </div>
        </details>
      </motion.div>

      {/* Preguntas y respuestas */}
      {submission.activity.questions.map((question, index) => {
        const studentAnswer = submission.answers[question.id] || '';
        const questionScore = submission.questionScores?.[question.id];
        const isExpanded = expandedQuestions.has(question.id);

        // Si no hay score, mostrar advertencia
        if (!questionScore) {
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-amber-300 p-6"
            >
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                  Pregunta {index + 1}: Sin evaluación disponible
                </span>
              </div>
            </motion.div>
          );
        }

        const levelColor = getLevelColor(questionScore.level);

        return (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Header de la pregunta */}
            <button
              onClick={() => toggleQuestion(question.id)}
              className="w-full p-6 flex items-start justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1 text-left">
                {/* Número y badge de nivel */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${levelColor}`}>
                    {questionScore.score}
                  </div>
                </div>

                {/* Texto de la pregunta */}
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-1">
                    <h4 className="text-base font-semibold text-slate-800 flex-1">
                      {question.text}
                    </h4>
                    {/* 🆕 Badge de tipo de pregunta */}
                    {question.questionType === 'calculation' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded flex-shrink-0">
                        <Calculator className="w-3 h-3" />
                        Cálculo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xl">{getLevelIcon(questionScore.level)}</span>
                    <span className="text-sm font-medium text-slate-700">
                      {getLevelLabel(questionScore.level)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Icono expandir/colapsar */}
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
            </button>

            {/* Contenido expandido */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-4 border-t border-slate-200 pt-4">
                    {/* Respuesta del estudiante */}
                    <div>
                      <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Tu Respuesta
                      </h5>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
                        <LatexRenderer text={studentAnswer} className="whitespace-pre-wrap" />
                      </div>
                    </div>

                    {/* 🆕 Evaluación de Cálculo (solo para preguntas tipo calculation) */}
                    {questionScore.calculationEvaluation && (
                      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Evaluación de Cálculo
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Respuesta Numérica */}
                          <div className="flex items-start gap-2">
                            {questionScore.calculationEvaluation.isNumericCorrect ? (
                              <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XSquare className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs font-semibold text-slate-700">Valor Numérico</p>
                              <p
                                className={`text-sm ${
                                  questionScore.calculationEvaluation.isNumericCorrect
                                    ? 'text-green-700'
                                    : 'text-red-700'
                                }`}
                              >
                                {questionScore.calculationEvaluation.isNumericCorrect
                                  ? 'Correcto'
                                  : 'Incorrecto'}
                                {questionScore.calculationEvaluation.numericValue !== null && (
                                  <span className="block text-xs text-slate-600 mt-0.5">
                                    Valor: {questionScore.calculationEvaluation.numericValue}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Fórmula */}
                          <div className="flex items-start gap-2">
                            {questionScore.calculationEvaluation.hasFormula ? (
                              <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XSquare className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs font-semibold text-slate-700">Fórmula</p>
                              <p
                                className={`text-sm ${
                                  questionScore.calculationEvaluation.hasFormula
                                    ? 'text-green-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {questionScore.calculationEvaluation.hasFormula
                                  ? 'Incluida'
                                  : 'No incluida'}
                              </p>
                            </div>
                          </div>

                          {/* Unidades */}
                          <div className="flex items-start gap-2">
                            {questionScore.calculationEvaluation.hasCorrectUnits ? (
                              <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XSquare className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs font-semibold text-slate-700">Unidades</p>
                              <p
                                className={`text-sm ${
                                  questionScore.calculationEvaluation.hasCorrectUnits
                                    ? 'text-green-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {questionScore.calculationEvaluation.hasCorrectUnits
                                  ? 'Correctas'
                                  : 'Incorrectas/Ausentes'}
                              </p>
                            </div>
                          </div>

                          {/* Explicación */}
                          <div className="flex items-start gap-2">
                            {questionScore.calculationEvaluation.hasExplanation ? (
                              <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XSquare className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs font-semibold text-slate-700">Interpretación</p>
                              <p
                                className={`text-sm ${
                                  questionScore.calculationEvaluation.hasExplanation
                                    ? 'text-green-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {questionScore.calculationEvaluation.hasExplanation
                                  ? 'Incluida'
                                  : 'No incluida'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Crédito Parcial */}
                        {questionScore.calculationEvaluation.partialCreditApplied && (
                          <div className="mt-3 pt-3 border-t border-indigo-300">
                            <p className="text-xs text-indigo-700 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>
                                <strong>Crédito parcial aplicado:</strong> Método correcto identificado
                                pero resultado incorrecto
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback general */}
                    {questionScore.feedback && (
                      <div>
                        <h5 className="text-sm font-semibold text-slate-700 mb-2">
                          Retroalimentación
                        </h5>
                        <div className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <LatexRenderer text={questionScore.feedback} />
                        </div>
                      </div>
                    )}

                    {/* Fortalezas */}
                    {questionScore.strengths && questionScore.strengths.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Fortalezas
                        </h5>
                        <ul className="space-y-1">
                          {questionScore.strengths.map((strength, i) => (
                            <li
                              key={i}
                              className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 flex items-start gap-2"
                            >
                              <span className="text-green-600 flex-shrink-0">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Áreas de mejora */}
                    {questionScore.improvements && questionScore.improvements.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Áreas de Mejora
                        </h5>
                        <ul className="space-y-1">
                          {questionScore.improvements.map((improvement, i) => (
                            <li
                              key={i}
                              className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 flex items-start gap-2"
                            >
                              <span className="text-amber-600 flex-shrink-0">→</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Feedback general de la actividad */}
      {submission.generalFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6"
        >
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Retroalimentación General
          </h3>
          <div className="prose prose-sm max-w-none text-slate-700">
            <LatexRenderer text={submission.generalFeedback} className="whitespace-pre-wrap" />
          </div>
        </motion.div>
      )}

      {/* Feedback manual del instructor (si existe) */}
      {submission.manualFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-sm border border-amber-300 p-6"
        >
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-600" />
            Comentarios del Instructor
          </h3>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
            {submission.manualFeedback}
          </div>
        </motion.div>
      )}

      {/* Botón volver */}
      {onBack && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            ← Volver a Actividades
          </button>
        </div>
      )}
    </div>
  );
}
