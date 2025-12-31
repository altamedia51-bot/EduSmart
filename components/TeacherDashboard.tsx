
import React, { useState, useRef } from 'react';
import { Student, Exam, AppState, Question, ReportSettings } from '../types.ts';
import { generateQuestions } from '../services/geminiService.ts';
import { ReportGenerator } from './ReportGenerator.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TeacherDashboardProps {
  state: AppState;
  onUpdate: (newState: Partial<AppState>) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ state, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'assignments' | 'students' | 'reports' | 'settings'>('exams');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [csvInput, setCsvInput] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reports specific state
  const [selectedClass, setSelectedClass] = useState<string>('XII MIPA 2');
  const [viewingReportStudent, setViewingReportStudent] = useState<Student | null>(null);
  const [reportSubTab, setReportSubTab] = useState<'performa' | 'raport' | 'pengaturan'>('performa');

  // New Exam Form State
  const [newExam, setNewExam] = useState<Partial<Exam>>({
    title: '',
    subject: '',
    kkm: 75,
    duration: 60,
    questions: [],
    targetClasses: ['UMUM']
  });
  const [aiMaterial, setAiMaterial] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const processCsvData = (content: string) => {
    const lines = content.split('\n');
    const newStudents: Student[] = lines
      .filter(l => l.trim() && l.includes(','))
      .map(line => {
        const [name, nis, className] = line.split(',');
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: name?.trim() || 'New Student',
          nis: nis?.trim() || '00000',
          email: `${nis?.trim() || 'student'}@edu.com`,
          class: className?.trim() || 'Unassigned',
          grades: { 'Math': 0, 'Science': 0, 'English': 0 }
        };
      });
    
    if (newStudents.length > 0) {
      onUpdate({ students: [...state.students, ...newStudents] });
      alert(`Sukses mengimpor ${newStudents.length} siswa.`);
    } else {
      alert("Format CSV tidak valid. Gunakan: Nama, NIS, Kelas");
    }
    setCsvInput('');
    setShowImportArea(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCsvData(content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAiGenerate = async () => {
    if (!aiMaterial || !newExam.subject) {
      alert("Silakan isi materi dan mata pelajaran terlebih dahulu.");
      return;
    }
    if (aiQuestionCount < 1 || aiQuestionCount > 20) {
      alert("Jumlah soal harus antara 1 sampai 20.");
      return;
    }

    setIsGenerating(true);
    try {
      const questions = await generateQuestions(aiMaterial, newExam.subject as string, aiQuestionCount);
      setNewExam(prev => ({
        ...prev,
        questions: [...(prev.questions || []), ...questions]
      }));
    } catch (error) {
      alert("Gagal membuat soal dengan AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExamId(exam.id);
    setNewExam({
      title: exam.title,
      subject: exam.subject,
      kkm: exam.kkm,
      duration: exam.duration,
      questions: [...exam.questions],
      targetClasses: [...(exam.targetClasses || [])]
    });
    setShowCreateModal(true);
  };

  const saveExam = () => {
    if (!newExam.title || (newExam.questions?.length || 0) === 0) {
      alert("Judul dan soal minimal 1 harus diisi.");
      return;
    }

    if (editingExamId) {
      const updatedExams = state.exams.map(e => 
        e.id === editingExamId 
        ? { ...e, ...newExam as Exam }
        : e
      );
      onUpdate({ exams: updatedExams });
      setEditingExamId(null);
    } else {
      const examToSave: Exam = {
        id: Date.now().toString(),
        title: newExam.title!,
        subject: newExam.subject || 'Lainnya',
        duration: newExam.duration || 60,
        kkm: newExam.kkm,
        active: false,
        questions: newExam.questions || [],
        targetClasses: newExam.targetClasses
      };
      onUpdate({ exams: [...state.exams, examToSave] });
    }

    setShowCreateModal(false);
    setNewExam({ title: '', subject: '', kkm: 75, duration: 60, questions: [], targetClasses: ['UMUM'] });
    setAiMaterial('');
    setAiQuestionCount(5);
  };

  const toggleExamStatus = (id: string) => {
    const updatedExams = state.exams.map(exam => 
      exam.id === id ? { ...exam, active: !exam.active } : exam
    );
    onUpdate({ exams: updatedExams });
  };

  const deleteStudent = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
      onUpdate({ students: state.students.filter(s => s.id !== id) });
    }
  };

  const deleteExam = (id: string) => {
    if (confirm('Hapus ujian ini? Data hasil ujian siswa juga akan hilang.')) {
      onUpdate({ exams: state.exams.filter(e => e.id !== id) });
    }
  };

  const downloadTemplate = () => {
    const content = "Nama,NIS,Kelas\nAndi Pratama,12345,XII MIPA 1\nSiti Aminah,12346,XII MIPA 2";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'template_siswa.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const updateReportSettings = (field: keyof ReportSettings, value: string) => {
    onUpdate({
      reportSettings: {
        ...state.reportSettings,
        [field]: value
      }
    });
  };

  const classes = Array.from(new Set(state.students.map(s => s.class))).sort();
  const studentsInClass = state.students.filter(s => s.class === selectedClass);

  if (viewingReportStudent) {
    const s = viewingReportStudent;
    const scores = Object.values(s.grades) as number[];
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const chartData = Object.entries(s.grades).map(([name, score]) => ({ name, score: score as number }));

    return (
      <div className="animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
        <div className="bg-white rounded-[3rem] p-8 mb-8 shadow-xl shadow-slate-100 flex items-center justify-between border border-gray-50">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-[#5b59e5] text-white rounded-[2rem] flex items-center justify-center font-black text-4xl shadow-2xl shadow-indigo-200">
              {s.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1e293b] tracking-tight uppercase mb-1">{s.name}</h1>
              <div className="flex items-center gap-3">
                 <span className="bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">NIS: {s.nis}</span>
                 <span className="bg-[#eff2ff] text-[#5b59e5] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">SISWA AKTIF</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="bg-[#f1f3f9] p-2 rounded-2xl flex gap-1 shadow-inner mr-4">
                <button 
                  onClick={() => setReportSubTab('performa')}
                  className={`px-6 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${reportSubTab === 'performa' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-400 hover:bg-white/50'}`}
                >
                  PERFORMA
                </button>
                <button 
                  onClick={() => setReportSubTab('raport')}
                  className={`px-6 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${reportSubTab === 'raport' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-400 hover:bg-white/50'}`}
                >
                  RAPORT DIGITAL
                </button>
                <button 
                  onClick={() => setReportSubTab('pengaturan')}
                  className={`px-6 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${reportSubTab === 'pengaturan' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-400 hover:bg-white/50'}`}
                >
                  PENGATURAN
                </button>
             </div>
             <button 
                onClick={() => setViewingReportStudent(null)}
                className="w-14 h-14 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
          </div>
        </div>

        {reportSubTab === 'performa' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-gray-50 flex flex-col justify-between min-h-[220px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">TOTAL RATA-RATA</p>
                  <p className="text-7xl font-black text-red-500 leading-none">{avg.toFixed(0)}</p>
                  <div className="mt-6 pt-6 border-t border-slate-50">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">UJIAN & TUGAS MANDIRI</p>
                  </div>
               </div>
               
               <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-gray-50 flex flex-col justify-between min-h-[220px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">UJIAN SELESAI</p>
                  <p className="text-7xl font-black text-[#1e293b] leading-none">
                    {state.results.filter(r => r.studentId === s.id).length}
                  </p>
                  <div className="mt-6"></div>
               </div>

               <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-gray-50 flex flex-col justify-between min-h-[220px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">TUGAS DINILAI</p>
                  <p className="text-7xl font-black text-indigo-500 leading-none">0</p>
                  <div className="mt-6"></div>
               </div>

               <div className="bg-[#5b59e5] p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 text-white flex flex-col justify-center items-center min-h-[220px]">
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">CAPAIAN KELAS</p>
                  <p className="text-6xl font-black tracking-tighter">TOP</p>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] p-12 shadow-xl shadow-slate-100 border border-gray-50">
              <h2 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight mb-12">GRAFIK PROGRES NILAI</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: '#f8fafc', radius: 20}} />
                    <Bar dataKey="score" radius={[20, 20, 20, 20]} barSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score >= 75 ? '#5b59e5' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {reportSubTab === 'raport' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <ReportGenerator student={viewingReportStudent} settings={state.reportSettings} />
          </div>
        )}

        {reportSubTab === 'pengaturan' && (
          <div className="bg-white rounded-[3rem] p-12 shadow-xl shadow-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h2 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight">Profil Sekolah & Raport</h2>
            </div>

            <div className="grid grid-cols-1 gap-10 max-w-4xl">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-4">Nama Sekolah</label>
                <div className="bg-[#f8fafc] border border-slate-100 rounded-[2rem] p-2 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                  <input 
                    type="text" 
                    value={state.reportSettings.schoolName}
                    onChange={(e) => updateReportSettings('schoolName', e.target.value)}
                    className="w-full bg-transparent border-none px-8 py-4 text-xl font-black text-[#334155] outline-none"
                    placeholder="Masukkan nama sekolah..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-4">Periode Raport</label>
                <div className="bg-[#f8fafc] border border-slate-100 rounded-[2rem] p-2 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                  <input 
                    type="text" 
                    value={state.reportSettings.period}
                    onChange={(e) => updateReportSettings('period', e.target.value)}
                    className="w-full bg-transparent border-none px-8 py-4 text-xl font-black text-[#334155] outline-none"
                    placeholder="Contoh: Semester Ganjil 2024"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-4">Kota Penerbitan</label>
                <div className="bg-[#f8fafc] border border-slate-100 rounded-[2rem] p-2 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                  <input 
                    type="text" 
                    value={state.reportSettings.city}
                    onChange={(e) => updateReportSettings('city', e.target.value)}
                    className="w-full bg-transparent border-none px-8 py-4 text-xl font-black text-[#334155] outline-none"
                    placeholder="Contoh: Semarang"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-4">Jabatan Penanda Tangan</label>
                <div className="bg-[#f8fafc] border border-slate-100 rounded-[2rem] p-2 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                  <input 
                    type="text" 
                    value={state.reportSettings.signatoryTitle}
                    onChange={(e) => updateReportSettings('signatoryTitle', e.target.value)}
                    className="w-full bg-transparent border-none px-8 py-4 text-xl font-black text-[#334155] outline-none"
                    placeholder="Contoh: Wali Kelas"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv" 
        className="hidden" 
      />
      
      <nav className="flex justify-center mb-4 no-print">
        <div className="bg-[#f1f3f9] p-2 rounded-2xl flex gap-1 shadow-inner">
          <button onClick={() => setActiveTab('exams')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'exams' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Ujian</button>
          <button onClick={() => setActiveTab('assignments')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'assignments' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Tugas Masuk</button>
          <button onClick={() => setActiveTab('students')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'students' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>Siswa</button>
          <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'reports' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Raport</button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'settings' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Pengaturan</button>
        </div>
      </nav>

      <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200 border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-12 py-10 flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#1e293b] tracking-tight uppercase">
            {activeTab === 'exams' && 'BANK UJIAN DIGITAL'}
            {activeTab === 'assignments' && 'MANAJEMEN TUGAS'}
            {activeTab === 'students' && 'DATABASE SISWA'}
            {activeTab === 'reports' && `MANAJEMEN RAPORT ${selectedClass}`}
            {activeTab === 'settings' && 'PENGATURAN SISTEM'}
          </h2>
          
          {activeTab === 'exams' && (
            <button onClick={() => { setEditingExamId(null); setNewExam({ title: '', subject: '', kkm: 75, duration: 60, questions: [], targetClasses: ['UMUM'] }); setShowCreateModal(true); }} className="bg-[#5b59e5] text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#4a48c4] transition-all shadow-lg shadow-indigo-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>BUAT UJIAN BARU</button>
          )}

          {activeTab === 'students' && (
            <div className="flex items-center gap-3">
              <button onClick={downloadTemplate} className="px-6 py-2.5 rounded-xl border-2 border-amber-500 text-amber-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-amber-50 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>UNDUH TEMPLATE CSV</button>
              <button onClick={triggerFileSelect} className="px-6 py-2.5 rounded-xl border-2 border-blue-600 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>IMPOR CSV</button>
              <button onClick={() => setShowImportArea(!showImportArea)} className="bg-[#5b59e5] text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#4a48c4] transition-all shadow-lg shadow-indigo-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>TAMBAH SISWA</button>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="flex gap-2">
              {classes.map(cls => (
                <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedClass === cls ? 'bg-[#5b59e5] text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{cls}</button>
              ))}
            </div>
          )}
        </div>

        <div className="px-12 py-4">
          {activeTab === 'students' && (
            <div className="py-4">
              {showImportArea && (
                <div className="bg-slate-50 p-8 rounded-[2rem] mb-10 border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#5b59e5] text-white rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Manual Entry / Copy-Paste (Nama, NIS, Kelas)</h3>
                  </div>
                  <textarea value={csvInput} onChange={(e) => setCsvInput(e.target.value)} className="w-full h-32 p-5 border-2 border-slate-100 rounded-2xl text-sm mb-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" placeholder="Format: Nama, NIS, Kelas (Contoh: Budi Santoso, 12345, XII MIPA 1)" />
                  <div className="flex gap-2">
                    <button onClick={() => processCsvData(csvInput)} className="bg-[#5b59e5] text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95">EKSEKUSI TAMBAH</button>
                    <button onClick={() => setShowImportArea(false)} className="bg-white text-slate-500 px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">BATAL</button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[#94a3b8] text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                      <th className="px-6 py-6">NAMA</th>
                      <th className="px-6 py-6">NIS</th>
                      <th className="px-6 py-6">KELAS</th>
                      <th className="px-6 py-6 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {state.students.map(s => (
                      <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-8 font-black text-[#1e293b] text-base">{s.name}</td>
                        <td className="px-6 py-8 text-slate-400 font-medium text-base">{s.nis}</td>
                        <td className="px-6 py-8 font-black text-[#1e293b] text-base">{s.class}</td>
                        <td className="px-6 py-8 text-right">
                          <div className="flex justify-end gap-3">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                            <button onClick={() => deleteStudent(s.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#fcfcfd]">
                  <tr className="text-[#94a3b8] text-[10px] font-black uppercase tracking-widest border-y border-gray-50">
                    <th className="px-8 py-6">UJIAN</th>
                    <th className="px-8 py-6">TARGET KELAS</th>
                    <th className="px-8 py-6 text-center">STATUS</th>
                    <th className="px-8 py-6 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {state.exams.length > 0 ? (
                    state.exams.map(exam => (
                      <tr key={exam.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-10"><p className="font-black text-[#1e293b] text-base uppercase leading-none mb-2">{exam.title}</p><p className="text-[10px] text-[#94a3b8] font-black uppercase tracking-widest">{exam.subject} - {exam.questions.length} SOAL</p></td>
                        <td className="px-8 py-10"><span className="bg-[#eff2ff] text-[#5b59e5] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">{exam.targetClasses?.join(', ') || 'UMUM'}</span></td>
                        <td className="px-8 py-10 text-center">{exam.active ? (<span className="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">AKTIF</span>) : (<span className="bg-amber-50 text-amber-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">DRAFT</span>)}</td>
                        <td className="px-8 py-10 text-right"><div className="flex justify-end gap-3">
                          <button onClick={() => setPreviewExam(exam)} className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center hover:bg-amber-100 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                          <button onClick={() => handleEditExam(exam)} className="w-10 h-10 bg-[#eff2ff] text-[#5b59e5] rounded-xl flex items-center justify-center hover:bg-indigo-100 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          <button onClick={() => toggleExamStatus(exam.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${exam.active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg></button>
                          <button onClick={() => deleteExam(exam.id)} className="w-10 h-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="py-24 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">Belum ada data ujian digital</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
              {studentsInClass.map(s => {
                const scores = Object.values(s.grades) as number[];
                const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                return (
                  <div key={s.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl transition-all group flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 bg-[#eff2ff] text-[#5b59e5] rounded-full flex items-center justify-center font-black text-xl group-hover:bg-[#5b59e5] group-hover:text-white transition-colors">{s.name.charAt(0)}</div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest leading-none mb-1">Rerata</p>
                        <p className="text-3xl font-black text-red-500 leading-none">{avg.toFixed(0)}</p>
                      </div>
                    </div>
                    <div><h4 className="text-lg font-black text-[#1e293b] uppercase tracking-tight">{s.name}</h4><p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">NIS {s.nis}</p></div>
                    <button onClick={() => { setViewingReportStudent(s); setReportSubTab('performa'); }} className="w-full py-4 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-800 uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all mt-4">Buka Raport Digital</button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="bg-white rounded-[3rem] p-12 shadow-xl shadow-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                 <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
               </div>
               <h2 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight">Profil Sekolah & Raport Global</h2>
             </div>
 
             <div className="grid grid-cols-1 gap-10 max-w-4xl">
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-4">Nama Sekolah</label>
                 <div className="bg-[#f8fafc] border border-slate-100 rounded-[2rem] p-2 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                   <input 
                     type="text" 
                     value={state.reportSettings.schoolName}
                     onChange={(e) => updateReportSettings('schoolName', e.target.value)}
                     className="w-full bg-transparent border-none px-8 py-4 text-xl font-black text-[#334155] outline-none"
                     placeholder="Masukkan nama sekolah..."
                   />
                 </div>
               </div>
 
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-4">Periode Raport</label>
                 <div className="bg-[#f8fafc] border border-slate-100 rounded-[2rem] p-2 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                   <input 
                     type="text" 
                     value={state.reportSettings.period}
                     onChange={(e) => updateReportSettings('period', e.target.value)}
                     className="w-full bg-transparent border-none px-8 py-4 text-xl font-black text-[#334155] outline-none"
                     placeholder="Contoh: Semester Ganjil 2024"
                   />
                 </div>
               </div>
 
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-4">Kota Penerbitan</label>
                 <div className="bg-[#f8fafc] border border-slate-100 rounded-[2rem] p-2 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                   <input 
                     type="text" 
                     value={state.reportSettings.city}
                     onChange={(e) => updateReportSettings('city', e.target.value)}
                     className="w-full bg-transparent border-none px-8 py-4 text-xl font-black text-[#334155] outline-none"
                     placeholder="Contoh: Semarang"
                   />
                 </div>
               </div>
 
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-4">Jabatan Penanda Tangan</label>
                 <div className="bg-[#f8fafc] border border-slate-100 rounded-[2rem] p-2 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                   <input 
                     type="text" 
                     value={state.reportSettings.signatoryTitle}
                     onChange={(e) => updateReportSettings('signatoryTitle', e.target.value)}
                     className="w-full bg-transparent border-none px-8 py-4 text-xl font-black text-[#334155] outline-none"
                     placeholder="Contoh: Wali Kelas"
                   />
                 </div>
               </div>
             </div>
           </div>
          )}

          {activeTab === 'assignments' && <div className="py-24 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">Menu {activeTab} sedang dalam pengembangan</div>}
        </div>
      </div>

      {previewExam && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-[80vw] max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center"><div><h1 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight">{previewExam.title}</h1><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{previewExam.subject} • {previewExam.questions.length} Pertanyaan</p></div><button onClick={() => setPreviewExam(null)} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50">
               {previewExam.questions.map((q, idx) => (
                 <div key={q.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-indigo-500 uppercase mb-3">Pertanyaan {idx + 1}</p><p className="text-xl font-bold text-slate-800 mb-6">{q.text}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{q.options.map((opt, oIdx) => (<div key={oIdx} className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${oIdx === q.correctAnswer ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}><span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${oIdx === q.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>{String.fromCharCode(65 + oIdx)}</span><span className="font-medium text-sm">{opt}</span></div>))}</div></div>
               ))}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-[90vw] max-w-6xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center"><h1 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight">{editingExamId ? 'EDIT UJIAN' : 'UJIAN BARU'}</h1><button onClick={() => { setShowCreateModal(false); setEditingExamId(null); }} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="flex-grow flex overflow-hidden">
              <div className="w-1/2 p-10 overflow-y-auto border-r border-gray-50 flex flex-col gap-6">
                <input type="text" placeholder="Judul Ujian" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-slate-800 font-bold outline-none" />
                <div className="grid grid-cols-3 gap-4"><input type="text" placeholder="Mapel" value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})} className="bg-slate-50 border-none rounded-2xl p-5 text-slate-800 font-bold outline-none" /><div className="bg-[#eff2ff] rounded-2xl p-5 flex flex-col"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">KKM</span><input type="number" value={newExam.kkm} onChange={e => setNewExam({...newExam, kkm: parseInt(e.target.value)})} className="bg-transparent border-none p-0 text-slate-800 font-black outline-none w-full" /></div><div className="bg-[#fffdf2] rounded-2xl p-5 flex flex-col"><span className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Durasi</span><input type="number" value={newExam.duration} onChange={e => setNewExam({...newExam, duration: parseInt(e.target.value)})} className="bg-transparent border-none p-0 text-slate-800 font-black outline-none w-full" /></div></div>
                <div className="bg-[#1a1c23] rounded-[2.5rem] p-8 text-white shadow-2xl">
                  <h3 className="font-black text-sm uppercase text-blue-400 mb-6">AI GENERATOR</h3>
                  <textarea placeholder="Materi..." value={aiMaterial} onChange={e => setAiMaterial(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white min-h-[100px] mb-4" />
                  <button onClick={handleAiGenerate} disabled={isGenerating} className="w-full bg-[#5b59e5] text-white py-4 rounded-2xl font-black text-xs uppercase transition-all disabled:opacity-50">{isGenerating ? 'GENERATING...' : 'GENERATE SOAL AI'}</button>
                </div>
              </div>
              <div className="w-1/2 p-10 bg-slate-50 overflow-y-auto">
                <div className="flex justify-between items-center mb-8"><h3 className="text-sm font-black text-slate-400 uppercase">PREVIEW ({newExam.questions?.length || 0})</h3>{newExam.questions && newExam.questions.length > 0 && <button onClick={saveExam} className="bg-emerald-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">SIMPAN</button>}</div>
                {newExam.questions?.map((q, idx) => (
                  <div key={q.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-4"><p className="font-bold text-slate-800 mb-4">{q.text}</p></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
