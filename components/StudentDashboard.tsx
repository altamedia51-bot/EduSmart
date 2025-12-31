
import React, { useState } from 'react';
import { AppState, Exam, ExamResult } from '../types';
import { ExamModule } from './ExamModule';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StudentDashboardProps {
  state: AppState;
  onUpdate: (newState: Partial<AppState>) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ state, onUpdate }) => {
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  const handleFinishExam = (result: ExamResult) => {
    onUpdate({ results: [...state.results, result] });
    setActiveExam(null);
    alert(`Ujian selesai! Skor Anda: ${result.score.toFixed(1)}%`);
  };

  const studentResults = state.results.filter(r => r.studentId === 'demo-student');
  const avgScore = studentResults.length > 0 ? studentResults.reduce((acc, r) => acc + r.score, 0) / studentResults.length : 0;

  const topResults = [...state.results]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(r => ({
      name: state.students.find(s => s.id === r.studentId)?.name || 'Siswa Edu',
      score: r.score
    }));

  if (activeExam) {
    return <ExamModule exam={activeExam} studentId="demo-student" onFinish={handleFinishExam} onCancel={() => setActiveExam(null)} />;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="xl:col-span-2 space-y-8">
        {/* Banner Card */}
        <header className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200">
          <div className="relative z-10">
            <h1 className="text-4xl font-black mb-3">Semangat Belajar, Alex! 🚀</h1>
            <p className="text-indigo-100 text-lg font-medium mb-10 max-w-md">Ada 2 ujian aktif hari ini. Jangan lupa untuk tetap fokus dan jujur.</p>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20">
                <p className="text-[10px] uppercase font-black text-indigo-200 tracking-widest mb-1">Rerata Nilai</p>
                <p className="text-3xl font-black">{avgScore.toFixed(0)}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20">
                <p className="text-[10px] uppercase font-black text-indigo-200 tracking-widest mb-1">Tuntas</p>
                <p className="text-3xl font-black">12/15</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20">
                <p className="text-[10px] uppercase font-black text-indigo-200 tracking-widest mb-1">Peringkat</p>
                <p className="text-3xl font-black">#4</p>
              </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl"></div>
        </header>

        {/* Exams List */}
        <section>
          <div className="flex justify-between items-center mb-6 px-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ujian Tersedia</h2>
            <button className="text-blue-600 text-sm font-black uppercase tracking-widest hover:underline">Riwayat</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.exams.filter(e => e.active).map(exam => (
              <div key={exam.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white hover:shadow-2xl transition-all duration-300 group">
                <div className="flex justify-between items-center mb-8">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <span className="text-xs font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">{exam.duration}m</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{exam.title}</h3>
                <p className="text-slate-400 font-bold text-sm mb-8">{exam.subject} Quiz</p>
                <button 
                  onClick={() => setActiveExam(exam)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-600 shadow-xl shadow-slate-100 transition-all active:scale-95"
                >
                  MULAI UJIAN
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Chart Card */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Grafik Perkembangan</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentResults.map((r, i) => ({ name: `Quiz ${i+1}`, score: r.score }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc', radius: 10}}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                />
                <Bar dataKey="score" radius={[12, 12, 12, 12]} barSize={40}>
                  {studentResults.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Side Content */}
      <div className="space-y-8">
        <section className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Leaderboard</h2>
          </div>
          <div className="space-y-4">
            {topResults.map((rank, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-2xl font-black text-sm shadow-sm ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  <p className="font-black text-slate-700 group-hover:text-blue-600 transition-colors">{rank.name}</p>
                </div>
                <span className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl text-xs">{rank.score.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tugas Masuk</h2>
          </div>
          <div className="space-y-4">
            {state.assignments.map(a => (
              <div key={a.id} className="p-6 border-2 border-slate-50 rounded-3xl bg-slate-50/50 group cursor-pointer hover:border-indigo-400 hover:bg-white transition-all shadow-sm">
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-1">{a.deadline}</p>
                <h4 className="font-black text-slate-800 group-hover:text-indigo-600 leading-tight">{a.title}</h4>
                <div className="flex items-center gap-2 mt-4 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-xs font-bold uppercase tracking-wider">Tenggat Segera</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
