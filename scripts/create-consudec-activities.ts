/**
 * Script para crear 3 actividades CONSUDEC reales con casos educativos
 * Ejecutar con: npx tsx scripts/create-consudec-activities.ts
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

function generateActivityId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getCurrentISODate(): string {
  return new Date().toISOString();
}

// Actividad 1: Diversidad en el Aula
const activity1 = {
  id: generateActivityId(),
  title: 'Caso 1: Gestión de la Diversidad en el Aula',
  description: 'Análisis de estrategias pedagógicas para atender la diversidad de aprendizajes en un grupo heterogéneo.',
  caseText: `La profesora Martina enseña Matemática en un 4to año de secundaria. Su grupo de 28 estudiantes presenta una marcada heterogeneidad: algunos dominan conceptos avanzados y resuelven problemas complejos con facilidad, mientras que otros aún tienen dificultades con operaciones básicas y comprensión de consignas.

Durante una clase sobre funciones cuadráticas, Martina nota que 5 estudiantes terminan los ejercicios en 10 minutos y comienzan a distraerse, 12 estudiantes avanzan a ritmo normal siguiendo las explicaciones, 8 estudiantes necesitan ayuda constante y se frustran, y 3 estudiantes con necesidades educativas específicas requieren materiales adaptados.

La docente ha intentado varias estrategias: explicar el mismo contenido de diferentes maneras, dar ejercicios extra a quienes terminan primero, y agrupar estudiantes por nivel. Sin embargo, siente que los estudiantes avanzados se aburren, los de ritmo medio no reciben suficiente atención personalizada, y los que tienen dificultades se sienten relegados.

Además, debe cumplir con el programa oficial, preparar a todos para las evaluaciones institucionales, y mantener un clima de clase positivo donde nadie se sienta excluido. El próximo mes tiene una inspección y debe demostrar que todos los estudiantes están progresando según sus capacidades.

Martina se pregunta: ¿Cómo puede diseñar una secuencia didáctica que atienda simultáneamente estas diferentes necesidades sin que ningún grupo se sienta abandonado? ¿Qué estrategias concretas podría implementar para que el aprendizaje sea significativo para todos?`,
  questions: [
    {
      id: generateQuestionId(),
      text: '¿Qué estrategias de diferenciación pedagógica recomendarías implementar en esta situación y por qué?',
      placeholder: 'Desarrolla tu análisis considerando al menos 3 estrategias específicas con fundamento teórico...',
      wordLimit: 200,
      rubric: {
        excellent: 'Propone 3+ estrategias concretas y viables con fundamento en teorías del aprendizaje (zona de desarrollo próximo, inteligencias múltiples, diseño universal). Argumenta cómo cada una atiende diferentes necesidades. Anticipa desafíos de implementación.',
        good: 'Propone 2-3 estrategias con fundamento pedagógico. Explica claramente cómo benefician a diferentes grupos. Argumentación sólida pero menos exhaustiva.',
        satisfactory: 'Menciona al menos 2 estrategias relevantes. Argumentación básica sin profundidad teórica. Falta conexión explícita entre estrategias y necesidades específicas.',
        insufficient: 'Menciona estrategias genéricas sin fundamento. No diferencia necesidades de cada grupo. Respuesta superficial o fuera de contexto.'
      }
    },
    {
      id: generateQuestionId(),
      text: '¿Cómo organizarías la clase para maximizar el aprendizaje de todos los grupos simultáneamente?',
      placeholder: 'Describe una organización concreta de 60 minutos de clase...',
      wordLimit: 200,
      rubric: {
        excellent: 'Diseña una secuencia detallada y realista de 60 minutos con tiempos específicos. Incluye momentos de trabajo común, diferenciado y colaborativo. Justifica pedagógicamente cada elección. Prevé materiales y agrupamientos.',
        good: 'Propone organización clara con fases diferenciadas. Incluye tiempos aproximados y tipos de actividades. Justificación pedagógica presente pero menos detallada.',
        satisfactory: 'Describe organización básica con al menos 2-3 momentos diferenciados. Falta precisión en tiempos o justificación pedagógica. Ideas generales sin concreción.',
        insufficient: 'Organización vaga o irrealista. No contempla simultaneidad de necesidades. Falta estructura temporal o pedagógica.'
      }
    },
    {
      id: generateQuestionId(),
      text: '¿Qué herramientas de evaluación utilizarías para verificar el progreso de cada grupo y cómo las adaptarías?',
      placeholder: 'Explica al menos 2 herramientas de evaluación diferenciadas...',
      wordLimit: 200,
      rubric: {
        excellent: 'Propone 2+ herramientas de evaluación auténticas y diferenciadas (rúbricas, portafolios, autoevaluación). Explica criterios de éxito adaptativos. Conecta evaluación con retroalimentación formativa. Contempla diversidad de formas de demostrar aprendizaje.',
        good: 'Propone herramientas de evaluación diferenciadas. Explica adaptaciones para diferentes niveles. Menciona criterios pero con menos detalle.',
        satisfactory: 'Menciona al menos 2 tipos de evaluación. Adaptaciones básicas sin fundamento sólido. Falta conexión con retroalimentación.',
        insufficient: 'Evaluación única sin diferenciación. No contempla diversidad de aprendizajes. Respuesta genérica.'
      }
    }
  ],
  subject: 'Didáctica',
  difficulty: 'medium' as const,
  estimatedTime: 45,
  status: 'active' as const,
  createdBy: '3d47c07d-3785-493a-b07b-ee34da1113b4', // Rodrigo Di Bernardo
  createdAt: getCurrentISODate(),
  updatedAt: getCurrentISODate(),
};

// Actividad 2: Conflicto entre Estudiantes
const activity2 = {
  id: generateActivityId(),
  title: 'Caso 2: Resolución de Conflictos y Convivencia Escolar',
  description: 'Análisis de un conflicto entre estudiantes y estrategias para promover la convivencia democrática.',
  caseText: `El profesor Carlos coordina un 5to año de secundaria. Durante las últimas semanas, ha observado tensiones crecientes entre dos grupos de estudiantes. El conflicto comenzó con comentarios en redes sociales sobre un trabajo grupal de Historia, donde un equipo acusó a otro de "copiar sus ideas".

La situación escaló: intercambian miradas hostiles, hacen comentarios sarcásticos durante las clases, y han formado "bandos" que dividen al curso. Varios estudiantes le comentaron a Carlos que el ambiente es tenso y que "da miedo" participar en clase por temor a ser atacados verbalmente.

Ayer, durante el recreo, hubo un incidente: Lucía (líder de un grupo) confrontó a Marcos (líder del otro) acusándolo de difamarla en Instagram. Marcos respondió con insultos. Varios compañeros grabaron el altercado y lo compartieron en grupos de WhatsApp. Los padres de ambos estudiantes ya se comunicaron con el colegio exigiendo "medidas disciplinarias" contra el otro.

La directora le pidió a Carlos que resuelva la situación antes de que requiera intervención institucional formal. Carlos sabe que ambos estudiantes son buenos alumnos académicamente, provienen de familias que valoran la educación, y antes del conflicto tenían buena relación. También sabe que el resto del curso está incómodo y que esto está afectando el clima de aprendizaje de todos.

Carlos debe decidir cómo abordar el conflicto de manera que: se restaure la convivencia, ambas partes se sientan escuchadas, se repare el daño causado, y se convierta en una oportunidad de aprendizaje sobre resolución democrática de conflictos.`,
  questions: [
    {
      id: generateQuestionId(),
      text: '¿Qué pasos concretos seguirías para mediar en este conflicto, fundamentando tu respuesta en enfoques de resolución pacífica?',
      placeholder: 'Describe un proceso paso a paso de mediación escolar...',
      wordLimit: 200,
      rubric: {
        excellent: 'Diseña proceso estructurado de mediación con fases claras (preparación, encuentro, acuerdos, seguimiento). Fundamenta en enfoques restaurativos o de justicia democrática. Contempla escucha activa, validación de emociones y construcción colaborativa de soluciones. Anticipa resistencias.',
        good: 'Propone proceso de mediación con fases identificables. Menciona principios de resolución pacífica. Incluye escucha de ambas partes y búsqueda de acuerdos.',
        satisfactory: 'Describe intervención básica con algunos elementos de mediación. Falta estructura clara o fundamento teórico. Enfoque más intuitivo que sistemático.',
        insufficient: 'Respuesta punitiva o unilateral. No contempla mediación real. Solución impuesta sin participación de los involucrados.'
      }
    },
    {
      id: generateQuestionId(),
      text: '¿Cómo involucrarías al resto del curso para reconstruir el clima de convivencia y prevenir futuros conflictos?',
      placeholder: 'Propone estrategias grupales para trabajar con todo el curso...',
      wordLimit: 200,
      rubric: {
        excellent: 'Propone estrategias participativas para todo el curso (círculos de diálogo, acuerdos de convivencia, proyectos colaborativos). Fundamenta en pedagogía de la convivencia. Contempla reconstrucción de vínculos y prevención sistémica. Incluye reflexión sobre redes sociales.',
        good: 'Propone actividades grupales para mejorar clima. Menciona participación del curso. Incluye elementos de prevención.',
        satisfactory: 'Menciona trabajo con el grupo sin estrategias concretas. Enfoque más reactivo que preventivo. Falta fundamento pedagógico.',
        insufficient: 'No contempla al resto del curso. Enfoque solo en los protagonistas. Respuesta limitada o irrelevante.'
      }
    }
  ],
  subject: 'Pedagogía',
  difficulty: 'hard' as const,
  estimatedTime: 40,
  status: 'active' as const,
  createdBy: '3d47c07d-3785-493a-b07b-ee34da1113b4', // Rodrigo Di Bernardo
  createdAt: getCurrentISODate(),
  updatedAt: getCurrentISODate(),
};

// Actividad 3: Motivación y Participación
const activity3 = {
  id: generateActivityId(),
  title: 'Caso 3: Estrategias para Aumentar la Motivación y Participación',
  description: 'Diseño de propuestas pedagógicas para promover el compromiso activo de estudiantes desmotivados.',
  caseText: `La profesora Ana enseña Lengua y Literatura en un 3er año de secundaria. Este año, su grupo de 25 estudiantes muestra una apatía generalizada que la preocupa profundamente. Durante las clases, observa: miradas perdidas, bocas cerradas cuando pregunta algo, celulares escondidos bajo los bancos, y un silencio incómodo que solo se rompe cuando alguien pide "¿falta mucho?".

Al comienzo del año, Ana intentó entusiasmarlos con un proyecto de lectura de novelas clásicas. La respuesta fue: "Esto es aburrido", "No entendemos nada", "¿Para qué sirve?". Luego probó con textos contemporáneos, videos, debates... pero la participación sigue siendo mínima. Solo 3 o 4 estudiantes intervienen, siempre los mismos.

En conversaciones informales, Ana descubrió que muchos trabajan después de clases, que varios tienen problemas familiares, y que casi todos piensan que "Lengua no sirve para nada en la vida real". Cuando entregaron una tarea sobre análisis sintáctico, 18 de 25 la copiaron de internet sin siquiera leerla.

Ana nota que fuera del aula son activos: hablan animadamente de series, música, youtubers, y están constantemente creando contenido en redes sociales (videos, memes, historias). Sin embargo, ese entusiasmo desaparece completamente cuando entran al aula.

La semana que viene, Ana debe comenzar una unidad sobre "Textos argumentativos". Sabe que si sigue con la metodología tradicional (leer ejemplos, explicar estructura, pedir una producción escrita), el resultado será el mismo: desinterés, trabajos copiados y aprendizaje superficial. Necesita repensar completamente su enfoque.`,
  questions: [
    {
      id: generateQuestionId(),
      text: '¿Qué estrategias implementarías para conectar el contenido "Textos argumentativos" con los intereses reales de los estudiantes?',
      placeholder: 'Propone al menos 2 estrategias concretas y motivadoras...',
      wordLimit: 200,
      rubric: {
        excellent: 'Propone 2+ estrategias que conectan textos argumentativos con cultura juvenil (debate sobre series, análisis de publicidad, creación de contenido para redes). Fundamenta en teorías de aprendizaje situado o conectivismo. Explica cómo cada estrategia desarrolla competencias curriculares. Anticipa desafíos.',
        good: 'Propone estrategias que vinculan contenido con intereses juveniles. Conexión clara con aprendizaje significativo. Menos detalle en implementación.',
        satisfactory: 'Menciona conexión con intereses sin estrategias específicas. Propuestas genéricas tipo "usar tecnología" sin concreción. Falta fundamento pedagógico.',
        insufficient: 'Mantiene enfoque tradicional. No conecta con motivaciones reales. Culpa a estudiantes por desinterés.'
      }
    },
    {
      id: generateQuestionId(),
      text: '¿Cómo diseñarías la secuencia didáctica de esta unidad para promover participación activa desde el primer día?',
      placeholder: 'Describe una secuencia que active el protagonismo estudiantil...',
      wordLimit: 200,
      rubric: {
        excellent: 'Diseña secuencia con apertura potente (problema real, desafío auténtico). Incluye aprendizaje basado en proyectos o problemas. Roles activos para estudiantes (creadores, no receptores). Evaluación auténtica y visible. Contempla metacognición y transferencia.',
        good: 'Propone secuencia con actividades participativas. Estudiantes tienen roles activos. Incluye producción final significativa.',
        satisfactory: 'Secuencia con algunos elementos activos pero estructura mayormente expositiva. Participación limitada a responder preguntas.',
        insufficient: 'Secuencia tradicional (explicación-ejercicios-evaluación). Estudiantes como receptores pasivos. No contempla motivación.'
      }
    },
    {
      id: generateQuestionId(),
      text: '¿Qué cambios en la evaluación propondrías para que los estudiantes perciban valor en aprender este contenido?',
      placeholder: 'Explica un sistema de evaluación que promueva compromiso genuino...',
      wordLimit: 200,
      rubric: {
        excellent: 'Propone evaluación auténtica con productos reales (podcast, campaña, video ensayo). Incluye autoevaluación, coevaluación y metacognición. Criterios transparentes co-construidos. Retroalimentación formativa continua. Conexión clara entre evaluación y uso social del conocimiento.',
        good: 'Propone evaluación con productos significativos. Incluye participación estudiantil en evaluación. Criterios claros.',
        satisfactory: 'Menciona evaluación menos tradicional sin detalles de implementación. Falta conexión con motivación intrínseca.',
        insufficient: 'Mantiene evaluación tradicional (prueba escrita). No contempla motivación. Evaluación punitiva o controladora.'
      }
    }
  ],
  subject: 'Didáctica',
  difficulty: 'easy' as const,
  estimatedTime: 35,
  status: 'active' as const,
  createdBy: '3d47c07d-3785-493a-b07b-ee34da1113b4', // Rodrigo Di Bernardo
  createdAt: getCurrentISODate(),
  updatedAt: getCurrentISODate(),
};

async function createActivities() {
  console.log('🚀 Iniciando creación de actividades CONSUDEC...\n');

  const activities = [activity1, activity2, activity3];

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];

    try {
      console.log(`📝 Creando: ${activity.title}`);

      await db.execute({
        sql: `
          INSERT INTO ConsudecActivity (
            id, title, description, caseText, questions,
            subject, difficulty, estimatedTime,
            status, availableFrom, availableUntil,
            createdBy, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          activity.id,
          activity.title,
          activity.description,
          activity.caseText,
          JSON.stringify(activity.questions),
          activity.subject || null,
          activity.difficulty,
          activity.estimatedTime,
          activity.status,
          null, // availableFrom
          null, // availableUntil
          activity.createdBy,
          activity.createdAt,
          activity.updatedAt,
        ],
      });

      console.log(`   ✅ Creada exitosamente (ID: ${activity.id})`);
      console.log(`   - Dificultad: ${activity.difficulty}`);
      console.log(`   - Tiempo estimado: ${activity.estimatedTime} min`);
      console.log(`   - Preguntas: ${activity.questions.length}`);
      console.log('');

    } catch (error) {
      console.error(`   ❌ Error al crear actividad ${i + 1}:`, error);
      throw error;
    }
  }

  console.log('✅ Las 3 actividades fueron creadas exitosamente!');
  console.log('\n📊 Resumen:');
  console.log('   - Caso 1: Diversidad en el Aula (Didáctica, Medio)');
  console.log('   - Caso 2: Resolución de Conflictos (Pedagogía, Difícil)');
  console.log('   - Caso 3: Motivación y Participación (Didáctica, Fácil)');
  console.log('\n🎓 Los estudiantes ya pueden acceder a estas actividades en la plataforma.');
}

createActivities()
  .then(() => {
    console.log('\n✨ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
