"use client";

import { useState, useEffect } from "react";
import type { Rubric } from "@/lib/evaluation/types";

interface ExamContext {
  materia: "Física" | "Química";
  division: string;
  anioAcademico: string;
  sede: string;
  temaExamen: string;
  fechaExamen: string;
  rubricId: string;
}

interface ExamContextFormProps {
  onSubmit: (context: ExamContext) => void;
  initialContext?: ExamContext | null;
}

interface NavigationData {
  [subject: string]: {
    [year: string]: string[]; // array of divisions
  };
}

export default function ExamContextForm({
  onSubmit,
  initialContext,
}: ExamContextFormProps) {
  // Form state
  const [materia, setMateria] = useState<"Física" | "Química" | "">(
    initialContext?.materia || ""
  );
  const [division, setDivision] = useState(initialContext?.division || "");
  const [anioAcademico, setAnioAcademico] = useState(
    initialContext?.anioAcademico || ""
  );
  const [sede, setSede] = useState(initialContext?.sede || "");
  const [temaExamen, setTemaExamen] = useState(initialContext?.temaExamen || "");
  const [fechaExamen, setFechaExamen] = useState(
    initialContext?.fechaExamen || ""
  );
  const [rubricId, setRubricId] = useState(initialContext?.rubricId || "");

  // Available options from API
  const [navigationData, setNavigationData] = useState<NavigationData>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [availableSedes, setAvailableSedes] = useState<string[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [isLoadingRubrics, setIsLoadingRubrics] = useState(true);

  // Load navigation data (subjects, years, divisions)
  useEffect(() => {
    fetchNavigationData();
    fetchRubrics();
  }, []);

  const fetchNavigationData = async () => {
    try {
      setIsLoadingData(true);
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
      setIsLoadingData(false);
    }
  };

  const fetchRubrics = async () => {
    try {
      setIsLoadingRubrics(true);
      const response = await fetch("/api/instructor/rubric");

      if (response.ok) {
        const result = await response.json();
        setRubrics(result.rubrics || []);
      } else {
        console.error("Failed to fetch rubrics");
      }
    } catch (error) {
      console.error("Error fetching rubrics:", error);
    } finally {
      setIsLoadingRubrics(false);
    }
  };

  // Load available sedes when materia + year + division are selected
  useEffect(() => {
    if (materia && anioAcademico && division) {
      fetchAvailableSedes();
    } else {
      setAvailableSedes([]);
    }
  }, [materia, anioAcademico, division]);

  const fetchAvailableSedes = async () => {
    try {
      const response = await fetch(
        `/api/instructor/hierarchical?action=students&subject=${encodeURIComponent(
          materia
        )}&year=${encodeURIComponent(anioAcademico)}&course=${encodeURIComponent(
          division
        )}`
      );

      if (response.ok) {
        const result = await response.json();
        const students = result.data || [];

        // Extract unique sedes
        const uniqueSedes = Array.from(
          new Set(students.map((s: any) => s.sede).filter(Boolean))
        ) as string[];

        setAvailableSedes(uniqueSedes);

        // Auto-select if only one sede
        if (uniqueSedes.length === 1) {
          setSede(uniqueSedes[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching sedes:", error);
    }
  };

  // Derived options
  const availableSubjects = Object.keys(navigationData);
  const availableYears = materia ? Object.keys(navigationData[materia] || {}) : [];
  const availableDivisions =
    materia && anioAcademico
      ? navigationData[materia]?.[anioAcademico] || []
      : [];

  // Validation
  const isFormValid =
    materia &&
    division &&
    anioAcademico &&
    sede &&
    temaExamen.trim() &&
    fechaExamen &&
    rubricId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    onSubmit({
      materia: materia as "Física" | "Química",
      division,
      anioAcademico,
      sede,
      temaExamen: temaExamen.trim(),
      fechaExamen,
      rubricId,
    });
  };

  if (isLoadingData) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Cargando opciones...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Materia */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Materia <span className="text-red-500">*</span>
        </label>
        <select
          value={materia}
          onChange={(e) => {
            setMateria(e.target.value as "Física" | "Química" | "");
            setAnioAcademico("");
            setDivision("");
            setSede("");
          }}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          required
        >
          <option value="">Seleccione una materia</option>
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
          Año Académico <span className="text-red-500">*</span>
        </label>
        <select
          value={anioAcademico}
          onChange={(e) => {
            setAnioAcademico(e.target.value);
            setDivision("");
            setSede("");
          }}
          disabled={!materia}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
          required
        >
          <option value="">Seleccione un año</option>
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
          División <span className="text-red-500">*</span>
        </label>
        <select
          value={division}
          onChange={(e) => {
            setDivision(e.target.value);
            setSede("");
          }}
          disabled={!materia || !anioAcademico}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
          required
        >
          <option value="">Seleccione una división</option>
          {availableDivisions.map((div) => (
            <option key={div} value={div}>
              {div}
            </option>
          ))}
        </select>
      </div>

      {/* Sede */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Sede <span className="text-red-500">*</span>
        </label>
        <select
          value={sede}
          onChange={(e) => setSede(e.target.value)}
          disabled={!materia || !anioAcademico || !division || availableSedes.length === 0}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
          required
        >
          <option value="">
            {availableSedes.length === 0
              ? "Cargando sedes..."
              : "Seleccione una sede"}
          </option>
          {availableSedes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Tema del Examen */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Tema del Examen <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={temaExamen}
          onChange={(e) => setTemaExamen(e.target.value)}
          placeholder="Ej: Tiro Oblicuo, Electroquímica, Termodinámica"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          required
        />
      </div>

      {/* Fecha del Examen */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Fecha del Examen <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={fechaExamen}
          onChange={(e) => setFechaExamen(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          required
        />
      </div>

      {/* Rúbrica */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Rúbrica <span className="text-red-500">*</span>
        </label>
        <select
          value={rubricId}
          onChange={(e) => setRubricId(e.target.value)}
          disabled={isLoadingRubrics}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
          required
        >
          <option value="">
            {isLoadingRubrics ? "Cargando rúbricas..." : "Seleccione una rúbrica"}
          </option>
          {rubrics.map((rubric) => (
            <option key={rubric.id} value={rubric.id}>
              {rubric.name}
            </option>
          ))}
        </select>
        {rubricId && rubrics.find((r) => r.id === rubricId)?.description && (
          <p className="mt-2 text-sm text-slate-600">
            {rubrics.find((r) => r.id === rubricId)?.description}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continuar al Paso 2
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                El sistema solo buscará estudiantes en la división y materia
                seleccionada
              </li>
              <li>
                Esto asegura que los exámenes se asignen correctamente
              </li>
              <li>
                Los archivos .md deben estar nombrados con el apellido del
                estudiante (ej: Garcia_Juan.md)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
