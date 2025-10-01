'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, Calendar, BookOpen, Award, ChevronDown, ChevronUp, TrendingUp, Search, Target, Lightbulb, Calendar as CalendarIcon } from 'lucide-react';
import type { Evaluation } from '@/types/evaluation';

interface EvaluationViewerProps {
  evaluation: Evaluation;
  onBack: () => void;
}

interface EvaluationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  color: string;
}

export default function EvaluationViewer({ evaluation, onBack }: EvaluationViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const parseSections = (feedback: string): EvaluationSection[] => {
    const sections: EvaluationSection[] = [];
    const seenIds = new Set<string>();
    let headerContent: string[] = []; // Acumular contenido de headers

    // Split by ## headers (nivel 2)
    const parts = feedback.split(/(?=^## )/m);

    for (let i = 0; i < parts.length; i++) {
      const trimmed = parts[i].trim();
      if (!trimmed) continue;

      const lowerContent = trimmed.toLowerCase();

      // Identificar tipo de sección por emojis o palabras clave
      let sectionData: EvaluationSection | null = null;

      if (trimmed.includes('📊') || lowerContent.includes('progreso histórico') || lowerContent.includes('historial')) {
        sectionData = {
          id: 'progress',
          title: 'Progreso Histórico',
          icon: <TrendingUp className="h-5 w-5" />,
          content: trimmed,
          color: 'border-blue-200 bg-blue-50'
        };
      } else if (trimmed.includes('🔍') || lowerContent.includes('análisis')) {
        sectionData = {
          id: 'analysis',
          title: 'Análisis del Examen',
          icon: <Search className="h-5 w-5" />,
          content: trimmed,
          color: 'border-purple-200 bg-purple-50'
        };
      } else if (trimmed.includes('🎯') || lowerContent.includes('validación')) {
        sectionData = {
          id: 'validation',
          title: 'Validación de Progreso',
          icon: <Target className="h-5 w-5" />,
          content: trimmed,
          color: 'border-green-200 bg-green-50'
        };
      } else if (trimmed.includes('💡') || lowerContent.includes('recomendaciones')) {
        sectionData = {
          id: 'recommendations',
          title: 'Recomendaciones Personalizadas',
          icon: <Lightbulb className="h-5 w-5" />,
          content: trimmed,
          color: 'border-yellow-200 bg-yellow-50'
        };
      } else if (trimmed.includes('📈') || lowerContent.includes('próximos pasos') || lowerContent.includes('mensaje final')) {
        sectionData = {
          id: 'next-steps',
          title: 'Próximos Pasos',
          icon: <CalendarIcon className="h-5 w-5" />,
          content: trimmed,
          color: 'border-teal-200 bg-teal-50'
        };
      } else if (trimmed.startsWith('#')) {
        // Acumular todo el contenido de header en un array
        headerContent.push(trimmed);
        continue; // No agregar todavía
      }

      // Solo agregar si no existe ya el ID (prevenir duplicados)
      if (sectionData && !seenIds.has(sectionData.id)) {
        seenIds.add(sectionData.id);
        sections.push(sectionData);
      }
    }

    // Agregar sección consolidada de header al inicio si existe contenido
    if (headerContent.length > 0) {
      sections.unshift({
        id: 'header',
        title: 'Información General',
        icon: <BookOpen className="h-5 w-5" />,
        content: headerContent.join('\n\n'),
        color: 'border-slate-200 bg-slate-50'
      });
    }

    return sections;
  };

  const sections = parseSections(evaluation.feedback);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver a Evaluaciones</span>
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {evaluation.subject} - {evaluation.examTopic}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(evaluation.examDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{evaluation.examTopic}</span>
              </div>
            </div>
          </div>

          {/* Score badge */}
          <div className="flex flex-col items-center bg-teal-50 rounded-lg px-6 py-3 border border-teal-200">
            <div className="flex items-center gap-1 text-teal-600 mb-1">
              <Award className="h-4 w-4" />
              <span className="text-xs font-medium">NOTA</span>
            </div>
            <span className="text-3xl font-bold text-teal-700">
              {evaluation.score}
            </span>
            <span className="text-sm text-teal-600">/100</span>
          </div>
        </div>

        {/* Instructor info */}
        {evaluation.instructorName && (
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Evaluado por:</span> {evaluation.instructorName}
              {evaluation.instructorEmail && ` (${evaluation.instructorEmail})`}
            </p>
          </div>
        )}
      </div>

      {/* Feedback sections as accordion */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);

          return (
            <div
              key={section.id}
              className={`bg-white rounded-xl shadow-sm border-2 ${section.color} overflow-hidden transition-all`}
            >
              {/* Section header - clickable */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-opacity-80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-slate-700">
                    {section.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {section.title}
                  </h2>
                </div>
                <div className="text-slate-500">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>

              {/* Section content - collapsible */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-200">
                  <div className="prose prose-slate max-w-none
                    prose-headings:text-slate-900
                    prose-h1:text-xl prose-h1:font-bold prose-h1:mb-3 prose-h1:mt-4
                    prose-h2:text-lg prose-h2:font-semibold prose-h2:mb-2 prose-h2:mt-3
                    prose-h3:text-base prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-3
                    prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-3
                    prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6
                    prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6
                    prose-li:text-slate-700 prose-li:mb-1
                    prose-strong:text-slate-900 prose-strong:font-semibold
                    prose-em:text-slate-800 prose-em:italic
                    prose-code:text-teal-700 prose-code:bg-teal-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
                    prose-pre:bg-slate-100 prose-pre:border prose-pre:border-slate-200 prose-pre:rounded-lg
                    prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600
                    prose-hr:border-slate-200 prose-hr:my-6
                    prose-table:border-collapse prose-table:w-full
                    prose-th:bg-slate-50 prose-th:border prose-th:border-slate-200 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
                    prose-td:border prose-td:border-slate-200 prose-td:px-4 prose-td:py-2
                    prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline
                  ">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer metadata */}
      <div className="mt-6 text-center text-sm text-slate-500">
        <p>Evaluación creada el {formatDate(evaluation.createdAt)}</p>
      </div>
    </div>
  );
}
