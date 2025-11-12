/**
 * Componente para renderizar texto con fórmulas LaTeX usando KaTeX
 *
 * Soporta dos sintaxis:
 * - Inline math: $E = mc^2$ o \(E = mc^2\)
 * - Display math: $$E = mc^2$$ o \[E = mc^2\]
 *
 * Uso:
 * <LatexRenderer text="El potencial de Nernst es $E_K = 61.5 \log_{10}([\text{K}^+]_{ext} / [\text{K}^+]_{int})$ en mV" />
 */

'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  text: string;
  className?: string;
  displayMode?: boolean; // Forzar modo display para todo el texto
}

export default function LatexRenderer({
  text,
  className = '',
  displayMode = false,
}: LatexRendererProps) {
  const renderedContent = useMemo(() => {
    if (!text) return null;

    try {
      // Si displayMode está activado, renderizar todo como display math
      if (displayMode) {
        const html = katex.renderToString(text, {
          displayMode: true,
          throwOnError: false,
          output: 'html',
        });
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
      }

      // Detectar y renderizar fórmulas inline y display
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;

      // Regex para capturar fórmulas:
      // - Display math: $$...$$ o \[...\]
      // - Inline math: $...$ o \(...\)
      const mathRegex = /\$\$([^\$]+)\$\$|\\\[([^\]]+)\\\]|\$([^\$]+)\$|\\\(([^\)]+)\\\)/g;

      let match;
      let key = 0;

      while ((match = mathRegex.exec(text)) !== null) {
        // Agregar texto antes de la fórmula (con soporte HTML)
        if (match.index > lastIndex) {
          const textSegment = text.slice(lastIndex, match.index);
          parts.push(
            <span
              key={`text-${key++}`}
              dangerouslySetInnerHTML={{ __html: textSegment }}
            />
          );
        }

        // Determinar si es display o inline
        const isDisplay = match[1] !== undefined || match[2] !== undefined;
        const formula = match[1] || match[2] || match[3] || match[4];

        try {
          const html = katex.renderToString(formula, {
            displayMode: isDisplay,
            throwOnError: false,
            output: 'html',
          });

          parts.push(
            <span
              key={`math-${key++}`}
              dangerouslySetInnerHTML={{ __html: html }}
              className={isDisplay ? 'block my-2' : 'inline-block mx-1'}
            />
          );
        } catch (err) {
          // Si falla, mostrar texto original
          console.error('KaTeX render error:', err);
          parts.push(match[0]);
        }

        lastIndex = match.index + match[0].length;
      }

      // Agregar texto restante (con soporte HTML)
      if (lastIndex < text.length) {
        const finalSegment = text.slice(lastIndex);
        parts.push(
          <span
            key={`text-final-${key++}`}
            dangerouslySetInnerHTML={{ __html: finalSegment }}
          />
        );
      }

      return parts.length > 0 ? parts : text;
    } catch (error) {
      console.error('Error rendering LaTeX:', error);
      return text;
    }
  }, [text, displayMode]);

  return <div className={`latex-content ${className}`}>{renderedContent}</div>;
}

/**
 * Componente simplificado para inline math solamente
 */
export function InlineLatex({ formula, className = '' }: { formula: string; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode: false,
        throwOnError: false,
        output: 'html',
      });
    } catch (error) {
      console.error('KaTeX inline render error:', error);
      return formula;
    }
  }, [formula]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Componente simplificado para display math (centrado, bloque)
 */
export function DisplayLatex({ formula, className = '' }: { formula: string; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      });
    } catch (error) {
      console.error('KaTeX display render error:', error);
      return formula;
    }
  }, [formula]);

  return <div className={`my-4 ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
