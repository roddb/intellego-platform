/**
 * Modal de creación de actividades CONSUDEC (Instructor)
 * Formulario para crear nuevas actividades con caso y preguntas
 */

'use client';

import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Save,
  Loader2,
  BookOpen,
  FileText,
} from 'lucide-react';
import type {
  ActivityQuestion,
  QuestionRubric,
  ActivityType,
  QuestionType,
} from '@/types/consudec-activity';
import { generateActivityId, generateQuestionId } from '@/lib/consudec-utils';

interface ActivityCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (activityId: string) => void;
}

export default function ActivityCreationModal({
  isOpen,
  onClose,
  onSuccess,
}: ActivityCreationModalProps) {
  // Estados del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [caseText, setCaseText] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('pedagogical');

  // Preguntas
  const [questions, setQuestions] = useState<ActivityQuestion[]>([
    createEmptyQuestion(1),
  ]);

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Crear pregunta vacía
  function createEmptyQuestion(index: number): ActivityQuestion {
    return {
      id: generateQuestionId(),
      text: `Pregunta ${index}`,
      placeholder: 'Escribe tu respuesta aquí...',
      wordLimit: 200,
      rubric: {
        excellent: 'Fundamentación teórica sólida, análisis profundo y crítico.',
        good: 'Fundamentación adecuada, análisis correcto.',
        satisfactory: 'Fundamentación básica, análisis superficial.',
        insufficient: 'Sin fundamentación teórica o análisis incorrecto.',
      },
      questionType: 'text',
    };
  }

  // Agregar pregunta
  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion(prev.length + 1)]);
  };

  // Eliminar pregunta
  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      setError('Debe haber al menos una pregunta');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Actualizar pregunta
  const updateQuestion = (
    index: number,
    field: keyof ActivityQuestion,
    value: string | number | QuestionRubric
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  // Actualizar rúbrica de pregunta
  const updateQuestionRubric = (
    index: number,
    level: keyof QuestionRubric,
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? { ...q, rubric: { ...q.rubric, [level]: value } }
          : q
      )
    );
  };

  // Validar formulario
  const validate = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!title.trim()) errors.push('El título es obligatorio');
    if (!description.trim()) errors.push('La descripción es obligatoria');
    if (!caseText.trim()) errors.push('El caso educativo es obligatorio');

    questions.forEach((q, i) => {
      if (!q.text.trim()) errors.push(`La pregunta ${i + 1} no tiene texto`);
      if (q.wordLimit < 50 || q.wordLimit > 500) {
        errors.push(`La pregunta ${i + 1} debe tener límite entre 50 y 500 palabras`);
      }
      // Validar que la rúbrica tenga todos los niveles
      if (!q.rubric.excellent.trim()) errors.push(`Pregunta ${i + 1}: falta nivel Excelente`);
      if (!q.rubric.good.trim()) errors.push(`Pregunta ${i + 1}: falta nivel Bueno`);
      if (!q.rubric.satisfactory.trim())
        errors.push(`Pregunta ${i + 1}: falta nivel Satisfactorio`);
      if (!q.rubric.insufficient.trim())
        errors.push(`Pregunta ${i + 1}: falta nivel Insuficiente`);

      // 🆕 Validar campos adicionales para preguntas de cálculo
      if (q.questionType === 'calculation') {
        if (!q.expectedFormula?.trim())
          errors.push(`Pregunta ${i + 1}: falta fórmula esperada (requerida para cálculos)`);
        if (q.correctAnswer === undefined || q.correctAnswer === null)
          errors.push(`Pregunta ${i + 1}: falta respuesta correcta (requerida para cálculos)`);
        if (!q.expectedUnit?.trim())
          errors.push(`Pregunta ${i + 1}: falta unidad esperada (requerida para cálculos)`);
        if (
          q.tolerancePercentage !== undefined &&
          (q.tolerancePercentage < 0 || q.tolerancePercentage > 50)
        ) {
          errors.push(`Pregunta ${i + 1}: tolerancia debe estar entre 0% y 50%`);
        }
      }
    });

    // Validar fechas si existen
    if (availableFrom && availableUntil) {
      if (new Date(availableFrom) >= new Date(availableUntil)) {
        errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }

    return { valid: errors.length === 0, errors };
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar
    const validation = validate();
    if (!validation.valid) {
      setError(validation.errors.join('. '));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/consudec/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          caseText,
          questions,
          subject: subject.trim() || undefined,
          difficulty,
          estimatedTime,
          availableFrom: availableFrom || undefined,
          availableUntil: availableUntil || undefined,
          activityType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear actividad');
      }

      const data = await response.json();

      setSuccessMessage('Actividad creada exitosamente');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(data.activityId);
        }
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido al crear actividad');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cerrar modal
  const handleClose = () => {
    if (!isSubmitting) {
      // Resetear formulario
      setTitle('');
      setDescription('');
      setCaseText('');
      setSubject('');
      setDifficulty('medium');
      setEstimatedTime(30);
      setAvailableFrom('');
      setAvailableUntil('');
      setActivityType('pedagogical');
      setQuestions([createEmptyQuestion(1)]);
      setError('');
      setSuccessMessage('');
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-white" />
                    <Dialog.Title className="text-xl font-bold text-white">
                      Crear Nueva Actividad CONSUDEC
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Mensajes */}
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

                  {/* Información general */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">Información General</h3>

                    {/* Título */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Caso 1 - Análisis Pedagógico"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Descripción *
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Breve descripción de la actividad"
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* 🆕 Tipo de Actividad */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tipo de Actividad *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setActivityType('pedagogical')}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            activityType === 'pedagogical'
                              ? 'border-blue-600 bg-blue-50 text-blue-800'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
                          }`}
                        >
                          <div className="font-semibold">📚 Caso Pedagógico</div>
                          <div className="text-xs mt-1">
                            Análisis de situaciones educativas (CONSUDEC)
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivityType('clinical')}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            activityType === 'clinical'
                              ? 'border-blue-600 bg-blue-50 text-blue-800'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
                          }`}
                        >
                          <div className="font-semibold">⚡ Caso Clínico</div>
                          <div className="text-xs mt-1">
                            Bioelectricidad con cálculos matemáticos
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Grid: Materia, Dificultad, Tiempo */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Materia (opcional)
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Ej: Pedagogía"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Dificultad
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="easy">Fácil</option>
                          <option value="medium">Intermedia</option>
                          <option value="hard">Difícil</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Tiempo (min)
                        </label>
                        <input
                          type="number"
                          value={estimatedTime}
                          onChange={(e) => setEstimatedTime(Number(e.target.value))}
                          min={10}
                          max={300}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Disponibilidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Disponible desde (opcional)
                        </label>
                        <input
                          type="datetime-local"
                          value={availableFrom}
                          onChange={(e) => setAvailableFrom(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Disponible hasta (opcional)
                        </label>
                        <input
                          type="datetime-local"
                          value={availableUntil}
                          onChange={(e) => setAvailableUntil(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Caso educativo */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-800">Caso Educativo *</h3>
                    <textarea
                      value={caseText}
                      onChange={(e) => setCaseText(e.target.value)}
                      placeholder="Describe el caso educativo que los estudiantes deben analizar..."
                      required
                      rows={8}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Preguntas */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">
                        Preguntas ({questions.length})
                      </h3>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Pregunta
                      </button>
                    </div>

                    {questions.map((q, index) => (
                      <QuestionEditor
                        key={q.id}
                        question={q}
                        index={index}
                        activityType={activityType}
                        onUpdate={(field, value) => updateQuestion(index, field, value)}
                        onUpdateRubric={(level, value) => updateQuestionRubric(index, level, value)}
                        onRemove={() => removeQuestion(index)}
                        canRemove={questions.length > 1}
                      />
                    ))}
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Crear Actividad
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

/**
 * Editor de pregunta individual
 */
interface QuestionEditorProps {
  question: ActivityQuestion;
  index: number;
  activityType: ActivityType;
  onUpdate: (field: keyof ActivityQuestion, value: string | number | QuestionType) => void;
  onUpdateRubric: (level: keyof QuestionRubric, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function QuestionEditor({
  question,
  index,
  activityType,
  onUpdate,
  onUpdateRubric,
  onRemove,
  canRemove,
}: QuestionEditorProps) {
  const [showRubric, setShowRubric] = useState(false);
  const [showCalculationFields, setShowCalculationFields] = useState(false);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Pregunta {index + 1}
        </h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
            title="Eliminar pregunta"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Texto de la pregunta */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Texto *</label>
        <input
          type="text"
          value={question.text}
          onChange={(e) => onUpdate('text', e.target.value)}
          placeholder={`Pregunta ${index + 1}`}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 🆕 Tipo de Pregunta (solo para casos clínicos) */}
      {activityType === 'clinical' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Pregunta *</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onUpdate('questionType', 'text')}
              className={`flex-1 px-4 py-2 text-sm rounded-lg border-2 transition-all ${
                question.questionType === 'text'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
              }`}
            >
              📝 Conceptual
            </button>
            <button
              type="button"
              onClick={() => onUpdate('questionType', 'calculation')}
              className={`flex-1 px-4 py-2 text-sm rounded-lg border-2 transition-all ${
                question.questionType === 'calculation'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
              }`}
            >
              🔢 Cálculo
            </button>
          </div>
        </div>
      )}

      {/* 🆕 Campos de Cálculo (solo si questionType === 'calculation') */}
      {activityType === 'clinical' && question.questionType === 'calculation' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-blue-800">Parámetros de Cálculo</h5>
            <button
              type="button"
              onClick={() => setShowCalculationFields(!showCalculationFields)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showCalculationFields ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showCalculationFields && (
            <div className="space-y-3">
              {/* Fórmula Esperada */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Fórmula Esperada * (ej: E_K = 61.5 * log10([K+]ext / [K+]int))
                </label>
                <input
                  type="text"
                  value={question.expectedFormula || ''}
                  onChange={(e) => onUpdate('expectedFormula', e.target.value)}
                  placeholder="Ecuación física relevante"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Grid: Respuesta Correcta y Unidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Respuesta Correcta *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={question.correctAnswer ?? ''}
                    onChange={(e) => onUpdate('correctAnswer', Number(e.target.value))}
                    placeholder="Ej: -70"
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Unidad * (ej: mV, mA, Ω)
                  </label>
                  <input
                    type="text"
                    value={question.expectedUnit || ''}
                    onChange={(e) => onUpdate('expectedUnit', e.target.value)}
                    placeholder="mV"
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tolerancia */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tolerancia (%) - Opcional (default 5%)
                </label>
                <input
                  type="number"
                  step="1"
                  min={0}
                  max={50}
                  value={question.tolerancePercentage ?? 5}
                  onChange={(e) => onUpdate('tolerancePercentage', Number(e.target.value))}
                  placeholder="5"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Margen de error aceptable para la respuesta numérica
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Placeholder y Word Limit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Placeholder</label>
          <input
            type="text"
            value={question.placeholder}
            onChange={(e) => onUpdate('placeholder', e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Límite de palabras *
          </label>
          <input
            type="number"
            value={question.wordLimit}
            onChange={(e) => onUpdate('wordLimit', Number(e.target.value))}
            min={50}
            max={500}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Rúbrica (colapsable) */}
      <div>
        <button
          type="button"
          onClick={() => setShowRubric(!showRubric)}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          {showRubric ? '▼' : '▶'} {showRubric ? 'Ocultar' : 'Mostrar'} Rúbrica
        </button>

        {showRubric && (
          <div className="mt-3 space-y-2">
            {(['excellent', 'good', 'satisfactory', 'insufficient'] as const).map((level) => (
              <div key={level}>
                <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">
                  {level === 'excellent'
                    ? 'Excelente (85-100)'
                    : level === 'good'
                    ? 'Bueno (70-84)'
                    : level === 'satisfactory'
                    ? 'Satisfactorio (50-69)'
                    : 'Insuficiente (0-49)'}
                </label>
                <input
                  type="text"
                  value={question.rubric[level]}
                  onChange={(e) => onUpdateRubric(level, e.target.value)}
                  placeholder={`Criterio para nivel ${level}`}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
