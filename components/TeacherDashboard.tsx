
import React, { useState, useRef, useEffect } from 'react';
import { Student, Exam, AppState, Question, ReportSettings, Submission } from '../types.ts';
import { generateQuestions } from '../services/geminiService.ts';
import { ReportGenerator } from './ReportGenerator.tsx';

interface TeacherDashboardProps {
  state: AppState;
  onUpdate: (newState: Partial<AppState>) => void;
}

// Fixed global declaration of aistudio to use the correct AIStudio type name.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ state, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'assignments' | 'students' | 'reports' | 'settings'>('exams');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [csvInput, setCsvInput] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(!!process.env.API_KEY);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dbImportRef = useRef<HTMLInputElement>(null);
  
  // Reports specific state
  const [selectedClass, setSelectedClass] = useState<string>(state.students[0]?.class || 'XII MIPA 1');
  const [viewingReportStudent, setViewingReportStudent] = useState<Student | null>(null);
  const [reportSubTab, setReportSubTab] = useState<'raport' | 'performa'>('raport');

  // New Exam Form State
  const [newExam, setNewExam] = useState<Partial<Exam>>({
    title: '',
    subject: '',
    kkm: 75,
    duration: 60,
    questions: [],
    targetClasses: []
  });
  const [aiMaterial, setAiMaterial] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiImage, setAiImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);

  // Grading State
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState<number>(0);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const result = await window.aistudio.hasSelectedApiKey();
        if (result) setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success per guidelines
    } else {
      alert("Fitur pemilihan kunci hanya tersedia di lingkungan AI Studio.");
    }
  };

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

  const exportDatabase = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `smada_genius_backup_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedState = JSON.parse(event.target?.result as string);
        if (importedState.students && importedState.exams) {
          onUpdate(importedState);
          alert("Database berhasil dipulihkan!");
        } else {
          alert("Format file backup tidak valid.");
        }
      } catch (err) {
        alert("Gagal membaca file backup.");
      }
    };
    reader.readAsText(file);
    if (dbImportRef.current) dbImportRef.current.value = '';
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setAiImage({ data: base64, mimeType: file.type });
      setAiImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => fileInputRef.current?.click();
  const triggerImageSelect = () => imageInputRef.current?.click();

  const handleAiGenerate = async () => {
    if (!aiMaterial && !aiImage) {
      alert("Silakan isi materi teks atau unggah gambar materi.");
      return;
    }
    if (!newExam.subject) {
      alert("Silakan isi mata pelajaran terlebih dahulu.");
      return;
    }
    setIsGenerating(true);
    try {
      const questions = await generateQuestions(aiMaterial, newExam.subject as string, aiQuestionCount, aiImage || undefined);
      setNewExam(prev => ({
        ...prev,
        questions: [...(prev.questions || []), ...questions]
      }));
      setAiMaterial('');
      setAiImage(null);
      setAiImagePreview(null);
    } catch (error) {
      alert(`Gagal membuat soal: ${error instanceof Error ? error.message : 'Unknown Error'}. Pastikan API Key sudah terpasang di menu Pengaturan.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExamId(exam.id);
    setNewExam({
      title: exam.title,
      subject: exam.subject,
      kkm: exam.kkm || 75,
      duration: exam.duration,
      questions: JSON.parse(JSON.stringify(exam.questions)),
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
    setNewExam({ title: '', subject: '', kkm: 75, duration: 60, questions: [], targetClasses: [] });
    setAiMaterial('');
    setAiQuestionCount(5);
    setAiImage(null);
    setAiImagePreview(null);
  };

  const toggleExamStatus = (id: string) => {
    const updatedExams = state.exams.map(exam => 
      exam.id === id ? { ...exam, active: !exam.active } : exam
    );
    onUpdate({ exams: updatedExams });
  };

  const deleteStudent = (id: string) => {
    if (window.confirm('PERHATIAN: Hapus siswa ini? Semua data nilai, hasil ujian, dan tugas akan hilang permanen.')) {
      const filteredStudents = state.students.filter(s => s.id !== id);
      const filteredResults = state.results.filter(r => r.studentId !== id);
      const filteredSubmissions = state.submissions.filter(sub => sub.studentId !== id);
      
      onUpdate({ 
        students: filteredStudents, 
        results: filteredResults, 
        submissions: filteredSubmissions 
      });
      
      if (viewingReportStudent?.id === id) {
        setViewingReportStudent(null);
      }
    }
  };

  const deleteExam = (id: string) => {
    if (window.confirm('Hapus ujian ini? Data hasil ujian siswa juga akan hilang.')) {
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

  const handleGradeSubmission = () => {
    if (!gradingSubmission) return;
    const updatedSubmissions = state.submissions.map(s => 
      s.id === gradingSubmission.id 
      ? { ...s, score: gradeValue, status: 'GRADED' as const } 
      : s
    );
    const updatedStudents = state.students.map(std => {
      if (std.id === gradingSubmission.studentId) {
        return {
          ...std,
          grades: {
            ...std.grades,
            [gradingSubmission.subject]: gradeValue
          }
        };
      }
      return std;
    });
    onUpdate({ submissions: updatedSubmissions, students: updatedStudents });
    setGradingSubmission(null);
    alert('Nilai tugas berhasil disimpan!');
  };

  const classes = Array.from(new Set(state.students.map(s => s.class))).sort();
  const studentsInClass = state.students.filter(s => s.class === selectedClass);

  if (viewingReportStudent) {
    const s = viewingReportStudent;
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
                <button onClick={() => setReportSubTab('raport')} className={`px-6 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${reportSubTab === 'raport' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-400'}`}>RAPORT DIGITAL</button>
                <button onClick={() => setReportSubTab('performa')} className={`px-6 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${reportSubTab === 'performa' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-400'}`}>ANALISIS</button>
             </div>
             <button onClick={() => setViewingReportStudent(null)} className="w-14 h-14 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>
        {reportSubTab === 'raport' && (
          <ReportGenerator student={s} settings={state.reportSettings} results={state.results} submissions={state.submissions} exams={state.exams} />
        )}
        {reportSubTab === 'performa' && <div className="p-12 bg-white rounded-[3rem] text-center text-slate-300 font-black uppercase italic">Statistik Performa Siswa Sedang Dimuat...</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={dbImportRef} onChange={handleImportDatabase} accept=".json" className="hidden" />
      
      <nav className="flex justify-center mb-4 no-print">
        <div className="bg-[#f1f3f9] p-2 rounded-2xl flex gap-1 shadow-inner">
          <button onClick={() => setActiveTab('exams')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'exams' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Bank Soal</button>
          <button onClick={() => setActiveTab('assignments')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'assignments' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Tugas Masuk</button>
          <button onClick={() => setActiveTab('students')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'students' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>Siswa</button>
          <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'reports' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Raport</button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'settings' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500 hover:bg-white/50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Pengaturan</button>
        </div>
      </nav>

      <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200 border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-12 py-10 flex justify-between items-center bg-white border-b border-slate-50">
          <h2 className="text-2xl font-black text-[#1e293b] tracking-tight uppercase">
            {activeTab === 'exams' && 'BANK SOAL'}
            {activeTab === 'assignments' && 'MANAJEMEN TUGAS'}
            {activeTab === 'students' && 'DATABASE SISWA'}
            {activeTab === 'reports' && `MANAJEMEN RAPORT`}
            {activeTab === 'settings' && 'PUSAT DATA & PENGATURAN'}
          </h2>
          {activeTab === 'exams' && (
            <button onClick={() => { setEditingExamId(null); setNewExam({ title: '', subject: '', kkm: 75, duration: 60, questions: [], targetClasses: [] }); setShowCreateModal(true); }} className="bg-[#5b59e5] text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#4a48c4] transition-all shadow-lg shadow-indigo-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>BUAT UJIAN BARU</button>
          )}
          {activeTab === 'students' && (
            <div className="flex items-center gap-3">
              <button onClick={downloadTemplate} className="px-6 py-2.5 rounded-xl border-2 border-amber-500 text-amber-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-amber-50 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>TEMPLATE CSV</button>
              <button onClick={triggerFileSelect} className="px-6 py-2.5 rounded-xl border-2 border-blue-600 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>IMPOR CSV</button>
              <button onClick={() => setShowImportArea(!showImportArea)} className="bg-[#5b59e5] text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#4a48c4] transition-all shadow-lg shadow-indigo-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>TAMBAH SISWA</button>
            </div>
          )}
          {activeTab === 'reports' && (
            <div className="flex items-center gap-4 bg-slate-50 px-6 py-2 rounded-2xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas:</span>
              <div className="relative group">
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none bg-white text-[#5b59e5] pl-6 pr-12 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border border-slate-100 focus:ring-4 focus:ring-indigo-500/5 cursor-pointer transition-all shadow-sm"
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls} className="font-bold text-slate-700">{cls}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5b59e5]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-12 py-4">
          {activeTab === 'students' && (
            <div className="py-4">
              {showImportArea && (
                <div className="bg-slate-50 p-8 rounded-[2rem] mb-10 border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Input Manual (Nama, NIS, Kelas)</h3>
                  <textarea value={csvInput} onChange={(e) => setCsvInput(e.target.value)} className="w-full h-32 p-5 border-2 border-slate-100 rounded-2xl text-sm mb-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 text-slate-800 font-bold" placeholder="Budi Santoso, 12345, XII MIPA 1" />
                  <div className="flex gap-2">
                    <button onClick={() => processCsvData(csvInput)} className="bg-[#5b59e5] text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95">Simpan Data</button>
                    <button onClick={() => setShowImportArea(false)} className="bg-white text-slate-500 px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Batal</button>
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
                          <button 
                            onClick={() => deleteStudent(s.id)} 
                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Hapus Siswa"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {state.students.length === 0 && (
                      <tr><td colSpan={4} className="py-20 text-center text-slate-300 italic font-bold">Belum ada data siswa.</td></tr>
                    )}
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
                    <th className="px-8 py-6 text-center">STATUS</th>
                    <th className="px-8 py-6 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {state.exams.map(exam => (
                    <tr key={exam.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-10"><p className="font-black text-[#1e293b] text-base uppercase leading-none mb-2">{exam.title}</p><p className="text-[10px] text-[#94a3b8] font-black uppercase tracking-widest">{exam.subject} - {exam.questions.length} SOAL</p></td>
                      <td className="px-8 py-10 text-center">{exam.active ? (<span className="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">AKTIF</span>) : (<span className="bg-amber-50 text-amber-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">DRAFT</span>)}</td>
                      <td className="px-8 py-10 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => setPreviewExam(exam)} className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center hover:bg-amber-100 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                          <button onClick={() => handleEditExam(exam)} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-100 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button onClick={() => toggleExamStatus(exam.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${exam.active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg></button>
                          <button onClick={() => deleteExam(exam.id)} className="w-10 h-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'assignments' && (
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-[#fcfcfd]">
                   <tr className="text-[#94a3b8] text-[10px] font-black uppercase tracking-widest border-y border-gray-50">
                     <th className="px-8 py-6">SISWA</th>
                     <th className="px-8 py-6">MATA PELAJARAN</th>
                     <th className="px-8 py-6 text-center">SKOR</th>
                     <th className="px-8 py-6 text-right">AKSI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {state.submissions.map(sub => (
                     <tr key={sub.id} className="group hover:bg-slate-50 transition-colors">
                       <td className="px-8 py-10 font-black text-[#1e293b] uppercase">{state.students.find(s => s.id === sub.studentId)?.name || 'Siswa'}</td>
                       <td className="px-8 py-10 font-bold text-slate-600 uppercase">{sub.subject}</td>
                       <td className="px-8 py-10 text-center">
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'GRADED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {sub.status === 'GRADED' ? `NILAI: ${sub.score}` : 'PENDING'}
                        </span>
                       </td>
                       <td className="px-8 py-10 text-right">
                         <button onClick={() => { setGradingSubmission(sub); setGradeValue(sub.score || 0); }} className="bg-[#5b59e5] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95">Beri Nilai</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}

          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
               {studentsInClass.map(s => (
                  <div key={s.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl transition-all flex flex-col gap-6 group relative overflow-hidden">
                     <div className="flex justify-between items-start relative z-10">
                        <div className="w-14 h-14 bg-[#eff2ff] text-[#5b59e5] rounded-full flex items-center justify-center font-black text-xl group-hover:bg-[#5b59e5] group-hover:text-white transition-all">{s.name.charAt(0)}</div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteStudent(s.id); }} 
                          className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                          title="Hapus Siswa"
                        >
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                     </div>
                     <div className="relative z-10">
                       <h4 className="text-lg font-black text-[#1e293b] uppercase tracking-tight leading-none mb-1">{s.name}</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIS {s.nis}</p>
                     </div>
                     <button onClick={() => { setViewingReportStudent(s); setReportSubTab('raport'); }} className="relative z-10 w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-800 uppercase tracking-widest hover:bg-[#5b59e5] hover:text-white hover:border-transparent transition-all">Lihat Raport Digital</button>
                  </div>
               ))}
               {studentsInClass.length === 0 && (
                 <div className="col-span-full py-24 text-center">
                   <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
                   </div>
                   <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest italic">Belum ada siswa di kelas {selectedClass}.</p>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl space-y-12">
               {/* SINKRONISASI & CADANGAN */}
               <section className="bg-indigo-50/50 border border-indigo-100 p-10 rounded-[2.5rem] shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-[#5b59e5] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#1e293b] uppercase tracking-tight">Konektivitas & Sinkronisasi</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cegah data hilang saat keluar dari Incognito</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">API Smart Engine</h4>
                        <p className="text-xs text-slate-500 font-medium mb-6">Status: {hasApiKey ? <span className="text-green-600 font-black">AKTIF</span> : <span className="text-red-500 font-black">MATI (Generate AI Tidak Bisa)</span>}</p>
                      </div>
                      <button onClick={handleOpenKeyDialog} className="w-full bg-[#5b59e5] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        AKTIFKAN AI ENGINE
                      </button>
                    </div>
                    
                    <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Backup Lokal</h4>
                        <p className="text-xs text-slate-500 font-medium mb-6">Cadangkan seluruh data sekolah Anda ke dalam file digital.</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={exportDatabase} className="flex-1 border-2 border-[#5b59e5] text-[#5b59e5] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95">EKSPOR</button>
                        <button onClick={() => dbImportRef.current?.click()} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95">IMPOR</button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                     <svg className="w-6 h-6 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <p className="text-[10px] font-bold text-blue-700 uppercase tracking-tight leading-relaxed">
                       Saran Deployment: Jika Anda menggunakan Vercel, pastikan API_KEY telah didaftarkan pada Environment Variables dashboard Vercel Anda. Gunakan tombol "Aktifkan AI Engine" di atas jika kunci tidak terdeteksi otomatis.
                     </p>
                  </div>
               </section>

               <section className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm">
                  <h3 className="text-xl font-black text-[#1e293b] uppercase tracking-tight mb-8">Identitas Sekolah</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-2">Nama Sekolah</label>
                      <input type="text" value={state.reportSettings.schoolName} onChange={(e) => updateReportSettings('schoolName', e.target.value)} className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl px-6 py-4 text-xl font-black text-[#334155] outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-inner" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-2">Kota Penerbitan</label>
                      <input type="text" value={state.reportSettings.city} onChange={(e) => updateReportSettings('city', e.target.value)} className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl px-6 py-4 text-xl font-black text-[#334155] outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-inner" />
                    </div>
                  </div>
               </section>

               <section className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-sm">
                  <h3 className="text-xl font-black text-[#1e293b] uppercase tracking-tight mb-8">Informasi Raport</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-2">Periode Semester</label>
                      <input type="text" value={state.reportSettings.period} onChange={(e) => updateReportSettings('period', e.target.value)} className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl px-6 py-4 text-xl font-black text-[#334155] outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-inner" placeholder="Mis: Semester Ganjil 2024" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] ml-2">Jabatan Penandatangan</label>
                      <input type="text" value={state.reportSettings.signatoryTitle} onChange={(e) => updateReportSettings('signatoryTitle', e.target.value)} className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl px-6 py-4 text-xl font-black text-[#334155] outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-inner" placeholder="Mis: Wali Kelas" />
                    </div>
                  </div>
               </section>
             </div>
          )}
        </div>
      </div>

      {/* Modal Buat / Edit Ujian */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10 border-b pb-6 text-slate-800">
              <h2 className="text-2xl font-black uppercase tracking-tight">{editingExamId ? 'EDIT UJIAN' : 'BUAT UJIAN BARU'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"><svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto max-h-[70vh] pr-4 custom-scrollbar text-slate-700">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-2 mb-2 block">Judul Ujian</label>
                  <input type="text" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-[#5b59e5]/10" placeholder="Contoh: Quiz Aljabar Dasar" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-2 mb-2 block">Mata Pelajaran</label>
                  <input type="text" value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})} className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-[#5b59e5]/10" placeholder="Contoh: Matematika" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-2 mb-2 block">Target Kelas (Pisahkan dengan koma)</label>
                  <input 
                    type="text" 
                    value={newExam.targetClasses?.join(', ') || ''} 
                    onChange={e => setNewExam({...newExam, targetClasses: e.target.value.split(',').map(c => c.trim()).filter(c => c !== '')})} 
                    className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-bold text-slate-800 outline-none ring-2 ring-transparent focus:ring-[#5b59e5]/10" 
                    placeholder="Contoh: XII MIPA 1, XII MIPA 2" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2 mb-2 block">Durasi (Menit)</label>
                    <input type="number" value={newExam.duration} onChange={e => setNewExam({...newExam, duration: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-bold text-slate-800 outline-none ring-1 ring-slate-100 focus:ring-[#5b59e5]/20 shadow-inner" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2 mb-2 block">KKM</label>
                    <input type="number" value={newExam.kkm} onChange={e => setNewExam({...newExam, kkm: parseInt(e.target.value) || 75})} className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-bold text-slate-800 outline-none ring-1 ring-slate-100 focus:ring-[#5b59e5]/20 shadow-inner" />
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                  <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    TAMBAH SOAL VIA AI
                  </h3>
                  
                  <div className="space-y-4 mb-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2 block">Materi Teks</label>
                    <textarea value={aiMaterial} onChange={e => setAiMaterial(e.target.value)} className="w-full h-32 bg-white border-none p-5 rounded-2xl text-sm outline-none resize-none placeholder:text-slate-300 text-slate-800 font-medium" placeholder="Tempel materi atau topik di sini..." />
                  </div>

                  <div className="space-y-4 mb-6">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2 block">Unggah Gambar Materi (Opsional)</label>
                    <div onClick={triggerImageSelect} className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all group">
                      {aiImagePreview ? (
                        <div className="relative w-full">
                          <img src={aiImagePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl shadow-md" />
                          <button onClick={(e) => { e.stopPropagation(); setAiImage(null); setAiImagePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                      ) : (
                        <>
                          <svg className="w-10 h-10 text-indigo-300 group-hover:text-indigo-500 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Pilih Gambar</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-2 block">Jumlah Soal</label>
                    <div className="flex items-center justify-between gap-4">
                      <input type="number" value={aiQuestionCount} onChange={e => setAiQuestionCount(parseInt(e.target.value) || 5)} className="w-20 bg-white border-none px-4 py-2.5 rounded-xl font-black text-center text-slate-800 outline-none shadow-sm ring-1 ring-slate-100" min="1" max="20" />
                      <button onClick={handleAiGenerate} disabled={isGenerating} className="flex-1 bg-[#5b59e5] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg active:scale-95">
                        {isGenerating ? 'GENERATE...' : 'GENERATE AI'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Soal & Opsi ({newExam.questions?.length || 0})</h3>
                  <button onClick={() => setNewExam({...newExam, questions: [...(newExam.questions || []), { id: Date.now().toString(), text: '', options: ['', '', '', ''], correctAnswer: 0 }]})} className="bg-[#eff2ff] text-[#5b59e5] font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all">+ Tambah Manual</button>
                </div>
                <div className="space-y-6">
                  {newExam.questions?.map((q, idx) => (
                    <div key={q.id} className="bg-slate-50 p-6 rounded-3xl relative group border border-slate-200">
                      <button onClick={() => setNewExam({...newExam, questions: newExam.questions?.filter(sq => sq.id !== q.id)})} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PERTANYAAN #{idx + 1}</p>
                      <input 
                        type="text" 
                        value={q.text} 
                        onChange={e => {
                          const updatedQuestions = [...(newExam.questions || [])];
                          updatedQuestions[idx] = { ...updatedQuestions[idx], text: e.target.value };
                          setNewExam({...newExam, questions: updatedQuestions});
                        }} 
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl font-bold mb-4 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm" 
                        placeholder="Ketik pertanyaan..." 
                      />
                      <div className="grid grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              name={`correct-${q.id}`} 
                              checked={q.correctAnswer === oIdx} 
                              onChange={() => {
                                const updatedQuestions = [...(newExam.questions || [])];
                                updatedQuestions[idx] = { ...updatedQuestions[idx], correctAnswer: oIdx };
                                setNewExam({...newExam, questions: updatedQuestions});
                              }} 
                              className="accent-[#5b59e5] w-4 h-4 cursor-pointer" 
                            />
                            <input 
                              type="text" 
                              value={opt} 
                              onChange={e => {
                                const updatedQuestions = [...(newExam.questions || [])];
                                const updatedOptions = [...updatedQuestions[idx].options];
                                updatedOptions[oIdx] = e.target.value;
                                updatedQuestions[idx] = { ...updatedQuestions[idx], options: updatedOptions };
                                setNewExam({...newExam, questions: updatedQuestions});
                              }} 
                              className={`flex-1 bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-5 shadow-sm ${q.correctAnswer === oIdx ? 'text-indigo-600 ring-1 ring-indigo-200' : 'text-slate-700'}`} 
                              placeholder={`Opsi ${oIdx + 1}`} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-10 pt-8 border-t flex justify-end gap-4">
              <button onClick={() => setShowCreateModal(false)} className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Batalkan</button>
              <button onClick={saveExam} className="bg-[#1e293b] text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5b59e5] transition-all shadow-xl active:scale-95">Simpan Ujian</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Exam Modal */}
      {previewExam && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">{previewExam.title}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{previewExam.subject} • {previewExam.questions.length} SOAL • {previewExam.targetClasses?.join(', ') || 'Semua Kelas'}</p>
              </div>
              <button onClick={() => setPreviewExam(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {previewExam.questions.map((q, idx) => (
                <div key={idx} className="bg-slate-50 p-6 rounded-3xl">
                  <p className="font-bold text-slate-800 mb-4">{idx + 1}. {q.text}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`p-4 rounded-2xl text-xs font-bold border-2 transition-all ${q.correctAnswer === oIdx ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setPreviewExam(null)} className="w-full mt-8 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Tutup</button>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
              <h2 className="text-xl font-black mb-8 uppercase text-slate-800">Beri Nilai Tugas</h2>
              <div className="space-y-8">
                 <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 font-bold uppercase">Mata Pelajaran: {gradingSubmission.subject}</div>
                 <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-2">Skor Nilai (0-100)</label>
                    <input type="number" value={gradeValue} onChange={e => setGradeValue(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl text-3xl font-black text-indigo-600 outline-none ring-1 ring-slate-100 focus:ring-indigo-500/20 shadow-inner" />
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setGradingSubmission(null)} className="flex-1 py-4 font-black uppercase text-xs text-slate-400 hover:text-slate-600 transition-all">Batal</button>
                    <button onClick={handleGradeSubmission} className="flex-2 bg-[#5b59e5] text-white py-4 px-8 rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Simpan Nilai</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
