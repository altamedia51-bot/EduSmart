
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface ReportSettings {
  schoolName: string;
  period: string;
  city: string;
  signatoryTitle: string;
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  email: string;
  class: string;
  grades: Record<string, number>;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  kkm?: number;
  duration: number; // minutes
  questions: Question[];
  active: boolean;
  targetClasses?: string[];
}

export interface ExamResult {
  studentId: string;
  examId: string;
  score: number;
  cheated: boolean;
  timestamp: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
}

export interface Submission {
  id: string;
  studentId: string;
  subject: string;
  description: string;
  timestamp: number;
  score?: number;
  status: 'PENDING' | 'GRADED';
}

export interface AppState {
  userRole: UserRole;
  students: Student[];
  exams: Exam[];
  results: ExamResult[];
  assignments: Assignment[];
  submissions: Submission[];
  reportSettings: ReportSettings;
}
