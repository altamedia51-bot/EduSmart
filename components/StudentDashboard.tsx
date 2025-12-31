
import React, { useState } from 'react';
import { AppState, Exam, ExamResult, Submission } from '../types.ts';
import { ExamModule } from './ExamModule.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StudentDashboardProps {
  state: AppState;
  onUpdate: (newState: Partial<AppState>) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ state, onUpdate }) => {
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'beranda' | 'statistik'>('beranda');
  const [leaderboardTab, setLeaderboardTab] = useState<'sekolah' | 'kelas' | 'top'>('sekolah');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  // State for assignment submission form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // Mendapatkan data siswa yang sedang login (demo)
  const currentStudent = state.students.find(s => s.id === 'demo-student') || state.students[0];
  const studentResults = state.results.filter(r => r.studentId === currentStudent.id);
  const activeExams = state.exams.filter(e => e.active);
  const studentSubmissions = state.submissions.filter(s => s.studentId === currentStudent.id);

  const handleStartExam = (exam: Exam) => {
    document.documentElement.requestFullscreen().catch((err) => {
      console.warn(`Gagal masuk mode Fullscreen: ${err.message}`);
    });
    setActiveExam(exam);
  };

  const handleFinishExam = (result: ExamResult) => {
    onUpdate({ results: [...state.results, result] });
    setActiveExam(null);
  };

  const handleSubmitAssignment = () => {
    if (!subject) {
      alert("Silakan isi mata pelajaran.");
      return;
    }
    
    const newSubmission: Submission = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: currentStudent.id,
      subject,
      description,
      timestamp: Date.now(),
      status: 'PENDING'
    };

    onUpdate({ submissions: [newSubmission, ...state.submissions] });
    alert(`Tugas ${subject} berhasil dikirim!`);
    setShowSubmitModal(false);
    setSubject('');
    setDescription('');
  };

  if (activeExam) {
    return <ExamModule exam={activeExam} studentId={currentStudent.id} onFinish={handleFinishExam} onCancel={() => setActiveExam(null)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {/* Top Navigation Tabs */}
      <div className="flex justify-start mb-6 no-print">
        <div className="bg-slate-100/80 p-1.5 rounded-2xl flex gap-1 shadow-sm">
          <button 
            onClick={() => setActiveMainTab('beranda')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${activeMainTab === 'beranda' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            BERANDA
          </button>
          <button 
            onClick={() => setActiveMainTab('statistik')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${activeMainTab === 'statistik' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            STATISTIK
          </button>
        </div>
      </div>

      {activeMainTab === 'beranda' ? (
        <>
          {/* Hero Banner */}
          <div className="relative overflow-hidden bg-[#5b59e5] rounded-[3.5rem] p-12 text-white shadow-2xl shadow-indigo-200 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-5xl font-black tracking-tight uppercase">HALO, {currentStudent.name.split(' ')[0]}! 👋</h1>
              <p className="text-indigo-100 font-black text-xs uppercase tracking-[0.2em] opacity-80">KELAS: {currentStudent.class}</p>
            </div>
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="bg-white text-[#5b59e5] px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-transform shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              KIRIM TUGAS
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Ujian Aktif Section */}
              <section>
                <div className="flex justify-between items-center mb-6 px-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#5b59e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    <h2 className="text-sm font-black text-slate-800 tracking-widest uppercase">UJIAN AKTIF</h2>
                  </div>
                  <span className="bg-blue-50 text-[#5b59e5] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{activeExams.length} TERSEDIA</span>
                </div>

                {activeExams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeExams.map(exam => (
                      <div key={exam.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100 flex flex-col justify-between hover:shadow-2xl transition-all group">
                         <div>
                            <div className="flex justify-between items-center mb-6">
                               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black group-hover:bg-[#5b59e5] group-hover:text-white transition-all">{exam.title.charAt(0)}</div>
                               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{exam.duration} MIN</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase mb-1">{exam.title}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exam.subject}</p>
                         </div>
                         <button onClick={() => handleStartExam(exam)} className="w-full bg-[#1e293b] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest mt-8 hover:bg-[#5b59e5] transition-all active:scale-95">MULAI UJIAN</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 py-20 flex flex-col items-center justify-center text-center shadow-inner">
                    <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </div>
                    <p className="text-slate-300 font-black text-xs uppercase tracking-[0.2em]">BELUM ADA UJIAN AKTIF.</p>
                  </div>
                )}
              </section>

              {/* Nilai Terakhir & Status Tugas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <div className="flex items-center gap-3 mb-6 px-4">
                    <svg className="w-5 h-5 text-[#5b59e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h2 className="text-sm font-black text-slate-800 tracking-widest uppercase">NILAI TERAKHIR</h2>
                  </div>
                  <div className="bg-white rounded-[3rem] border border-slate-50 p-8 min-h-[250px] shadow-xl shadow-slate-100">
                    {studentResults.length > 0 ? (
                      <div className="space-y-4">
                         {studentResults.slice(0, 3).map((res, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                               <div>
                                  <p className="font-black text-slate-800 text-[10px] uppercase">{state.exams.find(e => e.id === res.examId)?.title || 'Ujian Digital'}</p>
                                  <p className="text-[8px] text-slate-400 font-bold">{new Date(res.timestamp).toLocaleDateString()}</p>
                               </div>
                               <span className="text-xl font-black text-indigo-600">{res.score.toFixed(0)}</span>
                            </div>
                         ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center">
                        <p className="text-slate-200 font-black text-[10px] uppercase tracking-[0.2em] italic">DATA KOSONG.</p>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-6 px-4">
                    <svg className="w-5 h-5 text-[#5b59e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    <h2 className="text-sm font-black text-slate-800 tracking-widest uppercase">STATUS TUGAS</h2>
                  </div>
                  <div className="bg-white rounded-[3rem] border border-slate-50 p-8 min-h-[250px] shadow-xl shadow-slate-100">
                    {studentSubmissions.length > 0 ? (
                      <div className="space-y-4">
                         {studentSubmissions.slice(0, 3).map((sub, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                               <div>
                                  <p className="font-black text-slate-800 text-[10px] uppercase">{sub.subject}</p>
                                  <p className="text-[8px] text-slate-400 font-bold">{new Date(sub.timestamp).toLocaleDateString()}</p>
                               </div>
                               <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${sub.status === 'GRADED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                 {sub.status === 'GRADED' ? `NILAI: ${sub.score}` : 'MENUNGGU'}
                               </span>
                            </div>
                         ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center">
                        <p className="text-slate-200 font-black text-[10px] uppercase tracking-[0.2em] italic">DATA KOSONG.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* Right Sidebar - Papan Skor */}
            <div className="space-y-8">
               <section className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-50 h-full">
                  <div className="flex items-center gap-3 mb-10">
                    <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <h2 className="text-sm font-black text-slate-800 tracking-widest uppercase">PAPAN SKOR</h2>
                  </div>

                  <div className="bg-slate-100/60 p-1 rounded-2xl flex gap-1 mb-8">
                    <button 
                      onClick={() => setLeaderboardTab('sekolah')}
                      className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${leaderboardTab === 'sekolah' ? 'bg-white text-[#5b59e5] shadow-sm' : 'text-slate-400'}`}
                    >
                      SEKOLAH
                    </button>
                    <button 
                      onClick={() => setLeaderboardTab('kelas')}
                      className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${leaderboardTab === 'kelas' ? 'bg-white text-[#5b59e5] shadow-sm' : 'text-slate-400'}`}
                    >
                      KELAS
                    </button>
                    <button 
                      onClick={() => setLeaderboardTab('top')}
                      className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${leaderboardTab === 'top' ? 'bg-white text-[#5b59e5] shadow-sm' : 'text-slate-400'}`}
                    >
                      TOP KELAS
                    </button>
                  </div>

                  <div className="space-y-4">
                     {[...state.results]
                       .sort((a, b) => b.score - a.score)
                       .slice(0, 8)
                       .map((res, idx) => {
                          const student = state.students.find(s => s.id === res.studentId);
                          return (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-xs ${idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-50 text-slate-300'}`}>
                                  {idx + 1}
                                </div>
                                <div>
                                   <p className="font-black text-slate-700 text-xs uppercase">{student?.name || 'Siswa'}</p>
                                   <p className="text-[8px] text-slate-400 font-bold uppercase">{student?.class}</p>
                                </div>
                              </div>
                              <span className="font-black text-indigo-600 text-xs">{res.score.toFixed(0)}</span>
                            </div>
                          );
                       })}
                     {state.results.length === 0 && (
                       <p className="py-10 text-center text-slate-200 font-black text-[10px] uppercase tracking-widest">Belum ada skor tercatat.</p>
                     )}
                  </div>
               </section>
            </div>
          </div>
        </>
      ) : (
        /* Statistik Tab View */
        <div className="bg-white p-12 rounded-[3.5rem] shadow-xl shadow-slate-100 border border-slate-50">
          <h2 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight mb-12">Grafik Perkembangan Akademik</h2>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentResults.map((r, i) => ({ name: `Quiz ${i+1}`, score: r.score }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f8fafc', radius: 20}} />
                <Bar dataKey="score" radius={[15, 15, 15, 15]} barSize={50}>
                  {studentResults.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 75 ? '#5b59e5' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Submit Tugas Mandiri Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white">
                 <h2 className="text-xl font-black text-[#1e293b] uppercase tracking-tight">SUBMIT TUGAS MANDIRI</h2>
                 <button 
                  onClick={() => setShowSubmitModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                 >
                   <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="p-10 space-y-8">
                 {/* Mata Pelajaran Input */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.15em] ml-2">MATA PELAJARAN</label>
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-[1.5rem] p-1.5 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                       <input 
                         type="text" 
                         value={subject}
                         onChange={(e) => setSubject(e.target.value)}
                         placeholder="Mis: Sejarah..."
                         className="w-full bg-transparent border-none px-6 py-4 text-base font-bold text-[#334155] outline-none placeholder:text-slate-300"
                       />
                    </div>
                 </div>

                 {/* Deskripsi Tugas Textarea */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.15em] ml-2">DESKRIPSI TUGAS</label>
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-[1.5rem] p-1.5 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                       <textarea 
                         rows={4}
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                         placeholder="Tulis catatan..."
                         className="w-full bg-transparent border-none px-6 py-4 text-base font-bold text-[#334155] outline-none resize-none placeholder:text-slate-300"
                       />
                    </div>
                 </div>

                 {/* Attachment Area */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.15em] ml-2">LAMPIRAN FOTO/FILE</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-[1.5rem] py-10 flex flex-col items-center justify-center group hover:bg-slate-50/50 hover:border-indigo-300 transition-all cursor-pointer">
                       <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       </div>
                       <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest group-hover:text-indigo-500">PILIH LAMPIRAN</p>
                    </div>
                 </div>

                 {/* Submit Button */}
                 <button 
                  onClick={handleSubmitAssignment}
                  className="w-full bg-[#5b59e5] text-white py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                 >
                   KIRIM TUGAS
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
