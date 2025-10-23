"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import ExamContextForm from "@/components/evaluation/ExamContextForm";
import FileUploadZone from "@/components/evaluation/FileUploadZone";
import MatchPreviewTable from "@/components/evaluation/MatchPreviewTable";

/**
 * Exam Correction Page
 *
 * Flujo:
 * 1. ExamContextForm - Seleccionar materia, división, tema, fecha
 * 2. FileUploadZone - Subir archivos .md
 * 3. MatchPreviewTable - Preview de matches con confirmación
 * 4. Procesamiento - Llamada al endpoint /api/instructor/evaluation/correct
 */

// Types
interface ExamContext {
  materia: "Física" | "Química";
  division: string;
  anioAcademico: string;
  sede: string;
  temaExamen: string;
  fechaExamen: string;
}

interface UploadedFile {
  file: File;
  name: string;
  size: number;
}

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

interface ProcessingResult {
  fileName: string;
  studentName: string;
  evaluationId: string;
  score: number;
  status: "success" | "error";
  duration: number;
  error?: {
    code: string;
    message: string;
  };
}

export default function ExamCorrectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [examContext, setExamContext] = useState<ExamContext | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [matchPreviews, setMatchPreviews] = useState<MatchPreview[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [processingResults, setProcessingResults] = useState<
    ProcessingResult[] | null
  >(null);

  // Auth check
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.role !== "INSTRUCTOR") {
      router.push("/dashboard/student");
      return;
    }
  }, [session, status, router]);

  // Load preview when reaching step 3
  useEffect(() => {
    if (currentStep === 3 && examContext && uploadedFiles.length > 0) {
      loadMatchPreview();
      loadAvailableStudents();
    }
  }, [currentStep]);

  const loadMatchPreview = async () => {
    if (!examContext) return;

    try {
      setIsLoadingPreview(true);
      setProcessingMessage("Buscando coincidencias...");

      const fileNames = uploadedFiles.map((f) => f.name);

      const response = await fetch("/api/instructor/evaluation/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: {
            materia: examContext.materia,
            division: examContext.division,
            anioAcademico: examContext.anioAcademico,
            sede: examContext.sede,
          },
          fileNames,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatchPreviews(data.matches || []);
        console.log("✅ Preview loaded:", data.summary);
      } else {
        console.error("Failed to load preview");
        alert("Error al cargar el preview de coincidencias");
      }
    } catch (error) {
      console.error("Error loading preview:", error);
      alert("Error al cargar el preview");
    } finally {
      setIsLoadingPreview(false);
      setProcessingMessage("");
    }
  };

  const loadAvailableStudents = async () => {
    if (!examContext) return;

    try {
      const response = await fetch(
        `/api/instructor/hierarchical?action=students&subject=${encodeURIComponent(
          examContext.materia
        )}&year=${encodeURIComponent(
          examContext.anioAcademico
        )}&course=${encodeURIComponent(examContext.division)}`
      );

      if (response.ok) {
        const result = await response.json();
        setAvailableStudents(result.data || []);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  const handleConfirmAndProcess = async (finalMatches: Map<string, string>) => {
    if (!examContext) return;

    try {
      setIsProcessing(true);
      setProcessingMessage("Preparando archivos para procesamiento...");

      // Create FormData
      const formData = new FormData();

      // Build subject with full format (e.g., "Física 4to E")
      // Extract year prefix from academicYear (e.g., "4to Año" -> "4to")
      const yearPrefix = examContext.anioAcademico.replace(" Año", "").trim();
      const fullSubject = `${examContext.materia} ${yearPrefix} ${examContext.division}`;

      // Add metadata
      formData.append(
        "metadata",
        JSON.stringify({
          subject: fullSubject,
          examTopic: examContext.temaExamen,
          examDate: examContext.fechaExamen,
        })
      );

      // Add only assigned files
      uploadedFiles.forEach((uploadedFile) => {
        if (finalMatches.has(uploadedFile.name)) {
          formData.append("files", uploadedFile.file);
        }
      });

      setProcessingMessage("Procesando exámenes con IA...");

      const response = await fetch("/api/instructor/evaluation/correct", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Processing completed:", data);
        setProcessingResults(data.results || []);
        setProcessingMessage("");
      } else {
        const errorData = await response.json();
        console.error("Processing failed:", errorData);
        alert(`Error: ${errorData.error || "Error al procesar exámenes"}`);
        setIsProcessing(false);
        setProcessingMessage("");
      }
    } catch (error) {
      console.error("Error processing exams:", error);
      alert("Error al procesar los exámenes");
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setExamContext(null);
    setUploadedFiles([]);
    setMatchPreviews([]);
    setAvailableStudents([]);
    setProcessingResults(null);
    setIsProcessing(false);
    setProcessingMessage("");
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Results view
  if (processingResults) {
    const successful = processingResults.filter((r) => r.status === "success")
      .length;
    const failed = processingResults.filter((r) => r.status === "error").length;
    const avgScore =
      successful > 0
        ? Math.round(
            processingResults
              .filter((r) => r.status === "success")
              .reduce((sum, r) => sum + r.score, 0) / successful
          )
        : 0;

    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
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
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Procesamiento Completado
              </h1>
              <p className="text-slate-600">
                Los exámenes han sido corregidos automáticamente
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600 font-medium mb-1">Total</p>
                <p className="text-3xl font-bold text-slate-900">
                  {processingResults.length}
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-1">
                  Exitosos
                </p>
                <p className="text-3xl font-bold text-green-900">{successful}</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600 font-medium mb-1">
                  Promedio
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {avgScore}/100
                </p>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                  Resultados Detallados
                </h2>

                <div className="space-y-3">
                  {processingResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.status === "success"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">
                            {result.fileName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {result.studentName}
                          </p>
                        </div>
                        {result.status === "success" ? (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-900">
                              {result.score}
                            </p>
                            <p className="text-xs text-green-600">
                              {(result.duration / 1000).toFixed(1)}s
                            </p>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-sm font-medium text-red-600">
                              Error
                            </p>
                            <p className="text-xs text-red-500">
                              {result.error?.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Corregir Más Exámenes
              </button>
              <button
                onClick={() => router.push("/dashboard/instructor")}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.push("/dashboard/instructor")}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-slate-800">
              Corrección Automática de Exámenes
            </h1>
          </div>
          <p className="text-slate-600">
            Sistema de evaluación con IA - Rúbrica 5-FASE
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 1
                    ? "bg-teal-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                1
              </div>
              <div className="ml-3">
                <p
                  className={`font-medium ${
                    currentStep >= 1 ? "text-teal-600" : "text-slate-500"
                  }`}
                >
                  Contexto del Examen
                </p>
              </div>
            </div>

            <div
              className={`flex-1 h-1 mx-4 ${
                currentStep >= 2 ? "bg-teal-600" : "bg-slate-200"
              }`}
            />

            {/* Step 2 */}
            <div className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 2
                    ? "bg-teal-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                2
              </div>
              <div className="ml-3">
                <p
                  className={`font-medium ${
                    currentStep >= 2 ? "text-teal-600" : "text-slate-500"
                  }`}
                >
                  Subir Exámenes
                </p>
              </div>
            </div>

            <div
              className={`flex-1 h-1 mx-4 ${
                currentStep >= 3 ? "bg-teal-600" : "bg-slate-200"
              }`}
            />

            {/* Step 3 */}
            <div className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 3
                    ? "bg-teal-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                3
              </div>
              <div className="ml-3">
                <p
                  className={`font-medium ${
                    currentStep >= 3 ? "text-teal-600" : "text-slate-500"
                  }`}
                >
                  Confirmar Matches
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Paso 1: Contexto del Examen
              </h2>
              <p className="text-slate-600 mb-6">
                Seleccione la materia, división y detalles del examen a corregir
              </p>

              <ExamContextForm
                initialContext={examContext}
                onSubmit={(context) => {
                  setExamContext(context);
                  setCurrentStep(2);
                }}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Paso 2: Subir Exámenes
              </h2>
              <p className="text-slate-600 mb-6">
                Arrastre y suelte los archivos .md de los exámenes transcritos
              </p>

              <FileUploadZone
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Paso 3: Confirmar Asignaciones
              </h2>
              <p className="text-slate-600 mb-6">
                Revise y confirme la asignación de cada examen al estudiante
                correcto
              </p>

              {isLoadingPreview ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Buscando coincidencias...</p>
                </div>
              ) : (
                <MatchPreviewTable
                  matches={matchPreviews}
                  availableStudents={availableStudents}
                  onConfirm={handleConfirmAndProcess}
                  onBack={() => setCurrentStep(2)}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          )}
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center max-w-md">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-slate-800 font-medium text-lg mb-2">
                Procesando exámenes con IA...
              </p>
              <p className="text-slate-600 text-sm">{processingMessage}</p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  Este proceso puede tomar varios minutos dependiendo de la
                  cantidad de exámenes
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
