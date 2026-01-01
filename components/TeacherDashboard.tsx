
import React, { useState, useRef, useEffect } from 'react';
import { Student, Exam, AppState, Question, ReportSettings, Submission } from '../types.ts';
import { generateQuestions } from '../services/geminiService.ts';
import { ReportGenerator } from './ReportGenerator.tsx';

interface TeacherDashboardProps {
  state: AppState;
  onUpdate: (newState: Partial<AppState>) => void;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
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
  
  const [selectedClass, setSelectedClass] = useState<string>(state.students[0]?.class || 'XII MIPA 1');
  const [viewingReportStudent, setViewingReportStudent] = useState<Student | null>(null);
  const [reportSubTab, setReportSubTab] = useState<'raport' | 'performa'>('raport');

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

  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState<number>(0);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const result = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(result || !!process.env.API_KEY);
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true); 
      } catch (err) {
        console.error("Gagal membuka dialog kunci:", err);
      }
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
    if (!hasApiKey) {
      if (confirm("Fitur AI membutuhkan API Key. Hubungkan sekarang di menu Pengaturan?")) {
        setShowCreateModal(false);
        setActiveTab('settings');
      }
      return;
    }

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
    } catch (error: any) {
      alert(`Error: ${error.message}. Periksa status API Key di Pengaturan.`);
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
    if (window.confirm('Hapus siswa ini permanen?')) {
      onUpdate({ 
        students: state.students.filter(s => s.id !== id), 
        results: state.results.filter(r => r.studentId !== id) 
      });
    }
  };

  const deleteExam = (id: string) => {
    if (window.confirm('Hapus ujian ini?')) {
      onUpdate({ exams: state.exams.filter(e => e.id !== id) });
    }
  };

  const downloadTemplate = () => {
    const content = "Nama,NIS,Kelas\nAndi Pratama,12345,XII MIPA 1";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_siswa.csv';
    a.click();
  };

  const updateReportSettings = (field: keyof ReportSettings, value: string) => {
    onUpdate({ reportSettings: { ...state.reportSettings, [field]: value } });
  };

  const calculateStudentAverage = (studentId: string) => {
    const studentResults = state.results.filter(r => r.studentId === studentId);
    const studentSubmissions = state.submissions.filter(s => s.studentId === studentId && s.status === 'GRADED');
    const allScores = [...studentResults.map(r => r.score), ...studentSubmissions.map(s => s.score || 0)];
    return allScores.length === 0 ? 0 : Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  };

  const classes = Array.from(new Set(state.students.map(s => s.class))).sort();
  const studentsInClass = state.students.filter(s => s.class === selectedClass);

  if (viewingReportStudent) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
        <div className="bg-white rounded-[3rem] p-8 mb-8 shadow-xl flex items-center justify-between border border-gray-50">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#5b59e5] text-white rounded-[2rem] flex items-center justify-center font-black text-3xl">
              {viewingReportStudent.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1e293b] uppercase">{viewingReportStudent.name}</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">NIS: {viewingReportStudent.nis} • {viewingReportStudent.class}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setReportSubTab('raport')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${reportSubTab === 'raport' ? 'bg-[#5b59e5] text-white' : 'bg-slate-100 text-slate-400'}`}>Raport Digital</button>
            <button onClick={() => setViewingReportStudent(null)} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-all">✕</button>
          </div>
        </div>
        <ReportGenerator student={viewingReportStudent} settings={state.reportSettings} results={state.results} submissions={state.submissions} exams={state.exams} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={dbImportRef} onChange={handleImportDatabase} accept=".json" className="hidden" />
      
      {/* Tab Nav */}
      <nav className="flex justify-center mb-4 no-print">
        <div className="bg-[#f1f3f9] p-2 rounded-2xl flex gap-1 shadow-inner">
          <button onClick={() => setActiveTab('exams')} className={`px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'exams' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500'}`}>Ujian</button>
          <button onClick={() => setActiveTab('assignments')} className={`px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'assignments' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500'}`}>Tugas</button>
          <button onClick={() => setActiveTab('students')} className={`px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'students' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500'}`}>Siswa</button>
          <button onClick={() => setActiveTab('reports')} className={`px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'reports' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500'}`}>Raport</button>
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-2.5 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'settings' ? 'bg-white text-[#5b59e5] shadow-md' : 'text-slate-500'}`}>Pengaturan</button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden min-h-[600px]">
        {/* Header Action Bar */}
        <div className="px-12 py-10 flex justify-between items-center border-b border-slate-50">
          <h2 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight">
            {activeTab.toUpperCase()}
          </h2>
          {activeTab === 'exams' && (
            <button onClick={() => { setEditingExamId(null); setNewExam({ title: '', subject: '', kkm: 75, duration: 60, questions: [], targetClasses: [] }); setShowCreateModal(true); }} className="bg-[#5b59e5] text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-[#4a48c4] transition-all shadow-lg">+ Ujian Baru</button>
          )}
          {activeTab === 'students' && (
            <div className="flex gap-2">
              <button onClick={downloadTemplate} className="px-6 py-2 rounded-xl border-2 border-slate-200 text-slate-400 font-black text-[10px] uppercase">Template CSV</button>
              <button onClick={triggerFileSelect} className="bg-[#5b59e5] text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase">Impor CSV</button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="px-12 py-8">
          {activeTab === 'exams' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.exams.map(exam => (
                <div key={exam.id} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-[#5b59e5] shadow-sm">{exam.title.charAt(0)}</div>
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${exam.active ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{exam.active ? 'Aktif' : 'Draft'}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase mb-1">{exam.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{exam.subject} • {exam.questions.length} Soal</p>
                  <div className="flex gap-2">
                    <button onClick={() => toggleExamStatus(exam.id)} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all ${exam.active ? 'bg-rose-50 text-rose-500' : 'bg-[#5b59e5] text-white'}`}>{exam.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    <button onClick={() => handleEditExam(exam)} className="w-12 h-12 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:text-[#5b59e5] transition-all border border-slate-100">✎</button>
                    <button onClick={() => deleteExam(exam.id)} className="w-12 h-12 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:text-rose-500 transition-all border border-slate-100">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'students' && (
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                      <th className="px-6 py-4">Nama Siswa</th>
                      <th className="px-6 py-4">NIS</th>
                      <th className="px-6 py-4">Kelas</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.students.map(s => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-6 font-black text-slate-800">{s.name}</td>
                        <td className="px-6 py-6 font-bold text-slate-400">{s.nis}</td>
                        <td className="px-6 py-6 font-black text-slate-800 uppercase">{s.class}</td>
                        <td className="px-6 py-6 text-right">
                          <button onClick={() => deleteStudent(s.id)} className="text-rose-300 hover:text-rose-600 transition-colors px-4 py-2 font-black text-[10px] uppercase">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8">
              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
                {classes.map(cls => (
                  <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedClass === cls ? 'bg-white text-[#5b59e5] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{cls}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentsInClass.map(s => (
                  <div key={s.id} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-[#5b59e5] group-hover:text-white transition-all">{s.name.charAt(0)}</div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Rerata</p>
                        <p className={`text-2xl font-black ${calculateStudentAverage(s.id) >= 75 ? 'text-indigo-600' : 'text-rose-500'}`}>{calculateStudentAverage(s.id)}</p>
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 uppercase mb-6 leading-tight">{s.name}</h4>
                    <button onClick={() => setViewingReportStudent(s)} className="w-full py-4 bg-slate-50 text-slate-800 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-[#1e293b] hover:text-white transition-all">Lihat Raport</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl space-y-12">
               {/* Koneksi API */}
               <section className="bg-indigo-50/30 p-10 rounded-[2.5rem] border border-indigo-100">
                  <div className="flex items-center gap-3 mb-8">
                    <div className={`w-3 h-3 rounded-full ${hasApiKey ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-rose-500 animate-pulse'}`}></div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Konektivitas AI Smart Engine</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        Fitur **Generate Soal Otomatis** dan **Narasi Raport AI** membutuhkan koneksi ke Google Gemini API.
                      </p>
                      {window.aistudio && (
                        <button 
                          onClick={handleOpenKeyDialog}
                          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${!hasApiKey ? 'bg-[#5b59e5] text-white animate-pulse' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                        >
                          {hasApiKey ? 'Kunci API Terhubung (Ubah)' : '✕ Hubungkan Kunci API Sekarang'}
                        </button>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-indigo-50 space-y-4">
                       <h4 className="text-[10px] font-black text-[#5b59e5] uppercase tracking-widest">Cara Pasang di Vercel:</h4>
                       <ol className="text-[10px] text-slate-500 space-y-2 list-decimal ml-4 font-bold uppercase">
                         <li>Buka Dashboard Proyek di Vercel</li>
                         <li>Klik **Settings** > **Environment Variables**</li>
                         <li>Tambah Key: <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600">API_KEY</code></li>
                         <li>Value: Tempel Kunci dari AI Studio</li>
                         <li>Klik Save & **Redeploy** Proyek</li>
                       </ol>
                    </div>
                  </div>
               </section>

               {/* Identitas Sekolah */}
               <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8">Informasi Raport</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Nama Instansi</label>
                      <input type="text" value={state.reportSettings.schoolName} onChange={(e) => updateReportSettings('schoolName', e.target.value)} className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-black text-[#1e293b] outline-none focus:ring-2 focus:ring-indigo-100" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Kota Penerbitan</label>
                      <input type="text" value={state.reportSettings.city} onChange={(e) => updateReportSettings('city', e.target.value)} className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-black text-[#1e293b] outline-none focus:ring-2 focus:ring-indigo-100" />
                    </div>
                  </div>
               </section>

               {/* Database Action */}
               <section className="flex gap-4">
                  <button onClick={exportDatabase} className="flex-1 bg-slate-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">Ekspor Database (Backup)</button>
                  <button onClick={() => dbImportRef.current?.click()} className="flex-1 bg-white text-slate-800 border-2 border-slate-100 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Impor Database (Restore)</button>
               </section>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ujian */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10 border-b pb-6">
              <h2 className="text-2xl font-black text-[#1e293b] uppercase">{editingExamId ? 'Edit Ujian' : 'Konfigurasi Ujian Baru'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
               <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Judul Ujian</label>
                    <input type="text" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-bold text-slate-800 outline-none" placeholder="Contoh: UTS Semester Ganjil" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mapel</label>
                      <input type="text" value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})} className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-bold text-slate-800 outline-none" placeholder="Matematika" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Durasi (Menit)</label>
                      <input type="number" value={newExam.duration} onChange={e => setNewExam({...newExam, duration: parseInt(e.target.value) || 60})} className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-bold text-slate-800 outline-none" />
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100 space-y-6">
                    <div className="flex items-center gap-3">
                       <span className="flex h-3 w-3 rounded-full bg-indigo-500 animate-pulse"></span>
                       <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Generate via AI Smart Engine</h3>
                    </div>
                    <textarea value={aiMaterial} onChange={e => setAiMaterial(e.target.value)} className="w-full h-32 bg-white border-none p-6 rounded-2xl text-sm outline-none resize-none placeholder:text-slate-300 font-medium" placeholder="Tempel materi teks di sini atau lampirkan gambar..." />
                    <div onClick={triggerImageSelect} className="border-2 border-dashed border-indigo-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all">
                       {aiImagePreview ? <img src={aiImagePreview} className="h-20 w-full object-cover rounded-xl" /> : <p className="text-[9px] font-black text-indigo-400 uppercase">+ Unggah Gambar Materi</p>}
                    </div>
                    <button onClick={handleAiGenerate} disabled={isGenerating} className="w-full bg-[#5b59e5] text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100 disabled:opacity-50">{isGenerating ? 'Menghasilkan Soal...' : '✨ Generate Soal AI'}</button>
                  </div>
               </div>

               <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Daftar Soal ({newExam.questions?.length || 0})</h3>
                  {newExam.questions?.map((q, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative group">
                       <p className="text-[10px] font-black text-slate-300 uppercase mb-4">Pertanyaan #{idx + 1}</p>
                       <p className="font-bold text-slate-700 text-sm leading-relaxed">{q.text}</p>
                       <button onClick={() => setNewExam({...newExam, questions: newExam.questions?.filter((_, i) => i !== idx)})} className="absolute top-4 right-4 text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all font-black text-[10px]">HAPUS</button>
                    </div>
                  ))}
                  {(!newExam.questions || newExam.questions.length === 0) && <p className="text-center py-20 text-slate-300 font-bold uppercase text-[10px] tracking-widest italic">Belum ada soal. Gunakan AI atau tambah manual.</p>}
               </div>
            </div>

            <div className="mt-10 pt-8 border-t flex justify-end gap-4">
              <button onClick={() => setShowCreateModal(false)} className="px-8 py-4 font-black text-slate-400 uppercase text-[10px]">Batal</button>
              <button onClick={saveExam} className="bg-[#1e293b] text-white px-12 py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Simpan Ujian</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
