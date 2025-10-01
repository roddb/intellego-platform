import { NextResponse } from 'next/server';
import { createEvaluation } from '@/lib/db-operations';

// Temporary endpoint for testing - DELETE after use
export async function POST() {
  try {
    const feedback = `# RETROALIMENTACIÓN - RDB (USUARIO DE PRUEBA)

## Examen: Química 5to D - Reacciones Redox
### Fecha: 1/10/2025
### Nota: 75/100

---

## 📊 Tu Progreso Histórico:

Basado en tu seguimiento de las últimas evaluaciones:
- **Comprensión conceptual:** 75.0 (buen nivel de entendimiento teórico)
- **Aplicación práctica:** 70.0 (capacidad de resolución adecuada)
- **Pensamiento crítico:** 73.0 (análisis satisfactorio)
- **Autorregulación:** 76.0 (buena gestión del estudio)
- **Metacognición:** 74.0 (consciencia de tu proceso de aprendizaje)
- **Promedio general previo:** 73.6

Tu historial muestra una tendencia estable con potencial de mejora.

---

## 🔍 Análisis de tu Examen:

### Ejercicio 1: Identificación de Agentes Oxidantes y Reductores

**Lo que esperábamos de ti:** Con comprensión de 75%, esperábamos identificación correcta con explicación adecuada.

**Lo que demostraste:**
- ✅ Identificaste correctamente el agente oxidante (MnO4-)
- ✅ Identificaste correctamente el agente reductor (Fe2+)
- ✅ Explicaste el proceso de transferencia de electrones
- ⚠️ Confusión menor en la notación de estados de oxidación
- ✅ Verificaste tus respuestas con el balance de la ecuación

**Comparación:** 🟢 **SEGÚN LO ESPERADO** en comprensión y aplicación

Tu análisis fue sistemático y mostraste buen dominio del concepto de oxidación-reducción.

**Retroalimentación específica:**
Muy buen trabajo en la identificación de agentes. La explicación del flujo de electrones fue clara. Para mejorar, revisa la notación estándar de estados de oxidación (uso de paréntesis vs. superíndices).

### Ejercicio 2: Balanceo de Ecuaciones Redox por el Método del Ion-Electrón

**Lo que esperábamos de ti:** Con tu aplicación práctica de 70%, esperábamos algunos errores procedimentales.

**Lo que demostraste:**
- ✅ Separaste correctamente las semirreacciones
- ✅ Balanceaste los elementos principales
- ⚠️ Error en el balance de cargas en el primer intento
- ✅ Corregiste el error al revisar
- ✅ Resultado final correcto

**Comparación:** 🟢 **SOBRE EXPECTATIVA** en autocorrección

Tu capacidad de detectar y corregir errores es una fortaleza valiosa.

**Retroalimentación específica:**
El proceso de balanceo fue bien estructurado. La autocorrección mostró metacognición efectiva. Practica más el balance de cargas para reducir errores iniciales.

### Ejercicio 3: Cálculo de Potencial de Celda

**Lo que esperábamos de ti:** Con pensamiento crítico de 73%, esperábamos aplicación de fórmulas con interpretación básica.

**Lo que demostraste:**
- ✅ Identificaste los potenciales estándar correctamente
- ✅ Aplicaste la ecuación de Nernst
- ❌ Error en el cálculo logarítmico
- ⚠️ No verificaste la razonabilidad del resultado

**Comparación:** 🔵 **BAJO EXPECTATIVA** en verificación

El error matemático pudo haberse detectado con una verificación simple.

**Retroalimentación específica:**
Dominas la teoría pero necesitas fortalecer la ejecución matemática. Siempre verifica: "¿El potencial tiene sentido físicamente?" Un potencial de +5V en una celda común debería ser una señal de alerta.

---

## 🎯 Validación de tu Progreso:

- Confirmamos **75%** de nuestras predicciones sobre tu desempeño
- **Sorpresas positivas:** Mejor capacidad de autocorrección de lo esperado
- **Patrón confirmado:** Necesitas reforzar la verificación de resultados numéricos

El sistema muestra que tu comprensión teórica es sólida. El siguiente paso es perfeccionar la ejecución práctica.

---

## 💡 Recomendaciones Personalizadas:

1. **VERIFICACIÓN MATEMÁTICA** (Mayor discrepancia detectada):
   - Después de cada cálculo, verifica con estimaciones
   - Usa la calculadora con cuidado en logaritmos
   - Comprueba unidades y magnitudes razonables

2. **MANTÉN TU FORTALEZA EN TEORÍA** (Área consolidada):
   - Tu comprensión conceptual es excelente
   - Sigue haciendo conexiones entre conceptos
   - Aplicala a problemas más complejos

3. **NOTACIÓN QUÍMICA** (Detalle mejorable):
   - Revisa convenciones de estados de oxidación
   - Practica escritura de semirreacciones
   - Mantén consistencia en tu notación

---

## 📈 Próximos Pasos:

### Plan específico para las próximas 2 semanas:

**Semana 1: Refuerzo Matemático**
- Practica 5 problemas de potencial de celda diarios
- SIEMPRE incluye verificación de resultados
- Tiempo objetivo: 20 min por problema

**Semana 2: Integración Avanzada**
- Problemas combinados de redox + termodinámica
- Enfoque en análisis crítico de resultados
- Conecta con aplicaciones reales (pilas, corrosión)

### Meta inmediata:
Subir tu promedio a 80/100 en la próxima evaluación mediante:
- ✅ Mantener tu excelente comprensión teórica
- ✅ Sistematizar la verificación matemática
- ✅ Perfeccionar la notación química

---

## 📌 Mensaje Final:

RDB, este examen muestra que tienes una base sólida en química. Tu nota de 75 refleja bien tu nivel actual, y tienes todo el potencial para alcanzar el rango de 80-85 con práctica enfocada.

La clave está en la **PRECISIÓN MATEMÁTICA**: mantén lo bueno (teoría, autocorrección) y agrega verificación sistemática en los cálculos. Tienes las herramientas, solo necesitas usarlas consistentemente.

**Puntos fuertes a conservar:**
- Excelente comprensión conceptual
- Capacidad de autocorrección
- Buena estructura en el desarrollo

**Áreas de crecimiento inmediato:**
- Verificación de cálculos matemáticos
- Perfección en notación química
- Atención al detalle en procedimientos

¡Sigue así! Estás en el camino correcto. Con dedicación constante, los 80 puntos están al alcance.

---

*Evaluación de prueba generada para usuario RDB@test.com*
*Sistema Intellego Platform - Testing Environment*
*Fecha de creación: 01/10/2025*`;

    const result = await createEvaluation({
      studentId: 'u_5inzfd9ncmdyhzank', // RDB test user
      subject: 'Química',
      examDate: '2025-10-01',
      examTopic: 'Reacciones Redox',
      score: 75,
      feedback,
      createdBy: '3d47c07d-3785-493a-b07b-ee34da1113b4' // Instructor ID
    });

    return NextResponse.json({
      success: true,
      evaluationId: result.id,
      message: 'Test evaluation created successfully'
    });
  } catch (error) {
    console.error('Error creating test evaluation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
