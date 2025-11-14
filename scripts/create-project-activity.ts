/**
 * Script para crear una actividad tipo "project" de ejemplo
 * Proyecto: "Diseño de Secuencia Didáctica en Biofísica"
 *
 * Este tipo de actividad usa las 5 preguntas reflexivas estándar:
 * 1. Descripción del proyecto
 * 2. Estrategias didácticas
 * 3. Dificultades y abordaje
 * 4. Aprendizajes clave
 * 5. Aplicación práctica
 *
 * Run: npx tsx scripts/create-project-activity.ts
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing Turso credentials in .env');
  process.exit(1);
}

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

function generateId(): string {
  return 'act_' + Math.random().toString(36).substring(2, 15);
}

function getCurrentISODate(): string {
  return new Date().toISOString();
}

/**
 * Standard question IDs for all project activities
 * These must match the IDs in /api/consudec/projects/route.ts
 */
const PROJECT_QUESTIONS = [
  {
    id: 'q_descripcion',
    text: 'Descripción del trabajo realizado',
    placeholder:
      'Describe detalladamente el proyecto o trabajo práctico que desarrollaste. Incluye objetivos, metodología y resultados obtenidos.\n\nEjemplo: Desarrollé una secuencia didáctica para enseñar el concepto de energía en 5to año. El objetivo fue que los estudiantes comprendieran las transformaciones energéticas mediante experimentos prácticos...',
    wordLimit: 300,
    questionType: 'text' as const,
    rubric: {
      excellent:
        'Descripción completa y estructurada del proyecto con objetivos claros, metodología detallada y resultados concretos. Evidencia planificación rigurosa.',
      good: 'Descripción clara del proyecto con la mayoría de componentes (objetivos, metodología, resultados). Buena organización.',
      satisfactory:
        'Descripción básica del proyecto pero falta detalle en algún componente (objetivos, metodología o resultados).',
      insufficient:
        'Descripción vaga o incompleta. No queda claro qué se hizo ni con qué propósito.',
    },
  },
  {
    id: 'q_estrategias',
    text: 'Estrategias didácticas implementadas',
    placeholder:
      '¿Qué estrategias didácticas específicas utilizaste? ¿Cómo organizaste las actividades y el tiempo? ¿Qué recursos empleaste?\n\nEjemplo: Utilicé el aprendizaje basado en problemas (ABP). Dividí la clase en grupos de 4 estudiantes y les presenté un desafío real. Empleé videos, simulaciones digitales y experimentos prácticos...',
    wordLimit: 300,
    questionType: 'text' as const,
    rubric: {
      excellent:
        'Identifica estrategias didácticas específicas con fundamentación pedagógica. Explica claramente organización temporal y recursos. Evidencia reflexión sobre las decisiones tomadas.',
      good: 'Menciona estrategias didácticas concretas y recursos utilizados. Describe organización de actividades.',
      satisfactory:
        'Menciona algunas estrategias o recursos pero sin suficiente detalle o fundamentación.',
      insufficient:
        'No especifica estrategias didácticas o las menciona de manera muy general sin conexión con el proyecto.',
    },
  },
  {
    id: 'q_dificultades',
    text: 'Dificultades encontradas y cómo las abordaste',
    placeholder:
      'Reflexiona sobre los obstáculos que enfrentaste durante el desarrollo del trabajo. ¿Cómo los resolviste? ¿Qué ajustes realizaste?\n\nEjemplo: La principal dificultad fue mantener la atención del grupo durante toda la clase. Algunos estudiantes se dispersaban. Decidí acortar las explicaciones teóricas e incorporar más actividades prácticas cada 15 minutos...',
    wordLimit: 300,
    questionType: 'text' as const,
    rubric: {
      excellent:
        'Identifica dificultades específicas con análisis reflexivo. Explica estrategias de resolución concretas y ajustes realizados. Evidencia aprendizaje del proceso.',
      good: 'Menciona dificultades encontradas y describe cómo las abordó. Muestra capacidad de adaptación.',
      satisfactory:
        'Menciona algunas dificultades pero sin profundizar en cómo las resolvió o qué aprendió.',
      insufficient:
        'No identifica dificultades de manera significativa o responde de forma muy superficial.',
    },
  },
  {
    id: 'q_aprendizajes',
    text: 'Aprendizajes clave de esta experiencia',
    placeholder:
      '¿Qué aprendiste sobre la enseñanza y el aprendizaje a partir de esta experiencia? ¿Qué descubrimientos hiciste sobre tu práctica docente?\n\nEjemplo: Comprendí la importancia de variar las estrategias de enseñanza para mantener el engagement. También descubrí que los estudiantes aprenden mejor cuando pueden relacionar los conceptos con situaciones cotidianas...',
    wordLimit: 300,
    questionType: 'text' as const,
    rubric: {
      excellent:
        'Reflexión profunda sobre aprendizajes pedagógicos y didácticos. Conecta experiencia con teoría educativa. Evidencia crecimiento profesional y visión crítica.',
      good: 'Identifica aprendizajes claros sobre enseñanza y aprendizaje. Muestra reflexión sobre la experiencia.',
      satisfactory:
        'Menciona algunos aprendizajes pero sin profundizar en su significado o implicancias.',
      insufficient:
        'No identifica aprendizajes significativos o responde de manera muy general.',
    },
  },
  {
    id: 'q_aplicacion',
    text: 'Aplicación en tu futura práctica docente',
    placeholder:
      '¿Cómo aplicarás lo aprendido en tu futura práctica docente? ¿Qué aspectos incorporarás o mejorarás?\n\nEjemplo: Incorporaré más actividades experimentales en mis clases de Biofísica. Planificaré módulos de 15 minutos alternando teoría y práctica. Crearé un banco de situaciones problemáticas reales para motivar el aprendizaje...',
    wordLimit: 300,
    questionType: 'text' as const,
    rubric: {
      excellent:
        'Propone aplicaciones concretas y viables basadas en la experiencia. Evidencia capacidad de transferir aprendizajes a nuevos contextos. Muestra compromiso con mejora continua.',
      good: 'Menciona aplicaciones claras para futura práctica. Conecta aprendizajes con acciones específicas.',
      satisfactory:
        'Menciona algunas aplicaciones pero de manera general o poco específica.',
      insufficient:
        'No propone aplicaciones concretas o responde de forma muy vaga.',
    },
  },
];

