// Types for the evaluation system with exam retroalimentaciones

export interface Evaluation {
  id: string;
  studentId: string;
  subject: string;
  examDate: string;
  examTopic: string;
  score: number;
  feedback: string; // Markdown content
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  instructorName?: string;
  instructorEmail?: string;
}

export interface EvaluationListItem {
  id: string;
  subject: string;
  examDate: string;
  examTopic: string;
  score: number;
  createdAt: string;
}
