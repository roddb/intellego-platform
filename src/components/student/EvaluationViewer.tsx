'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, Calendar, BookOpen, Award } from 'lucide-react';
import type { Evaluation } from '@/types/evaluation';

interface EvaluationViewerProps {
  evaluation: Evaluation;
  onBack: () => void;
}

export default function EvaluationViewer({ evaluation, onBack }: EvaluationViewerProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

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

      {/* Feedback content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="prose prose-slate max-w-none
          prose-headings:text-slate-900
          prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-6 prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-2
          prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-5
          prose-h3:text-lg prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-4
          prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
          prose-ul:my-3 prose-ul:list-disc prose-ul:pl-6
          prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-6
          prose-li:text-slate-700 prose-li:mb-1
          prose-strong:text-slate-900 prose-strong:font-semibold
          prose-em:text-slate-800 prose-em:italic
          prose-code:text-teal-700 prose-code:bg-teal-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
          prose-pre:bg-slate-100 prose-pre:border prose-pre:border-slate-200 prose-pre:rounded-lg
          prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600
          prose-hr:border-slate-200 prose-hr:my-8
          prose-table:border-collapse prose-table:w-full
          prose-th:bg-slate-50 prose-th:border prose-th:border-slate-200 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
          prose-td:border prose-td:border-slate-200 prose-td:px-4 prose-td:py-2
          prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline
        ">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {evaluation.feedback}
          </ReactMarkdown>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="mt-6 text-center text-sm text-slate-500">
        <p>Evaluación creada el {formatDate(evaluation.createdAt)}</p>
      </div>
    </div>
  );
}
