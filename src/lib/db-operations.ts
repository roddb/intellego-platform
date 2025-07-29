import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// User operations
export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email }
  });
}

export async function findUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id }
  });
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  studentId?: string;
}) {
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  return await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword
    }
  });
}

export async function validateUserPassword(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.password) return null;
  
  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
}

// Weekly Reports operations  
export async function createWeeklyReport(data: {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  answers: Array<{
    questionId: string;
    answer: string;
  }>;
}) {
  return await prisma.progressReport.create({
    data: {
      userId: data.userId,
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
      answers: {
        create: data.answers
      }
    },
    include: {
      answers: {
        include: {
          question: true
        }
      }
    }
  });
}

export async function findWeeklyReportsByUser(userId: string) {
  return await prisma.progressReport.findMany({
    where: { userId },
    include: {
      answers: {
        include: {
          question: true
        }
      }
    },
    orderBy: {
      weekStart: 'desc'
    }
  });
}

export async function findWeeklyReportByUserAndWeek(userId: string, weekStart: Date) {
  return await prisma.progressReport.findFirst({
    where: {
      userId,
      weekStart
    },
    include: {
      answers: {
        include: {
          question: true
        }
      }
    }
  });
}

export async function getAllWeeklyReports() {
  return await prisma.progressReport.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true
        }
      },
      answers: {
        include: {
          question: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });
}

// Questions operations
export async function getAllQuestions() {
  return await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });
}

// Date utility functions
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getCurrentWeekEnd(): Date {
  const weekStart = getCurrentWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

export async function canSubmitThisWeek(userId: string): Promise<boolean> {
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();
  const currentDate = new Date();
  
  const existingReport = await findWeeklyReportByUserAndWeek(userId, weekStart);
  const isCurrentWeek = currentDate >= weekStart && currentDate <= weekEnd;
  
  return isCurrentWeek && !existingReport;
}

// Export data functions
export async function exportReportsAsCSV() {
  const reports = await getAllWeeklyReports();
  
  const csvHeaders = [
    'Estudiante',
    'Email',
    'ID Estudiante', 
    'Semana Inicio',
    'Semana Fin',
    'Fecha Envío',
    'Pregunta',
    'Respuesta'
  ];
  
  const csvRows = [csvHeaders.join(',')];
  
  for (const report of reports) {
    for (const answer of report.answers) {
      const row = [
        `"${report.user.name || ''}"`,
        `"${report.user.email}"`,
        `"${report.user.studentId || ''}"`,
        `"${report.weekStart.toISOString().split('T')[0]}"`,
        `"${report.weekEnd.toISOString().split('T')[0]}"`,
        `"${report.submittedAt.toISOString().split('T')[0]}"`,
        `"${answer.question.text}"`,
        `"${answer.answer.replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }
  }
  
  return csvRows.join('\n');
}

export async function exportReportsAsMarkdown() {
  const reports = await getAllWeeklyReports();
  
  let markdown = '# Reportes de Progreso Semanal\n\n';
  
  for (const report of reports) {
    markdown += `## ${report.user.name} (${report.user.email})\n`;
    markdown += `**ID Estudiante:** ${report.user.studentId || 'N/A'}\n`;
    markdown += `**Semana:** ${report.weekStart.toISOString().split('T')[0]} - ${report.weekEnd.toISOString().split('T')[0]}\n`;
    markdown += `**Fecha de Envío:** ${report.submittedAt.toISOString().split('T')[0]}\n\n`;
    
    for (const answer of report.answers) {
      markdown += `### ${answer.question.text}\n\n`;
      markdown += `${answer.answer}\n\n`;
    }
    
    markdown += '---\n\n';
  }
  
  return markdown;
}