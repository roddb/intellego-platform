// Types for the feedback system with skills metrics

export interface SkillsMetrics {
  comprehension: number;        // Comprensión Conceptual (0-100)
  criticalThinking: number;     // Pensamiento Crítico (0-100)
  selfRegulation: number;       // Autorregulación (0-100)
  practicalApplication: number; // Aplicación Práctica (0-100)
  metacognition: number;        // Reflexión Metacognitiva (0-100)
}

export interface Feedback {
  id: string;
  studentId: string;
  progressReportId?: string;
  weekStart: string;
  subject: string;
  score?: number;
  generalComments?: string;
  strengths?: string[];
  improvements?: string[];
  aiAnalysis?: string;
  skillsMetrics?: SkillsMetrics; // New field for radar chart
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillsProgress {
  id: string;
  studentId: string;
  subject: string;
  comprehension: number;
  criticalThinking: number;
  selfRegulation: number;
  practicalApplication: number;
  metacognition: number;
  totalFeedbacks: number;
  lastCalculated: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackUploadData {
  studentId: string;
  studentName: string;
  subject: string;
  weekStart: string;
  weekEnd: string;
  score?: number;
  generalComments?: string;
  strengths?: string[];
  improvements?: string[];
  aiAnalysis?: string;
  skillsMetrics?: SkillsMetrics; // Added for upload
}