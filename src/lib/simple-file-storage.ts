import fs from 'fs';
import path from 'path';

// Base directory for student reports
const REPORTS_BASE_DIR = path.join(process.cwd(), 'data', 'student-reports');

// Utility function to create directory if it doesn't exist
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Utility function to sanitize folder names
function sanitizeFolderName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\-\_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Create student folder name from student data
function createStudentFolderName(studentId: string, studentName: string): string {
  const sanitizedName = sanitizeFolderName(studentName || 'sin-nombre');
  return `${studentId}_${sanitizedName}`;
}

// Save student report as JSON file
export async function saveStudentReportAsJSON(studentData: {
  id: string;
  name: string;
  email: string;
  studentId: string;
  sede?: string;
  academicYear?: string;
  division?: string;
}, reportData: {
  subject: string;
  weekStart: Date;
  weekEnd: Date;
  submittedAt: Date;
  answers: {
    temasYDominio: string;
    evidenciaAprendizaje: string;
    dificultadesEstrategias: string;
    conexionesAplicacion: string;
    comentariosAdicionales?: string;
  };
}): Promise<string> {
  try {
    console.log(`📁 Iniciando guardado de reporte JSON para: ${studentData.name} (${reportData.subject})`);
    
    // Validate required academic data
    if (!studentData.sede || !studentData.academicYear || !studentData.division) {
      throw new Error(`Datos académicos incompletos: sede=${studentData.sede}, año=${studentData.academicYear}, división=${studentData.division}`);
    }
    
    // Ensure base directory exists
    ensureDirectoryExists(REPORTS_BASE_DIR);
    console.log(`📂 Directorio base verificado: ${REPORTS_BASE_DIR}`);
    
    // Create hierarchical folder structure: sede/año/división/materia/estudiante
    let folderPath = REPORTS_BASE_DIR;
    
    // Add sede folder
    folderPath = path.join(folderPath, sanitizeFolderName(studentData.sede));
    ensureDirectoryExists(folderPath);
    console.log(`🏫 Carpeta sede creada: ${folderPath}`);
    
    // Add academic year folder  
    folderPath = path.join(folderPath, sanitizeFolderName(studentData.academicYear));
    ensureDirectoryExists(folderPath);
    console.log(`📅 Carpeta año creada: ${folderPath}`);
    
    // Add division folder
    folderPath = path.join(folderPath, studentData.division);
    ensureDirectoryExists(folderPath);
    console.log(`🎓 Carpeta división creada: ${folderPath}`);
    
    // Add subject folder
    if (reportData.subject) {
      folderPath = path.join(folderPath, sanitizeFolderName(reportData.subject));
      ensureDirectoryExists(folderPath);
      console.log(`📚 Carpeta materia creada: ${folderPath}`);
    }
    
    // Create student folder name and final path
    const studentFolderName = createStudentFolderName(studentData.studentId || studentData.id, studentData.name || '');
    const studentFolderPath = path.join(folderPath, studentFolderName);
    ensureDirectoryExists(studentFolderPath);
    console.log(`👤 Carpeta estudiante creada: ${studentFolderPath}`);
    
    // Create filename with date and subject format YYYY-MM-DD_subject_reporte.json
    const reportDate = reportData.weekStart.toISOString().split('T')[0];
    const fileName = `${reportDate}_${sanitizeFolderName(reportData.subject)}_reporte.json`;
    const filePath = path.join(studentFolderPath, fileName);
    console.log(`📄 Archivo a crear: ${filePath}`);
    
    // Create JSON data structure
    const jsonData = {
      student: {
        id: studentData.studentId || studentData.id,
        name: studentData.name,
        email: studentData.email
      },
      academic: {
        sede: studentData.sede,
        year: studentData.academicYear,
        division: studentData.division,
        subject: reportData.subject
      },
      week: {
        start: reportData.weekStart.toISOString().split('T')[0],
        end: reportData.weekEnd.toISOString().split('T')[0]
      },
      submittedAt: reportData.submittedAt.toISOString(),
      answers: {
        temasYDominio: reportData.answers.temasYDominio,
        evidenciaAprendizaje: reportData.answers.evidenciaAprendizaje,
        dificultadesEstrategias: reportData.answers.dificultadesEstrategias,
        conexionesAplicacion: reportData.answers.conexionesAplicacion,
        comentariosAdicionales: reportData.answers.comentariosAdicionales || ''
      }
    };
    
    // Write JSON file
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    
    console.log(`✅ Reporte JSON guardado exitosamente: ${filePath}`);
    return filePath;
    
  } catch (error) {
    console.error('❌ Error detallado guardando reporte JSON:', error);
    console.error('📋 Datos del estudiante:', studentData);
    console.error('📊 Datos del reporte:', { ...reportData, answers: 'HIDDEN' });
    throw new Error(`Failed to save report: ${error}`);
  }
}

// Get all reports for a specific student
export function getStudentReports(studentId: string, studentName: string): any[] {
  try {
    const studentFolderName = createStudentFolderName(studentId, studentName);
    const studentFolderPath = path.join(REPORTS_BASE_DIR, studentFolderName);
    
    if (!fs.existsSync(studentFolderPath)) {
      return [];
    }
    
    const files = fs.readdirSync(studentFolderPath)
      .filter(file => file.endsWith('.json') && file.includes('_reporte.json'))
      .sort()
      .reverse(); // Most recent first
    
    const reports = files.map(file => {
      const filePath = path.join(studentFolderPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    });
    
    return reports;
    
  } catch (error) {
    console.error('❌ Error getting student reports:', error);
    return [];
  }
}

// List all student folders
export function getAllStudentFolders(): string[] {
  try {
    if (!fs.existsSync(REPORTS_BASE_DIR)) {
      return [];
    }
    
    return fs.readdirSync(REPORTS_BASE_DIR)
      .filter(item => {
        const itemPath = path.join(REPORTS_BASE_DIR, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .sort();
      
  } catch (error) {
    console.error('❌ Error getting student folders:', error);
    return [];
  }
}