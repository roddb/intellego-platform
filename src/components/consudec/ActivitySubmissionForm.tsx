/**
 * Formulario de entrega de actividades CONSUDEC
 * Permite al estudiante completar preguntas y entregar/guardar borrador
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Send,
  Save,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
} from 'lucide-react';
import type { ConsudecActivity, ConsudecSubmission } from '@/types/consudec-activity';
import { countWords, validateWordLimit } from '@/lib/consudec-utils';
import LatexRenderer from '@/components/ui/LatexRenderer';

interface ActivitySubmissionFormProps {
  activity: ConsudecActivity;
  existingSubmission?: ConsudecSubmission | null;
  onSubmitSuccess?: (submissionId: string, score: number) => void;
  className?: string;
}

export default function ActivitySubmissionForm({
  activity,
  existingSubmission,
  onSubmitSuccess,
  className = '',
}: ActivitySubmissionFormProps) {
  const router = useRouter();

  // Estado de respuestas
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (existingSubmission?.answers) {
      return existingSubmission.answers;
    }
    // Inicializar con strings vacíos
    const initialAnswers: Record<string, string> = {};
    activity.questions.forEach((q) => {
      initialAnswers[q.id] = '';
    });
    return initialAnswers;
  });

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitProgress, setSubmitProgress] = useState(0);

  // Auto-save draft cada 30 segundos
  useEffect(() => {
    // No auto-guardar si ya fue entregado
    if (existingSubmission?.status === 'evaluated' || existingSubmission?.status === 'submitted') {
      return;
    }

    const autoSaveInterval = setInterval(() => {
      handleSaveDraft(true); // true = silent mode
    }, 30000); // 30 segundos

    return () => clearInterval(autoSaveInterval);
  }, [answers, existingSubmission]);

  // Calcular progreso de completitud
  const completedQuestions = useMemo(() => {
    return activity.questions.filter((q) => {
      const answer = answers[q.id];
      return answer && answer.trim().length > 0;
    }).length;
  }, [answers, activity.questions]);

  const progressPercentage = useMemo(() => {
    return Math.round((completedQuestions / activity.questions.length) * 100);
  }, [completedQuestions, activity.questions.length]);

  // Manejar cambio en textarea
  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(''); // Limpiar errores al escribir
  }, []);

  // Guardar borrador
  const handleSaveDraft = async (silent: boolean = false) => {
    // No permitir guardar si ya fue entregado
    if (existingSubmission?.status === 'evaluated' || existingSubmission?.status === 'submitted') {
      return;
    }

    if (!silent) setIsSavingDraft(true);
    setError('');

    try {
      const response = await fetch(`/api/consudec/activities/${activity.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar borrador');
      }

      if (!silent) {
        setSuccessMessage('Borrador guardado');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: unknown) {
      if (!silent) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al guardar borrador');
        }
      }
    } finally {
      if (!silent) setIsSavingDraft(false);
    }
  };

  // Validar antes de enviar
  const validateSubmission = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Verificar que todas las preguntas tengan respuesta
    activity.questions.forEach((q) => {
      const answer = answers[q.id];
      if (!answer || answer.trim().length === 0) {
        errors.push(`La pregunta "${q.text.substring(0, 50)}..." no tiene respuesta`);
      }
    });

    // Verificar límites de palabras
    activity.questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer && !validateWordLimit(answer, q.wordLimit)) {
        const wordCount = countWords(answer);
        errors.push(
          `La pregunta "${q.text.substring(0, 50)}..." excede el límite de ${q.wordLimit} palabras (actual: ${wordCount})`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  // Entregar actividad
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar
    const validation = validateSubmission();
    if (!validation.valid) {
      setError(validation.errors.join('. '));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSubmitProgress(0);

    try {
      // Simular progreso durante la evaluación
      const progressInterval = setInterval(() => {
        setSubmitProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch(`/api/consudec/activities/${activity.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al entregar actividad');
      }

      const data = await response.json();

      setSubmitProgress(100);

      // Esperar un poco para mostrar 100%
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Callback de éxito
      if (onSubmitSuccess) {
        onSubmitSuccess(data.submissionId, data.overallScore);
      } else {
        // Redirigir a ver resultados
        router.push(`/dashboard/student-consudec/activities/${activity.id}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido al entregar actividad');
      }
      setSubmitProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificar si ya fue entregado
  const isAlreadySubmitted =
    existingSubmission?.status === 'evaluated' || existingSubmission?.status === 'submitted';

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Mensajes de error/éxito */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start gap-2"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header con título y progreso */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{activity.title}</h2>
            <p className="text-slate-600 text-sm">{activity.description}</p>
            {activity.subject && (
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {activity.subject}
              </span>
            )}
          </div>
          <BookOpen className="w-10 h-10 text-blue-500 flex-shrink-0" />
        </div>

        {/* Progress bar */}
        {!isAlreadySubmitted && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">Progreso</span>
              <span className="text-sm font-bold text-blue-600">
                {completedQuestions}/{activity.questions.length} preguntas completadas
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {isAlreadySubmitted && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Actividad ya entregada y evaluada
            </p>
          </div>
        )}
      </div>

      {/* Caso educativo */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          Caso Educativo
        </h3>
        <div className="prose prose-sm max-w-none text-slate-700">
          <LatexRenderer text={activity.caseText} className="whitespace-pre-wrap" />
        </div>
      </div>

      {/* Preguntas */}
      {activity.questions.map((question, index) => {
        const answer = answers[question.id] || '';
        const wordCount = countWords(answer);
        const exceedsLimit = wordCount > question.wordLimit;
        const hasAnswer = answer.trim().length > 0;

        return (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
          >
            {/* Pregunta */}
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-base font-semibold text-slate-800 flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <LatexRenderer text={question.text} />
                  </div>
                </h4>
                {hasAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={answer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder={question.placeholder || 'Escribe tu respuesta aquí...'}
              disabled={isAlreadySubmitted}
              className={`w-full px-4 py-3 border rounded-lg h-40 resize-none text-base focus:outline-none focus:ring-2 transition-all ${
                isAlreadySubmitted
                  ? 'bg-slate-50 cursor-not-allowed'
                  : exceedsLimit
                  ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-transparent'
                  : 'border-slate-300 focus:ring-blue-500 focus:border-transparent'
              }`}
            />

            {/* Word counter */}
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`text-sm ${
                  exceedsLimit ? 'text-red-600 font-semibold' : 'text-slate-500'
                }`}
              >
                {wordCount} / {question.wordLimit} palabras
              </span>
              {exceedsLimit && (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Excede el límite
                </span>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Botones de acción */}
      {!isAlreadySubmitted && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {/* Guardar borrador */}
          <button
            type="button"
            onClick={() => handleSaveDraft(false)}
            disabled={isSavingDraft || isSubmitting}
            className="flex-1 sm:flex-initial px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Borrador
              </>
            )}
          </button>

          {/* Entregar */}
          <button
            type="submit"
            disabled={isSubmitting || progressPercentage < 100}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Evaluando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Entregar Actividad
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress bar durante el submit */}
      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between text-sm">
            <span
              className={`font-medium transition-colors duration-500 ${
                submitProgress === 100 ? 'text-green-600' : 'text-blue-600'
              }`}
            >
              {submitProgress < 100
                ? '🤖 Evaluando con IA...'
                : '✓ Evaluación completada!'}
            </span>
            <span
              className={`font-bold transition-colors duration-500 ${
                submitProgress === 100 ? 'text-green-600' : 'text-blue-600'
              }`}
            >
              {submitProgress}%
            </span>
          </div>

          <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                submitProgress === 100
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${submitProgress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}
    </form>
  );
}
