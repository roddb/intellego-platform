'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Home, FlaskConical, Activity, Zap, BookOpen, Calculator, Lightbulb, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, BarChart, Bar } from 'recharts';

const RepasoExamen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Datos para gráfico de potencial de acción
  const potencialData = [
    { tiempo: 0, normal: -70, alterado: -50 },
    { tiempo: 1, normal: -70, alterado: -50 },
    { tiempo: 2, normal: 20, alterado: -10 },
    { tiempo: 3, normal: -75, alterado: -52 },
    { tiempo: 4, normal: -70, alterado: -50 },
  ];

  // Datos para velocidad de conducción
  const velocidadData = [
    { fibra: 'Aα', velocidad: 90 },
    { fibra: 'Aβ', velocidad: 50 },
    { fibra: 'C normal', velocidad: 1.5 },
    { fibra: 'C diabética', velocidad: 0.5 },
  ];

  const slides = [
    // PORTADA
    {
      type: 'portada',
      content: (
        <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white p-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <FlaskConical className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-6xl font-bold mb-4">Clase de Repaso</h1>
            <h2 className="text-3xl mb-8">Bioelectricidad</h2>
            <div className="space-y-4 text-xl">
              <p>📚 Profesorado Superior en Física - 4to Año</p>
              <p>🎯 Preparación para el Examen Final</p>
              <p>⏱️ Duración: 40 minutos</p>
            </div>
          </motion.div>
        </div>
      )
    },

    // VISTA GENERAL
    {
      type: 'general',
      content: (
        <div className="h-full bg-gradient-to-br from-gray-900 to-gray-800 text-white p-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-bold mb-8 text-center">Casos a Revisar</h2>
            <div className="grid grid-cols-3 gap-8 mt-12">
              {[
                { num: 1, titulo: 'El Paciente en Diálisis', tema: 'Nernst + Excitabilidad', icon: Calculator, color: 'from-blue-500 to-cyan-500' },
                { num: 2, titulo: 'Neuropatía Diabética', tema: 'Conducción Nerviosa', icon: Activity, color: 'from-purple-500 to-pink-500' },
                { num: 3, titulo: 'Intoxicación Alimentaria', tema: 'Transmisión Sináptica', icon: Zap, color: 'from-orange-500 to-red-500' }
              ].map((caso, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.2 }}
                  className={`bg-gradient-to-br ${caso.color} p-8 rounded-2xl shadow-2xl`}
                >
                  <div className="flex items-center justify-center mb-4">
                    <caso.icon className="w-16 h-16" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-center">Caso {caso.num}</h3>
                  <p className="text-lg text-center mb-3">{caso.titulo}</p>
                  <p className="text-sm text-center opacity-90">📖 {caso.tema}</p>
                  <p className="text-xs text-center mt-4 opacity-75">~12 minutos</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )
    },

    // CASO 1: PRESENTACIÓN
    {
      type: 'caso1',
      content: (
        <div className="h-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white p-12">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-white/20 p-4 rounded-xl">
                <Calculator className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl opacity-75">Caso 1</h3>
                <h2 className="text-5xl font-bold">El Paciente en Diálisis</h2>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur p-8 rounded-xl space-y-6">
              <p className="text-2xl leading-relaxed">
                Un paciente con insuficiencia renal crónica asiste a diálisis. Durante el procedimiento,
                se observa que sus niveles de <span className="font-bold text-yellow-300">Mg²⁺</span> plasmático
                aumentaron de <span className="font-bold">1 mM</span> a <span className="font-bold">5 mM</span>.
              </p>
              <p className="text-xl opacity-90">
                El paciente comienza a presentar debilidad muscular y alteraciones en el ritmo cardíaco.
              </p>
            </div>

            <div className="bg-yellow-400 text-gray-900 p-6 rounded-xl">
              <p className="text-xl font-semibold">
                🤔 Pregunta clave: ¿Cómo afecta este cambio en [Mg²⁺] la excitabilidad de sus neuronas y células musculares?
              </p>
            </div>
          </motion.div>
        </div>
      )
    },

    // CASO 1: DATOS
    {
      type: 'caso1',
      content: (
        <div className="h-full bg-gradient-to-br from-cyan-700 to-blue-700 text-white p-12">
          <h2 className="text-4xl font-bold mb-8 text-center">📊 Datos del Caso</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-cyan-300">Condiciones Iniciales</h3>
              <ul className="space-y-3 text-lg">
                <li>• [Mg²⁺]<sub>ext</sub> = 1 mM</li>
                <li>• [Mg²⁺]<sub>int</sub> = 0.5 mM (constante)</li>
                <li>• Temperatura: 37°C (310 K)</li>
                <li>• Potencial de reposo: -70 mV</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-pink-300">Después de Diálisis</h3>
              <ul className="space-y-3 text-lg">
                <li>• [Mg²⁺]<sub>ext</sub> = 5 mM ⬆️</li>
                <li>• [Mg²⁺]<sub>int</sub> = 0.5 mM (constante)</li>
                <li>• Temperatura: 37°C (310 K)</li>
                <li>• Potencial de reposo: ??? 🤔</li>
              </ul>
            </div>

            <div className="col-span-2 bg-yellow-400 text-gray-900 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3">🧮 Constantes Físicas</h3>
              <div className="grid grid-cols-3 gap-4 text-lg">
                <div>R = 8.314 J/(mol·K)</div>
                <div>T = 310 K</div>
                <div>F = 96485 C/mol</div>
                <div>z = +2 (Mg²⁺)</div>
                <div>RT/F = 26.7 mV</div>
                <div>(RT/F)/z = 13.35 mV</div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // CASO 1: ANÁLISIS
    {
      type: 'caso1',
      content: (
        <div className="h-full bg-gradient-to-br from-blue-800 to-purple-800 text-white p-12">
          <h2 className="text-4xl font-bold mb-8 text-center">🔍 Análisis Conceptual</h2>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Lightbulb className="w-8 h-8 text-yellow-300" />
                Ecuación de Nernst para Mg²⁺
              </h3>
              <div className="bg-gray-900 p-4 rounded text-center text-2xl font-mono">
                E<sub>Mg</sub> = (RT/zF) × ln([Mg²⁺]<sub>ext</sub> / [Mg²⁺]<sub>int</sub>)
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3">📝 Razonamiento</h3>
              <ol className="space-y-4 text-lg">
                <li className="flex gap-3">
                  <span className="font-bold text-cyan-300">1.</span>
                  <span>Al aumentar [Mg²⁺]<sub>ext</sub> de 1 mM a 5 mM, el cociente [Mg²⁺]<sub>ext</sub>/[Mg²⁺]<sub>int</sub> aumenta.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-cyan-300">2.</span>
                  <span>Como ln(x) es creciente, ln(10) &gt; ln(2), entonces E<sub>Mg</sub> se hace más positivo.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-cyan-300">3.</span>
                  <span>Un E<sub>Mg</sub> más positivo <span className="text-yellow-300 font-bold">despolariza</span> la membrana (el interior se vuelve menos negativo).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-cyan-300">4.</span>
                  <span>Despolarización → Membrana más cerca del umbral → <span className="text-red-300 font-bold">Mayor excitabilidad</span></span>
                </li>
              </ol>
            </div>

            <div className="bg-red-500 text-white p-6 rounded-xl">
              <p className="text-xl font-bold text-center">
                ⚠️ Paradoja clínica: Los síntomas del paciente indican MENOR excitabilidad. ¿Por qué?
              </p>
            </div>
          </div>
        </div>
      )
    },

    // CASO 1: RESOLUCIÓN MATEMÁTICA
    {
      type: 'caso1',
      content: (
        <div className="h-full bg-gradient-to-br from-purple-900 to-blue-900 text-white p-12">
          <h2 className="text-4xl font-bold mb-6 text-center">🧮 Cálculo Numérico</h2>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-green-300">Estado Inicial</h3>
              <div className="space-y-3 text-lg font-mono">
                <p>E<sub>Mg(inicial)</sub> = 13.35 × ln(1/0.5)</p>
                <p>E<sub>Mg(inicial)</sub> = 13.35 × ln(2)</p>
                <p>E<sub>Mg(inicial)</sub> = 13.35 × 0.693</p>
                <p className="text-2xl font-bold text-green-400">E<sub>Mg(inicial)</sub> ≈ +9.3 mV</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-pink-300">Después de Diálisis</h3>
              <div className="space-y-3 text-lg font-mono">
                <p>E<sub>Mg(final)</sub> = 13.35 × ln(5/0.5)</p>
                <p>E<sub>Mg(final)</sub> = 13.35 × ln(10)</p>
                <p>E<sub>Mg(final)</sub> = 13.35 × 2.303</p>
                <p className="text-2xl font-bold text-pink-400">E<sub>Mg(final)</sub> ≈ +30.7 mV</p>
              </div>
            </div>

            <div className="col-span-2 bg-gradient-to-r from-green-500 to-pink-500 p-6 rounded-xl text-center">
              <p className="text-3xl font-bold mb-2">ΔE<sub>Mg</sub> = +30.7 - (+9.3) = +21.4 mV</p>
              <p className="text-xl">📈 El potencial de equilibrio del Mg²⁺ aumentó +21.4 mV</p>
            </div>

            <div className="col-span-2 bg-yellow-400 text-gray-900 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3 text-center">🎯 Interpretación</h3>
              <p className="text-lg text-center">
                Si E<sub>Mg</sub> sube de +9.3 mV a +30.7 mV, y el potencial de reposo tiende a acercarse
                a los potenciales de equilibrio de los iones permeables, entonces <span className="font-bold">la membrana se despolariza</span>.
              </p>
            </div>
          </div>
        </div>
      )
    },

    // CASO 1: JUSTIFICACIÓN
    {
      type: 'caso1',
      content: (
        <div className="h-full bg-gradient-to-br from-blue-900 to-cyan-900 text-white p-12">
          <h2 className="text-4xl font-bold mb-6 text-center">✅ Resolución del Caso</h2>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                Efecto Teórico (Nernst)
              </h3>
              <p className="text-lg">
                El aumento de [Mg²⁺]<sub>ext</sub> hace que E<sub>Mg</sub> se vuelva más positivo (+21.4 mV),
                lo que teóricamente <span className="text-green-300 font-bold">aumentaría la excitabilidad</span> al despolarizar la membrana.
              </p>
            </div>

            <div className="bg-red-500/20 border-2 border-red-400 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-8 h-8 text-red-400" />
                Efecto Clínico Real
              </h3>
              <p className="text-lg mb-3">
                Sin embargo, el Mg²⁺ extracelular <span className="font-bold text-red-300">bloquea canales de Ca²⁺</span> tipo N y tipo L en la membrana.
              </p>
              <ul className="space-y-2 text-lg">
                <li>• Menos entrada de Ca²⁺ → Menor despolarización</li>
                <li>• Disminución de liberación de neurotransmisores</li>
                <li>• <span className="font-bold text-red-300">Reducción neta de la excitabilidad</span></li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3 text-center">💡 Concepto Clave</h3>
              <p className="text-xl text-center">
                La ecuación de Nernst predice el potencial de equilibrio, pero
                <span className="font-bold"> no considera efectos farmacológicos o de bloqueo</span> de canales iónicos.
              </p>
            </div>

            <div className="bg-yellow-400 text-gray-900 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3 text-center">🎓 Para el Examen</h3>
              <ol className="space-y-2 text-lg">
                <li>1. Calcula E<sub>ion</sub> con Nernst</li>
                <li>2. Compara con V<sub>reposo</sub> para predecir despolarización/hiperpolarización</li>
                <li>3. Considera efectos adicionales (bloqueo de canales, permeabilidad)</li>
                <li>4. Integra ambos para explicar el efecto neto</li>
              </ol>
            </div>
          </div>
        </div>
      )
    },

    // CASO 2: PRESENTACIÓN
    {
      type: 'caso2',
      content: (
        <div className="h-full bg-gradient-to-br from-purple-600 to-pink-600 text-white p-12">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-white/20 p-4 rounded-xl">
                <Activity className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl opacity-75">Caso 2</h3>
                <h2 className="text-5xl font-bold">Neuropatía Diabética</h2>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur p-8 rounded-xl space-y-6">
              <p className="text-2xl leading-relaxed">
                Una paciente diabética de larga data presenta <span className="font-bold text-yellow-300">pérdida de sensibilidad</span> en
                los pies y <span className="font-bold text-yellow-300">dolor neuropático</span>.
              </p>
              <p className="text-xl opacity-90">
                Un estudio neurofisiológico revela que la velocidad de conducción en sus fibras nerviosas tipo C
                (fibras amielínicas de dolor) está significativamente reducida.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-blue-500 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-2">Fibra C Normal</h3>
                <p className="text-3xl font-bold">1.5 m/s</p>
              </div>
              <div className="bg-red-500 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-2">Fibra C Diabética</h3>
                <p className="text-3xl font-bold">0.5 m/s</p>
              </div>
            </div>

            <div className="bg-yellow-400 text-gray-900 p-6 rounded-xl">
              <p className="text-xl font-semibold">
                🤔 Pregunta clave: ¿Por qué la diabetes afecta la velocidad de conducción nerviosa?
                ¿Qué mecanismos biofísicos están involucrados?
              </p>
            </div>
          </motion.div>
        </div>
      )
    },

    // CASO 2: DATOS Y FUNDAMENTOS
    {
      type: 'caso2',
      content: (
        <div className="h-full bg-gradient-to-br from-pink-700 to-purple-700 text-white p-12">
          <h2 className="text-4xl font-bold mb-8 text-center">📊 Fundamentos de Conducción</h2>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-cyan-300">Ecuación de Velocidad de Conducción</h3>
              <div className="bg-gray-900 p-4 rounded text-center space-y-2">
                <p className="text-2xl font-mono">v = √(d/4Rᵢ Rₘ Cₘ)</p>
                <p className="text-sm opacity-75">Para fibras amielínicas</p>
                <p className="text-xl font-mono mt-4">v ∝ √d</p>
                <p className="text-sm opacity-75">Velocidad proporcional a raíz cuadrada del diámetro</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
                <h3 className="text-2xl font-bold mb-3 text-green-300">Factores que Aumentan v</h3>
                <ul className="space-y-2 text-lg">
                  <li>✓ Mayor diámetro (d ↑)</li>
                  <li>✓ Menor resistencia interna (Rᵢ ↓)</li>
                  <li>✓ Mayor resistencia de membrana (Rₘ ↑)</li>
                  <li>✓ Menor capacitancia (Cₘ ↓)</li>
                  <li>✓ Mielinización</li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
                <h3 className="text-2xl font-bold mb-3 text-red-300">Factores que Reducen v</h3>
                <ul className="space-y-2 text-lg">
                  <li>✗ Menor diámetro (d ↓)</li>
                  <li>✗ Mayor resistencia interna (Rᵢ ↑)</li>
                  <li>✗ Menor resistencia de membrana (Rₘ ↓)</li>
                  <li>✗ Mayor capacitancia (Cₘ ↑)</li>
                  <li>✗ Desmielinización</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-400 text-gray-900 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">🔬 Datos Típicos</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="font-bold">Fibras Aα</p>
                  <p>13-20 μm, 80-120 m/s</p>
                  <p className="text-sm opacity-75">Mielínicas gruesas</p>
                </div>
                <div>
                  <p className="font-bold">Fibras Aβ</p>
                  <p>6-12 μm, 35-75 m/s</p>
                  <p className="text-sm opacity-75">Mielínicas medianas</p>
                </div>
                <div>
                  <p className="font-bold">Fibras C</p>
                  <p>0.2-1.5 μm, 0.5-2 m/s</p>
                  <p className="text-sm opacity-75">Amielínicas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // CASO 2: MECANISMOS
    {
      type: 'caso2',
      content: (
        <div className="h-full bg-gradient-to-br from-purple-800 to-indigo-800 text-white p-12">
          <h2 className="text-4xl font-bold mb-8 text-center">🔍 Mecanismos Fisiopatológicos</h2>

          <div className="space-y-6">
            <div className="bg-red-500/20 border-2 border-red-400 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-8 h-8 text-red-400" />
                Efectos de la Hiperglucemia Crónica
              </h3>
              <div className="grid grid-cols-2 gap-4 text-lg">
                <div>
                  <p className="font-bold text-red-300 mb-2">1. Desmielinización</p>
                  <ul className="space-y-1 text-base">
                    <li>• Pérdida de células de Schwann</li>
                    <li>• Disminución de Rₘ (resistencia membrana)</li>
                    <li>• Aumento de Cₘ (capacitancia)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-red-300 mb-2">2. Atrofia Axonal</p>
                  <ul className="space-y-1 text-base">
                    <li>• Reducción del diámetro (d ↓)</li>
                    <li>• Aumento de Rᵢ (resistencia interna)</li>
                    <li>• Menor densidad de canales Na⁺</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-red-300 mb-2">3. Microangiopatía</p>
                  <ul className="space-y-1 text-base">
                    <li>• Isquemia del nervio periférico</li>
                    <li>• Reducción de ATP</li>
                    <li>• Fallo de bomba Na⁺/K⁺</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-red-300 mb-2">4. Productos Glicosilados (AGE)</p>
                  <ul className="space-y-1 text-base">
                    <li>• Daño estructural de proteínas</li>
                    <li>• Alteración de canales iónicos</li>
                    <li>• Inflamación crónica</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-yellow-300">📉 Impacto en la Ecuación de Velocidad</h3>
              <div className="bg-gray-900 p-6 rounded space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xl">v = √(d/4Rᵢ Rₘ Cₘ)</p>
                </div>
                <div className="space-y-2 text-lg">
                  <p>• d ↓ (atrofia axonal) → numerador disminuye</p>
                  <p>• Rᵢ ↑ (axón más delgado) → denominador aumenta</p>
                  <p>• Rₘ ↓ (desmielinización) → denominador disminuye (contraefecto)</p>
                  <p>• Cₘ ↑ (pérdida de mielina) → denominador aumenta</p>
                </div>
                <div className="bg-red-500 p-4 rounded text-center text-2xl font-bold mt-4">
                  Resultado neto: v ↓↓↓ (velocidad muy reducida)
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // CASO 2: GRÁFICO
    {
      type: 'caso2',
      content: (
        <div className="h-full bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-12">
          <h2 className="text-4xl font-bold mb-8 text-center">📊 Comparación de Velocidades</h2>

          <div className="bg-white/10 backdrop-blur p-8 rounded-xl">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={velocidadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="fibra" stroke="#fff" />
                <YAxis stroke="#fff" label={{ value: 'Velocidad (m/s)', angle: -90, position: 'insideLeft', fill: '#fff' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="velocidad" fill="#8b5cf6">
                  {velocidadData.map((entry, index) => (
                    <cell key={`cell-${index}`} fill={entry.fibra.includes('diabética') ? '#ef4444' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="bg-blue-500/20 border border-blue-400 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3">Fibra C Normal</h3>
              <ul className="space-y-2 text-lg">
                <li>• Velocidad: 1.5 m/s</li>
                <li>• Diámetro: ~1 μm</li>
                <li>• Sin mielina</li>
                <li>• Función: Dolor lento, temperatura</li>
              </ul>
            </div>

            <div className="bg-red-500/20 border border-red-400 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3">Fibra C Diabética</h3>
              <ul className="space-y-2 text-lg">
                <li>• Velocidad: 0.5 m/s (67% ↓)</li>
                <li>• Diámetro: &lt;0.7 μm (atrofia)</li>
                <li>• Sin mielina (igual)</li>
                <li>• Síntomas: Hipoalgesia + dolor neuropático</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },

    // CASO 2: CONSECUENCIAS CLÍNICAS
    {
      type: 'caso2',
      content: (
        <div className="h-full bg-gradient-to-br from-purple-900 to-pink-900 text-white p-12">
          <h2 className="text-4xl font-bold mb-8 text-center">🏥 Consecuencias Clínicas</h2>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-red-400" />
                Manifestaciones de Neuropatía Diabética
              </h3>
              <div className="grid grid-cols-2 gap-4 text-lg">
                <div>
                  <p className="font-bold text-yellow-300 mb-2">Síntomas Sensitivos</p>
                  <ul className="space-y-1">
                    <li>• Pérdida de sensibilidad al dolor</li>
                    <li>• Pérdida de sensibilidad térmica</li>
                    <li>• Parestesias (hormigueo)</li>
                    <li>• Dolor neuropático (paradójico)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-yellow-300 mb-2">Síntomas Motores</p>
                  <ul className="space-y-1">
                    <li>• Debilidad muscular</li>
                    <li>• Atrofia</li>
                    <li>• Reflejos disminuidos</li>
                    <li>• Alteraciones de la marcha</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-red-500/20 border-2 border-red-400 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">⚠️ Riesgos Asociados</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex gap-3">
                  <span className="text-2xl">🦶</span>
                  <div>
                    <p className="font-bold">Úlceras del Pie Diabético</p>
                    <p className="text-base opacity-90">Por pérdida de sensibilidad protectora</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="font-bold">Quemaduras No Detectadas</p>
                    <p className="text-base opacity-90">Pérdida de sensibilidad térmica</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">💊</span>
                  <div>
                    <p className="font-bold">Dolor Neuropático Crónico</p>
                    <p className="text-base opacity-90">Requiere manejo farmacológico específico</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3 text-center">🎯 Concepto Clave para el Examen</h3>
              <p className="text-xl text-center">
                La velocidad de conducción depende de factores <span className="font-bold">geométricos</span> (diámetro),
                <span className="font-bold"> eléctricos</span> (resistencias, capacitancia) y <span className="font-bold">estructurales</span> (mielinización).
                La diabetes afecta los tres niveles.
              </p>
            </div>
          </div>
        </div>
      )
    },

    // CASO 3: PRESENTACIÓN
    {
      type: 'caso3',
      content: (
        <div className="h-full bg-gradient-to-br from-orange-600 to-red-600 text-white p-12">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-white/20 p-4 rounded-xl">
                <Zap className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl opacity-75">Caso 3</h3>
                <h2 className="text-5xl font-bold">Intoxicación Alimentaria</h2>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur p-8 rounded-xl space-y-6">
              <p className="text-2xl leading-relaxed">
                Un paciente de 45 años ingresa a urgencias con <span className="font-bold text-yellow-300">diplopía</span> (visión doble),
                <span className="font-bold text-yellow-300"> disfagia</span> (dificultad para tragar) y
                <span className="font-bold text-yellow-300"> debilidad muscular descendente</span>.
              </p>
              <p className="text-xl opacity-90">
                Refiere haber consumido <span className="font-bold">conservas caseras</span> 48 horas antes.
                Se sospecha <span className="font-bold text-red-300">botulismo</span>.
              </p>
            </div>

            <div className="bg-yellow-400 text-gray-900 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">🦠 Agente Causal</h3>
              <p className="text-lg">
                <span className="font-bold">Toxina botulínica</span> producida por <i>Clostridium botulinum</i>.
                Una de las sustancias más letales conocidas (DL₅₀ = 1 ng/kg).
              </p>
            </div>

            <div className="bg-red-500 text-white p-6 rounded-xl">
              <p className="text-xl font-semibold text-center">
                🤔 Pregunta clave: ¿Cómo afecta la toxina botulínica la transmisión sináptica?
                ¿Por qué causa parálisis flácida?
              </p>
            </div>
          </motion.div>
        </div>
      )
    },

    // CASO 3: MECANISMO MOLECULAR
    {
      type: 'caso3',
      content: (
        <div className="h-full bg-gradient-to-br from-red-700 to-orange-700 text-white p-12">
          <h2 className="text-4xl font-bold mb-8 text-center">🔬 Mecanismo Molecular</h2>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-cyan-300">Transmisión Sináptica Normal</h3>
              <ol className="space-y-3 text-lg">
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-300">1.</span>
                  <span>Potencial de acción llega al terminal presináptico</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-300">2.</span>
                  <span>Apertura de canales Ca²⁺ voltaje-dependientes</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-300">3.</span>
                  <span>Entrada de Ca²⁺ al terminal</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-300">4.</span>
                  <span>Fusión de vesículas sinápticas con la membrana (exocitosis)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-300">5.</span>
                  <span>Liberación de neurotransmisores (ej: acetilcolina)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-yellow-300">6.</span>
                  <span>Activación de receptores postsinápticos</span>
                </li>
              </ol>
            </div>

            <div className="bg-red-500/20 border-2 border-red-400 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-8 h-8 text-red-400" />
                Acción de la Toxina Botulínica
              </h3>
              <div className="space-y-4 text-lg">
                <p className="font-bold text-red-300">La toxina botulínica es una proteasa que cliva proteínas SNARE:</p>
                <ul className="space-y-2 ml-4">
                  <li>• <span className="font-bold">SNAP-25</span> (tipos A, C, E)</li>
                  <li>• <span className="font-bold">Sintaxina</span> (tipo C)</li>
                  <li>• <span className="font-bold">VAMP/Sinaptobrevina</span> (tipos B, D, F, G)</li>
                </ul>
                <p className="mt-4 bg-gray-900 p-4 rounded">
                  <span className="font-bold text-yellow-300">Resultado:</span> Las vesículas sinápticas NO pueden fusionarse
                  con la membrana presináptica → <span className="font-bold text-red-300">Bloqueo de la exocitosis</span>
                </p>
              </div>
            </div>

            <div className="bg-yellow-400 text-gray-900 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">⚡ Consecuencia Funcional</h3>
              <p className="text-lg">
                Sin liberación de acetilcolina en la unión neuromuscular →
                <span className="font-bold"> Parálisis flácida</span> (músculo no puede contraerse)
              </p>
            </div>
          </div>
        </div>
      )
    },

    // CASO 3: FISIOPATOLOGÍA
    {
      type: 'caso3',
      content: (
        <div className="h-full bg-gradient-to-br from-orange-800 to-red-800 text-white p-12">
          <h2 className="text-4xl font-bold mb-8 text-center">🧬 Fisiopatología Detallada</h2>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-green-300">Proteínas SNARE y Fusión Vesicular</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded">
                  <p className="font-bold text-cyan-300 mb-2">Proteínas Presi napticas</p>
                  <ul className="text-base space-y-1">
                    <li>• VAMP (en vesícula)</li>
                    <li>• Sintaxina (en membrana)</li>
                    <li>• SNAP-25 (en membrana)</li>
                  </ul>
                </div>
                <div className="bg-gray-900 p-4 rounded">
                  <p className="font-bold text-purple-300 mb-2">Función Normal</p>
                  <ul className="text-base space-y-1">
                    <li>• Forman complejo SNARE</li>
                    <li>• Ca²⁺ activa sinaptotagmina</li>
                    <li>• Fusión vesícula-membrana</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-red-500/20 border-2 border-red-400 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">🔪 Mecanismo de la Toxina</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="text-4xl">1️⃣</div>
                  <div>
                    <p className="font-bold text-lg">Unión</p>
                    <p>Toxina se une a receptores en terminal nervioso colinérgico</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-4xl">2️⃣</div>
                  <div>
                    <p className="font-bold text-lg">Internalización</p>
                    <p>Endocitosis mediada por receptor</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-4xl">3️⃣</div>
                  <div>
                    <p className="font-bold text-lg">Translocación</p>
                    <p>Cadena ligera (proteasa) cruza al citoplasma</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-4xl">4️⃣</div>
                  <div>
                    <p className="font-bold text-lg text-red-300">Clivaje</p>
                    <p className="font-bold">Proteólisis de SNAP-25, sintaxina o VAMP</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-4xl">5️⃣</div>
                  <div>
                    <p className="font-bold text-lg text-red-300">Bloqueo</p>
                    <p className="font-bold">Imposibilidad de formar complejo SNARE funcional</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3 text-center">⚠️ Especificidad</h3>
              <p className="text-lg text-center">
                La toxina afecta principalmente <span className="font-bold">uniones neuromusculares colinérgicas</span>,
                pero también puede afectar <span className="font-bold">sinapsis parasimpáticas</span> (visión, salivación, motilidad intestinal).
              </p>
            </div>
          </div>
        </div>
      )
    },

    // CASO 3: MANIFESTACIONES CLÍNICAS
    {
      type: 'caso3',
      content: (
        <div className="h-full bg-gradient-to-br from-red-900 to-pink-900 text-white p-12">
          <h2 className="text-4xl font-bold mb-8 text-center">🏥 Manifestaciones Clínicas</h2>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-yellow-300">Progresión de Síntomas (Descendente)</h3>
              <div className="space-y-4 text-lg">
                <div className="flex gap-3">
                  <div className="text-3xl">👁️</div>
                  <div className="flex-1">
                    <p className="font-bold">Síntomas Oculares (primeros)</p>
                    <ul className="text-base space-y-1 mt-1">
                      <li>• Diplopía (visión doble)</li>
                      <li>• Ptosis (caída de párpados)</li>
                      <li>• Midriasis (pupilas dilatadas)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-3xl">😶</div>
                  <div className="flex-1">
                    <p className="font-bold">Síntomas Bulbares</p>
                    <ul className="text-base space-y-1 mt-1">
                      <li>• Disfagia (dificultad para tragar)</li>
                      <li>• Disartria (dificultad para hablar)</li>
                      <li>• Xerostomía (boca seca)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-3xl">💪</div>
                  <div className="flex-1">
                    <p className="font-bold">Debilidad Muscular Generalizada</p>
                    <ul className="text-base space-y-1 mt-1">
                      <li>• Parálisis flácida descendente</li>
                      <li>• Extremidades superiores luego inferiores</li>
                      <li>• Reflejos disminuidos o ausentes</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-3xl">🫁</div>
                  <div className="flex-1">
                    <p className="font-bold text-red-300">Insuficiencia Respiratoria (grave)</p>
                    <ul className="text-base space-y-1 mt-1">
                      <li>• Parálisis de diafragma e intercostales</li>
                      <li>• Requiere ventilación mecánica</li>
                      <li>• Causa principal de muerte</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-500/20 border-2 border-red-400 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3">⚠️ Signos de Alerta</h3>
              <ul className="space-y-2 text-lg">
                <li>• Conservación de conciencia y sensibilidad (NO afecta SNC directamente)</li>
                <li>• Ausencia de fiebre (NO es infeccioso)</li>
                <li>• Inicio 12-36h post-ingesta (puede ser hasta 8 días)</li>
                <li>• Parálisis FLÁCIDA (vs. espástica en lesión de neurona motora superior)</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3 text-center">💊 Tratamiento</h3>
              <div className="grid grid-cols-2 gap-4 text-lg">
                <div>
                  <p className="font-bold mb-2">Medidas Generales</p>
                  <ul className="text-base space-y-1">
                    <li>• Soporte ventilatorio</li>
                    <li>• Hidratación y nutrición</li>
                    <li>• Monitoreo intensivo</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold mb-2">Específico</p>
                  <ul className="text-base space-y-1">
                    <li>• Antitoxina botulínica (si &lt;72h)</li>
                    <li>• NO antibióticos (empeoran)</li>
                    <li>• Recuperación: semanas a meses</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // CASO 3: CONCEPTO CLAVE
    {
      type: 'caso3',
      content: (
        <div className="h-full bg-gradient-to-br from-orange-900 to-red-900 text-white p-12">
          <h2 className="text-4xl font-bold mb-8 text-center">🎯 Concepto Clave para el Examen</h2>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-cyan-300">Exocitosis y Proteínas SNARE</h3>
              <p className="text-lg mb-4">
                La liberación de neurotransmisores requiere la <span className="font-bold text-yellow-300">fusión de vesículas</span> con
                la membrana presináptica, proceso mediado por el complejo SNARE.
              </p>
              <div className="bg-gray-900 p-6 rounded space-y-3">
                <p className="font-bold text-lg">Componentes del Complejo SNARE:</p>
                <ul className="space-y-2">
                  <li>• <span className="font-bold text-green-300">VAMP/Sinaptobrevina</span> (v-SNARE, en vesícula)</li>
                  <li>• <span className="font-bold text-blue-300">Sintaxina</span> (t-SNARE, en membrana target)</li>
                  <li>• <span className="font-bold text-purple-300">SNAP-25</span> (t-SNARE, en membrana target)</li>
                </ul>
                <p className="mt-4 text-yellow-300 font-bold">
                  Estos 3 se enrollan formando un complejo que acerca vesícula y membrana.
                </p>
              </div>
            </div>

            <div className="bg-red-500/20 border-2 border-red-400 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">🔬 Botulismo vs. Otros Trastornos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded">
                  <p className="font-bold text-red-300 mb-2">Botulismo</p>
                  <ul className="text-sm space-y-1">
                    <li>• Bloqueo presináptico</li>
                    <li>• Parálisis flácida descendente</li>
                    <li>• Afecta colinérgica</li>
                    <li>• Reversible (lento)</li>
                  </ul>
                </div>
                <div className="bg-gray-900 p-4 rounded">
                  <p className="font-bold text-blue-300 mb-2">Miastenia Gravis</p>
                  <ul className="text-sm space-y-1">
                    <li>• Bloqueo postsináptico (Ac)</li>
                    <li>• Fatiga muscular</li>
                    <li>• Afecta receptores nAChR</li>
                    <li>• Crónico recurrente</li>
                  </ul>
                </div>
                <div className="bg-gray-900 p-4 rounded">
                  <p className="font-bold text-green-300 mb-2">Síndrome de Lambert-Eaton</p>
                  <ul className="text-sm space-y-1">
                    <li>• Bloqueo canales Ca²⁺ (Ac)</li>
                    <li>• Debilidad proximal</li>
                    <li>• Mejora con uso (facilitación)</li>
                    <li>• Asociado a cáncer</li>
                  </ul>
                </div>
                <div className="bg-gray-900 p-4 rounded">
                  <p className="font-bold text-purple-300 mb-2">Tétanos</p>
                  <ul className="text-sm space-y-1">
                    <li>• Bloqueo inhibición (glicina)</li>
                    <li>• Parálisis espástica</li>
                    <li>• Rigidez y espasmos</li>
                    <li>• Afecta SNC</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3 text-center">💡 Para Recordar</h3>
              <p className="text-xl text-center font-semibold">
                &quot;Sin SNARE funcional, no hay exocitosis. Sin exocitosis, no hay liberación de neurotransmisor.
                Sin neurotransmisor, no hay contracción muscular.&quot;
              </p>
            </div>
          </div>
        </div>
      )
    },

    // CIERRE
    {
      type: 'cierre',
      content: (
        <div className="h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col justify-center items-center text-center space-y-8"
          >
            <CheckCircle2 className="w-24 h-24 text-green-300" />

            <h1 className="text-6xl font-bold">¡Repaso Completado!</h1>

            <div className="bg-white/10 backdrop-blur p-8 rounded-2xl max-w-3xl">
              <h2 className="text-3xl font-bold mb-6">Conceptos Repasados</h2>
              <div className="grid grid-cols-3 gap-6 text-left">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-blue-300" />
                    <p className="font-bold">Caso 1</p>
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>✓ Ecuación de Nernst</li>
                    <li>✓ Potencial de equilibrio</li>
                    <li>✓ Excitabilidad celular</li>
                    <li>✓ Efectos del Mg²⁺</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-6 h-6 text-purple-300" />
                    <p className="font-bold">Caso 2</p>
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>✓ Conducción nerviosa</li>
                    <li>✓ Velocidad de propagación</li>
                    <li>✓ Mielinización</li>
                    <li>✓ Neuropatía diabética</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-6 h-6 text-orange-300" />
                    <p className="font-bold">Caso 3</p>
                  </div>
                  <ul className="text-sm space-y-1">
                    <li>✓ Transmisión sináptica</li>
                    <li>✓ Exocitosis</li>
                    <li>✓ Proteínas SNARE</li>
                    <li>✓ Toxina botulínica</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-2xl">
                🎓 ¡Éxitos en el examen final!
              </p>
              <p className="text-lg opacity-90">
                Recuerda: Integra conceptos, no memorices aisladamente
              </p>
            </div>

            <div className="bg-yellow-400 text-gray-900 p-6 rounded-xl max-w-2xl">
              <p className="text-xl font-bold mb-2">📚 Recomendación Final</p>
              <p className="text-base">
                Repasa gráficos de potenciales de acción, velocidades de conducción y mecanismos de transmisión sináptica.
                Practica cálculos con Nernst y Goldman-Hodgkin-Katz.
              </p>
            </div>
          </motion.div>
        </div>
      )
    }
  ];

  const goToNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goToPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToStart = () => {
    setCurrentSlide(0);
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* Barra de navegación superior */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={goToStart}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Volver al inicio"
          >
            <Home className="w-5 h-5 text-white" />
          </button>
          <div className="text-white">
            <p className="text-sm opacity-75">Clase de Repaso - Bioelectricidad</p>
            <p className="text-lg font-bold">
              Slide {currentSlide + 1} / {slides.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToPrev}
            disabled={currentSlide === 0}
            className={`p-2 rounded-lg transition-colors ${
              currentSlide === 0
                ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentSlide === slides.length - 1}
            className={`p-2 rounded-lg transition-colors ${
              currentSlide === slides.length - 1
                ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Contenido de la diapositiva */}
      <div className="flex-1 overflow-auto bg-gray-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-full"
          >
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicador de progreso */}
      <div className="bg-gray-800 px-6 py-2">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default RepasoExamen;