const projectActivity = {
  id: generateId(),
  title: 'Proyecto Didáctico: Diseño de Secuencia para Enseñar Bioelectricidad',
  description:
    'Trabajo práctico reflexivo sobre el diseño e implementación de una secuencia didáctica en Biofísica. Análisis de estrategias, dificultades y aprendizajes obtenidos.',
  caseText: `**DESCRIPCIÓN DEL PROYECTO**

Este trabajo práctico consiste en el diseño, implementación y reflexión sobre una secuencia didáctica para enseñar un tema de Bioelectricidad a estudiantes de nivel medio o universitario.

El proyecto debe incluir:

1. **Planificación didáctica**: Objetivos de aprendizaje, contenidos conceptuales y procedimentales, estrategias de enseñanza, recursos didácticos y evaluación.

2. **Implementación**: Llevar a cabo la secuencia con un grupo real de estudiantes (puede ser en práctica docente, clases particulares, talleres, etc.).

3. **Reflexión pedagógica**: Análisis crítico de la experiencia, identificando fortalezas, dificultades, ajustes realizados y aprendizajes obtenidos.

**Tema sugerido**: Puedes elegir cualquier tema relacionado con Bioelectricidad, por ejemplo:
- Potencial de reposo y potencial de acción
- Conducción nerviosa y mielinización
- Transmisión sináptica
- Electrocardiografía
- Electrofisiología muscular

**Objetivo formativo**: Desarrollar competencias para diseñar, implementar y reflexionar sobre propuestas de enseñanza fundamentadas en principios didácticos y pedagógicos, con foco en el pensamiento crítico y la mejora continua de la práctica docente.`,
  subject: 'Didáctica de la Biofísica',
  difficulty: 'medium' as const,
  estimatedTime: 90,
  activityType: 'project' as const,
  status: 'active' as const,
  questions: PROJECT_QUESTIONS,
};

async function main() {
  console.log('🚀 Creando actividad tipo "project" para CONSUDEC...\n');

  try {
    // Obtener instructor ID
    const instructors = await db.execute({
      sql: 'SELECT id FROM User WHERE role = ? LIMIT 1',
      args: ['INSTRUCTOR'],
    });

    if (instructors.rows.length === 0) {
      console.error('❌ No se encontró ningún instructor en la base de datos');
      process.exit(1);
    }

    const instructorId = (instructors.rows[0] as unknown as { id: string }).id;
    console.log(`👤 Instructor ID: ${instructorId}\n`);

    const now = getCurrentISODate();

    // Insertar actividad
    await db.execute({
      sql: `INSERT INTO ConsudecActivity (
        id, title, description, caseText, questions, subject, difficulty, estimatedTime,
        activityType, status, createdBy, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        projectActivity.id,
        projectActivity.title,
        projectActivity.description,
        projectActivity.caseText,
        JSON.stringify(projectActivity.questions),
        projectActivity.subject,
        projectActivity.difficulty,
        projectActivity.estimatedTime,
        projectActivity.activityType,
        projectActivity.status,
        instructorId,
        now,
        now,
      ],
    });

    console.log(`✅ Actividad creada exitosamente!`);
    console.log(`   ID: ${projectActivity.id}`);
    console.log(`   Título: ${projectActivity.title}`);
    console.log(`   Tipo: ${projectActivity.activityType}`);
    console.log(`   Preguntas: ${projectActivity.questions.length}`);
    console.log(`   Tiempo estimado: ${projectActivity.estimatedTime} minutos`);
    console.log('\n📝 Esta actividad usa las 5 preguntas reflexivas estándar:');
    projectActivity.questions.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.text} (ID: ${q.id})`);
    });
    console.log(
      '\n🔗 Los estudiantes pueden acceder mediante ProjectSubmissionForm'
    );
    console.log(`   que enviará datos a: POST /api/consudec/projects`);
  } catch (error: unknown) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
