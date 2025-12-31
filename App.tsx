
import React, { useState, useEffect } from 'react';
import { UserRole, AppState, Student } from './types.ts';
import { TeacherDashboard } from './components/TeacherDashboard.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { ReportGenerator } from './components/ReportGenerator.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';

const INITIAL_STATE: AppState = {
  userRole: null as any,
  students: [
    { id: '1', name: 'Alex Thompson', nis: '12345', email: 'alex@edu.com', class: 'XII MIPA 1', grades: { 'Math': 95, 'Science': 88, 'English': 92 } },
    { id: '2', name: 'Sarah Miller', nis: '12346', email: 'sarah@edu.com', class: 'XII MIPA 2', grades: { 'Math': 75, 'Science': 82, 'English': 85 } }
  ],
  exams: [
    { 
      id: 'e1', title: 'Calculus Advanced Quiz', subject: 'Math', duration: 45, active: true, kkm: 75,
      questions: [{ id: 'q1', text: 'Selesaikan integral dari sin(x)', options: ['-cos(x)', 'cos(x)', 'tan(x)', 'sec(x)'], correctAnswer: 0 }],
      targetClasses: ['XII MIPA 1', 'XII MIPA 2']
    }
  ],
  results: [
    { studentId: '1', examId: 'e-prev', score: 92, cheated: false, timestamp: Date.now() - 86400000 },
    { studentId: '1', examId: 'e-prev2', score: 85, cheated: false, timestamp: Date.now() - 172800000 },
    { studentId: '2', examId: 'e-prev', score: 78, cheated: false, timestamp: Date.now() - 86400000 },
  ],
  assignments: [
    { id: 'a1', title: 'Laporan Lab Biologi', description: 'Kumpulkan sebelum Jumat', deadline: '20 Mei 2024' }
  ],
  submissions: [],
  reportSettings: {
    schoolName: 'SMADA GENIUS',
    period: 'Semester Ganjil 2024',
    city: 'Semarang',
    signatoryTitle: 'Wali Kelas'
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('edu_smart_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [currentRole, setCurrentRole] = useState<UserRole | null>(() => {
    return (localStorage.getItem('edu_smart_role') as UserRole) || null;
  });
  
  const [loggedStudentId, setLoggedStudentId] = useState<string | null>(() => {
    return localStorage.getItem('edu_smart_student_id') || null;
  });

  useEffect(() => {
    localStorage.setItem('edu_smart_state', JSON.stringify(state));
  }, [state]);

  const handleLogin = (role: UserRole, student?: Student) => {
    setCurrentRole(role);
    localStorage.setItem('edu_smart_role', role);
    if (student) {
      setLoggedStudentId(student.id);
      localStorage.setItem('edu_smart_student_id', student.id);
    }
  };

  const updateState = (newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setLoggedStudentId(null);
    localStorage.removeItem('edu_smart_role');
    localStorage.removeItem('edu_smart_student_id');
  };

  if (!currentRole) {
    return <LoginScreen onLogin={handleLogin} students={state.students} />;
  }

  // Get current logged in student object for student dashboard
  const currentStudent = loggedStudentId ? state.students.find(s => s.id === loggedStudentId) : null;

  return (
    <div className={`min-h-screen flex flex-col ${currentRole === UserRole.TEACHER ? 'bg-[#f8f9fd]' : 'bg-blue-50/30'}`}>
      <nav className="bg-white px-8 py-4 flex justify-between items-center no-print border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5b59e5] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0v6m0 0l4 2.22a.45.45 0 010 .78L12 21l-4-2.22a.45.45 0 010-.78L12 20z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-black text-[#1e293b] tracking-tight block leading-none uppercase">SMADA GENIUS</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Sistem Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-[#1e293b] leading-none mb-1 uppercase">
              {currentRole === UserRole.TEACHER ? 'ADMIN GURU' : (currentStudent?.name || 'SISWA')}
            </p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              {currentRole === UserRole.TEACHER ? 'EDUCATOR ACCESS' : `KELAS ${currentStudent?.class || '-'}`}
            </p>
          </div>
          <button 
            onClick={handleLogout} 
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
          >
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Keluar</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl animate-in fade-in">
        {currentRole === UserRole.TEACHER ? (
          <TeacherDashboard state={{ ...state, userRole: currentRole }} onUpdate={updateState} />
        ) : (
          <StudentDashboard state={{ ...state, userRole: currentRole }} onUpdate={updateState} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-6 text-center no-print">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">&copy; 2024 SMADA GENIUS - SMART SCHOOL MANAGEMENT SYSTEM</p>
      </footer>

      {currentRole === UserRole.TEACHER && state.students.length > 0 && (
          <div className="print-only">
             <ReportGenerator 
               student={state.students[0]} 
               settings={state.reportSettings} 
               results={state.results}
               submissions={state.submissions}
               exams={state.exams}
             />
          </div>
      )}
    </div>
  );
};

export default App;
