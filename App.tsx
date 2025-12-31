
import React, { useState, useEffect } from 'react';
import { UserRole, AppState } from './types';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ReportGenerator } from './components/ReportGenerator';
import { LoginScreen } from './components/LoginScreen';

const INITIAL_STATE: AppState = {
  userRole: null as any,
  students: [
    { id: 'demo-student', name: 'Alex Thompson', nis: '12345', email: 'alex@edu.com', class: 'XII MIPA 1', grades: { 'Math': 95, 'Science': 88, 'English': 92 } },
    { id: '2', name: 'Sarah Miller', nis: '12346', email: 'sarah@edu.com', class: 'XII MIPA 2', grades: { 'Math': 75, 'Science': 82, 'English': 85 } }
  ],
  exams: [
    { 
      id: 'e1', title: 'Calculus Advanced Quiz', subject: 'Math', duration: 45, active: true,
      questions: [{ id: 'q1', text: 'Solve integral of sin(x)', options: ['-cos(x)', 'cos(x)', 'tan(x)', 'sec(x)'], correctAnswer: 0 }]
    }
  ],
  results: [
    { studentId: 'demo-student', examId: 'e-prev', score: 92, cheated: false, timestamp: Date.now() - 86400000 },
    { studentId: 'demo-student', examId: 'e-prev2', score: 85, cheated: false, timestamp: Date.now() - 172800000 },
    { studentId: '2', examId: 'e-prev', score: 78, cheated: false, timestamp: Date.now() - 86400000 },
  ],
  assignments: [
    { id: 'a1', title: 'Biology Lab Report', description: 'Due by Friday', deadline: 'May 20, 2024' }
  ]
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('edu_smart_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  useEffect(() => {
    localStorage.setItem('edu_smart_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateState = (newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const handleLogout = () => {
    setCurrentRole(null);
  };

  if (!currentRole) {
    return <LoginScreen onSelectRole={setCurrentRole} />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${currentRole === UserRole.TEACHER ? 'bg-[#f8f9fd]' : 'bg-blue-50/30'}`}>
      {/* Top Header Branding */}
      <nav className="bg-white px-8 py-4 flex justify-between items-center no-print border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5b59e5] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0v6m0 0l4 2.22a.45.45 0 010 .78L12 21l-4-2.22a.45.45 0 010-.78L12 20z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-black text-[#1e293b] tracking-tight block leading-none">SMADA GENIUS</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Database Cloud Aktif</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-black text-[#1e293b] leading-none mb-1">S</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Teacher</p>
          </div>
          <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
        {currentRole === UserRole.TEACHER ? (
          <TeacherDashboard state={{ ...state, userRole: currentRole }} onUpdate={updateState} />
        ) : (
          <StudentDashboard state={{ ...state, userRole: currentRole }} onUpdate={updateState} />
        )}
      </main>

      {/* Hidden Print Generator */}
      {currentRole === UserRole.TEACHER && (
          <div className="print-only">
             <ReportGenerator student={state.students[0]} />
          </div>
      )}
    </div>
  );
};

export default App;
