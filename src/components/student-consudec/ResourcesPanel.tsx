'use client';

import { useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { BookOpen, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';

const RepasoExamen = dynamic(() => import('./RepasoExamen'), { ssr: false });

interface ResourcesPanelProps {
  userName?: string;
}

interface Resource {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  content: 'iframe' | 'component';
  iframeUrl?: string;
  component?: React.ComponentType;
}

export default function ResourcesPanel({ userName }: ResourcesPanelProps) {
  const [iframeError, setIframeError] = useState(false);

  const resources: Resource[] = [
    {
      id: 'exam-review',
      title: 'Repaso examen',
      icon: BookOpen,
      description: 'Material interactivo para preparación de exámenes',
      content: 'component',
      component: RepasoExamen,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-gray-100">
          Recursos Educativos
        </h2>
        <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
          Accede a materiales de apoyo para tu aprendizaje
        </p>
      </div>

      {/* Resources List */}
      <div className="grid gap-4">
        {resources.map((resource) => (
          <Disclosure key={resource.id} defaultOpen>
            {({ open }) => (
              <div className="border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
                <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <resource.icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                      {resource.title}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-600 dark:text-gray-400 transition-transform duration-200 ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </DisclosureButton>

                <DisclosurePanel className="origin-top transition duration-200 ease-out data-[closed]:-translate-y-2 data-[closed]:opacity-0">
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      {resource.description}
                    </p>

                    {resource.content === 'component' && resource.component && (
                      <div className="relative w-full">
                        <resource.component />
                      </div>
                    )}

                    {resource.content === 'iframe' && resource.iframeUrl && (
                      <div className="relative w-full">
                        {iframeError ? (
                          <div className="w-full h-[600px] rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 flex flex-col items-center justify-center p-8 text-center">
                            <div className="text-amber-600 dark:text-amber-400 mb-4">
                              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">
                              No se pudo cargar el recurso
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                              El contenido externo no está disponible o no permite ser embebido.
                            </p>
                            <a
                              href={resource.iframeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              Abrir en nueva pestaña →
                            </a>
                          </div>
                        ) : (
                          <iframe
                            src={resource.iframeUrl}
                            title={resource.title}
                            className="w-full h-[600px] rounded-lg border border-slate-200 dark:border-gray-600"
                            frameBorder="0"
                            allow="clipboard-write"
                            allowFullScreen
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                            loading="lazy"
                            onError={() => setIframeError(true)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  );
}
