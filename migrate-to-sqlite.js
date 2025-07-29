#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Starting migration from temp-storage to SQLite...');

  try {
    // Create demo users
    console.log('👤 Creating demo users...');
    
    const hashedPassword = await bcrypt.hash("Estudiante123!!!", 12);
    
    // Create student user
    const student = await prisma.user.upsert({
      where: { email: 'estudiante@demo.com' },
      update: {},
      create: {
        id: 'demo-student-fixed',
        name: 'Estudiante Demo',
        email: 'estudiante@demo.com',
        password: hashedPassword,
        role: 'STUDENT',
        studentId: 'EST-2025-001',
        status: 'ACTIVE',
        enrollmentYear: 2025,
        academicYear: '2025-2026',
        program: 'Ingeniería en Sistemas',
        phoneNumber: '+1234567890',
        dateOfBirth: new Date('2000-01-01'),
        address: 'Demo Address 123',
        emergencyContact: {
          name: 'Contacto Demo',
          phone: '+0987654321',
          relationship: 'Padre'
        }
      }
    });
    
    console.log('✅ Student user created:', student.email);

    // Create instructor user  
    const instructor = await prisma.user.upsert({
      where: { email: 'instructor@demo.com' },
      update: {},
      create: {
        id: 'demo-instructor-fixed',
        name: 'Instructor Demo',
        email: 'instructor@demo.com',
        password: await bcrypt.hash("123456", 12),
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
        enrollmentYear: 2025,
        academicYear: '2025-2026'
      }
    });

    console.log('✅ Instructor user created:', instructor.email);

    // Create default questions
    console.log('❓ Creating default questions...');
    
    const questions = [
      {
        id: 'q1',
        text: '¿Qué temas estudiaste esta semana y cuál es tu nivel de dominio en cada uno? (Nivel 1: Básico, Nivel 2: Intermedio, Nivel 3: Avanzado)',
        type: 'TEXTAREA',
        order: 1,
        required: true
      },
      {
        id: 'q2', 
        text: '¿Qué evidencia puedes mostrar de tu aprendizaje? (proyectos, ejercicios resueltos, experimentos, etc.)',
        type: 'TEXTAREA',
        order: 2,
        required: true
      },
      {
        id: 'q3',
        text: '¿Qué dificultades encontraste esta semana y qué estrategias usaste para resolverlas?',
        type: 'TEXTAREA', 
        order: 3,
        required: true
      },
      {
        id: 'q4',
        text: '¿Cómo se conecta lo que aprendiste con conceptos previos o aplicaciones reales?',
        type: 'TEXTAREA',
        order: 4,
        required: true
      },
      {
        id: 'q5',
        text: 'Comentarios adicionales (opcional)',
        type: 'TEXTAREA',
        order: 5,
        required: false
      }
    ];

    for (const question of questions) {
      await prisma.question.upsert({
        where: { id: question.id },
        update: {},
        create: question
      });
    }

    console.log('✅ Default questions created');

    // Create sample progress reports
    console.log('📝 Creating sample progress reports...');
    
    const now = new Date();
    
    // Calculate current week dates
    const getCurrentWeekStart = () => {
      const monday = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const getCurrentWeekEnd = () => {
      const weekStart = getCurrentWeekStart();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return weekEnd;
    };

    const currentWeek = getCurrentWeekStart();
    const currentWeekEnd = getCurrentWeekEnd();
    
    // Previous week
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    const prevWeekEnd = new Date(currentWeekEnd);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
    
    // Sample report from previous week
    const report1 = await prisma.progressReport.create({
      data: {
        id: 'sample-report-1',
        userId: student.id,
        weekStart: prevWeek,
        weekEnd: prevWeekEnd,
        submittedAt: new Date(prevWeekEnd.getTime() - 24 * 60 * 60 * 1000),
        answers: {
          create: [
            {
              questionId: 'q1',
              answer: 'Esta semana trabajamos con JavaScript básico - Nivel 3: Domino funciones y arrays, y estoy aprendiendo objetos complejos.'
            },
            {
              questionId: 'q2', 
              answer: 'Completé un proyecto de To-Do List usando JavaScript vanilla. Implementé funciones para agregar, editar y eliminar tareas usando arrays y objetos.'
            },
            {
              questionId: 'q3',
              answer: 'Tuve dificultades con el manejo de eventos en JavaScript. Lo resolví practicando con ejemplos y consultando documentación de MDN.'
            },
            {
              questionId: 'q4',
              answer: 'Los conceptos de eventos se conectan con la interactividad en aplicaciones web. Puedo aplicarlo para crear interfaces más dinámicas.'
            },
            {
              questionId: 'q5',
              answer: 'Me siento más confiado con JavaScript. Quiero seguir practicando con proyectos más complejos.'
            }
          ]
        }
      }
    });

    console.log('✅ Sample report 1 created');

    // Two weeks ago report
    const twoWeeksAgo = new Date(currentWeek);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoEnd = new Date(currentWeekEnd);
    twoWeeksAgoEnd.setDate(twoWeeksAgoEnd.getDate() - 14);
    
    const report2 = await prisma.progressReport.create({
      data: {
        id: 'sample-report-2', 
        userId: student.id,
        weekStart: twoWeeksAgo,
        weekEnd: twoWeeksAgoEnd,
        submittedAt: new Date(twoWeeksAgoEnd.getTime() - 12 * 60 * 60 * 1000),
        answers: {
          create: [
            {
              questionId: 'q1',
              answer: 'Esta semana estudiamos CSS Grid y Flexbox - Nivel 2: Entiendo los conceptos básicos pero aún tengo dudas con layouts complejos.'
            },
            {
              questionId: 'q2',
              answer: 'Recreé el layout de una página web usando CSS Grid. Logré hacer una estructura responsive con header, sidebar y main content.'
            },
            {
              questionId: 'q3', 
              answer: 'Me confundí con las propiedades grid-template-areas. Resolví el problema dibujando el layout en papel primero.'
            },
            {
              questionId: 'q4',
              answer: 'CSS Grid es perfecto para crear layouts de páginas web modernas. Lo usaré en mi proyecto final de página portfolio.'
            },
            {
              questionId: 'q5',
              answer: 'CSS es más divertido de lo que pensaba. Me gusta ver los resultados visuales inmediatos.'
            }
          ]
        }
      }
    });

    console.log('✅ Sample report 2 created');

    console.log('🎯 Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users created: 2 (1 student, 1 instructor)`);
    console.log(`   - Questions created: 5`);
    console.log(`   - Progress reports created: 2`);
    console.log(`   - Database location: ./data/intellego.db`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });