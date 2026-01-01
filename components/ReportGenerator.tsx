
import React, { useState, useMemo } from 'react';
import { Student, ReportSettings, ExamResult, Submission, AppState } from '../types.ts';
import { generateReportComment } from '../services/geminiService.ts';

interface ReportGeneratorProps {
  student: Student;
  settings: ReportSettings;
  results: ExamResult[];
  submissions: Submission[];
  exams: AppState['exams'];
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ student, settings, results, submissions, exams }) => {
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Mengelompokkan data untuk Bagian A (Ujian) dan B (Tugas)
  const sectionA = useMemo(() => {
    return results
      .filter(r => r.studentId === student.id)
      .map(r => ({
        name: exams.find(e => e.id === r.examId)?.title || 'Ujian Digital',
        kkm: exams.find(e => e.id === r.examId)?.kkm || 75,
        score: r.score
      }));
  }, [results, student.id, exams]);

  const sectionB = useMemo(() => {
    return submissions
      .filter(s => s.studentId === student.id && s.status === 'GRADED')
      .map(s => ({
        name: s.subject,
        kkm: 75,
        score: s.score || 0
      }));
  }, [submissions, student.id]);

  // Kalkulasi rata-rata per bagian
  const avgA = sectionA.length > 0 ? Math.round(sectionA.reduce((a, b) => a + b.score, 0) / sectionA.length) : 0;
  const avgB = sectionB.length > 0 ? Math.round(sectionB.reduce((a, b) => a + b.score, 0) / sectionB.length) : 0;
  
  // Kalkulasi rata-rata keseluruhan
  const allScores = [...sectionA.map(i => i.score), ...sectionB.map(i => i.score)];
  const avgTotal = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

  // Logika Predikat Nilai
  const getLetterGrade = (score: number) => {
    if (score >= 90) return { label: 'A', color: 'text-emerald-600', desc: 'Sangat Baik' };
    if (score >= 80) return { label: 'B', color: 'text-blue-600', desc: 'Baik' };
    if (score >= 75) return { label: 'C', color: 'text-amber-600', desc: 'Cukup' };
    return { label: 'D', color: 'text-rose-600', desc: 'Perlu Bimbingan' };
  };

  const grade = getLetterGrade(avgTotal);

  const handleGenerateAIComment = async () => {
    setLoading(true);
    try {
      const allGrades: Record<string, number> = {};
      sectionA.forEach(item => allGrades[item.name] = item.score);
      sectionB.forEach(item => allGrades[item.name] = item.score);
      
      const result = await generateReportComment(student.name, allGrades);
      setComment(result);
    } catch (error) {
      setComment("Gagal memuat komentar AI. Silakan pastikan API_KEY terkonfigurasi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-12 print:p-0 shadow-2xl rounded-[1rem] print:shadow-none print:rounded-none font-sans text-slate-900 border border-slate-100">
      {/* Header Kop Surat */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-[#1e293b] tracking-[0.2em] mb-2 uppercase">{settings.schoolName}</h1>
        <p className="text-[#64748b] font-bold text-[10px] tracking-[0.3em] uppercase mb-8">LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPORT DIGITAL)</p>
        
        <div className="border-t-[1px] border-slate-800 mb-[2px]"></div>
        <div className="border-t-[3px] border-slate-800"></div>
      </div>

      {/* Info Siswa & Box Nilai Akhir */}
      <div className="flex justify-between items-center mb-14 px-2">
        <div className="space-y-3 text-slate-500 font-bold text-sm">
          <div className="grid grid-cols-[140px_20px_1fr] items-center">
            <span className="uppercase tracking-wider text-[11px]">NAMA SISWA</span>
            <span>:</span>
            <span className="text-slate-900 font-black uppercase text-lg">{student.name}</span>
          </div>
          <div className="grid grid-cols-[140px_20px_1fr] items-center">
            <span className="uppercase tracking-wider text-[11px]">NIS / KELAS</span>
            <span>:</span>
            <span className="text-slate-900 font-black uppercase">{student.nis} / {student.class}</span>
          </div>
          <div className="grid grid-cols-[140px_20px_1fr] items-center">
            <span className="uppercase tracking-wider text-[11px]">PERIODE</span>
            <span>:</span>
            <span className="text-slate-900 font-black">{settings.period}</span>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Box Predikat */}
          <div className="bg-[#f8fafc] border border-slate-100 rounded-[2rem] p-5 w-32 text-center shadow-sm flex flex-col justify-center">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">PREDIKAT</p>
             <span className={`text-5xl font-black leading-none ${grade.color}`}>{grade.label}</span>
             <p className={`text-[7px] font-black uppercase mt-1 ${grade.color}`}>{grade.desc}</p>
          </div>
          
          {/* Box Rerata Utama */}
          <div className="bg-[#111827] text-white rounded-[2rem] p-6 w-44 text-center shadow-xl shadow-slate-200">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">RERATA AKHIR</p>
             <span className="text-7xl font-black leading-none">{avgTotal}</span>
          </div>
        </div>
      </div>

      {/* Tabel Capaian Kompetensi */}
      <div className="overflow-hidden border border-slate-200 rounded-xl mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111827] text-white text-[11px] font-black uppercase tracking-[0.15em]">
              <th className="px-8 py-5 w-[50%]">KOMPONEN EVALUASI</th>
              <th className="px-4 py-5 text-center">KKM</th>
              <th className="px-4 py-5 text-center">NILAI</th>
              <th className="px-8 py-5 text-center">KETERANGAN</th>
            </tr>
          </thead>
          <tbody className="text-[12px] font-bold text-slate-700">
            {/* Bagian A */}
            <tr className="bg-slate-50">
               <td colSpan={4} className="px-8 py-4 font-black text-[10px] text-slate-500 uppercase tracking-widest flex justify-between bg-slate-100/50">
                 <span>A. HASIL UJIAN HARIAN BERBASIS DIGITAL</span>
                 <span>SUB-RERATA: {avgA}</span>
               </td>
            </tr>
            {sectionA.length > 0 ? sectionA.map((item, idx) => (
              <tr key={`a-${idx}`} className="border-t border-slate-100">
                <td className="px-12 py-5 font-black text-slate-800 uppercase">{item.name}</td>
                <td className="px-4 py-5 text-center text-slate-400 font-mono">{item.kkm}</td>
                <td className="px-4 py-5 text-center font-black text-slate-900 text-lg">{item.score}</td>
                <td className="px-8 py-5 text-center">
                   <span className={`font-black uppercase tracking-widest text-[10px] ${item.score >= item.kkm ? 'text-emerald-600' : 'text-rose-500'}`}>
                     {item.score >= item.kkm ? 'Tuntas' : 'Remidial'}
                   </span>
                </td>
              </tr>
            )) : (
              <tr className="border-t border-slate-100">
                <td colSpan={4} className="px-12 py-5 text-slate-300 italic">Data ujian belum tersedia</td>
              </tr>
            )}

            {/* Bagian B */}
            <tr className="bg-slate-50 border-t border-slate-200">
               <td colSpan={4} className="px-8 py-4 font-black text-[10px] text-slate-500 uppercase tracking-widest flex justify-between bg-slate-100/50">
                 <span>B. CAPAIAN TUGAS MANDIRI TERSTRUKTUR</span>
                 <span>SUB-RERATA: {avgB}</span>
               </td>
            </tr>
            {sectionB.length > 0 ? sectionB.map((item, idx) => (
              <tr key={`b-${idx}`} className="border-t border-slate-100">
                <td className="px-12 py-5 font-black text-slate-800 uppercase">{item.name}</td>
                <td className="px-4 py-5 text-center text-slate-400 font-mono">{item.kkm}</td>
                <td className="px-4 py-5 text-center font-black text-slate-900 text-lg">{item.score}</td>
                <td className="px-8 py-5 text-center">
                   <span className={`font-black uppercase tracking-widest text-[10px] ${item.score >= item.kkm ? 'text-emerald-600' : 'text-rose-500'}`}>
                     {item.score >= item.kkm ? 'Tuntas' : 'Remidial'}
                   </span>
                </td>
              </tr>
            )) : (
              <tr className="border-t border-slate-100">
                <td colSpan={4} className="px-12 py-5 text-slate-300 italic">Data tugas belum tersedia</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bagian Komentar AI */}
      <div className="mb-20 px-2">
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Narasi Evaluasi Pembimbing</h3>
           <button 
             onClick={handleGenerateAIComment}
             disabled={loading}
             className="no-print bg-[#5b59e5] text-white text-[9px] font-black px-6 py-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-all uppercase tracking-widest shadow-md"
           >
             {loading ? 'AI Sedang Menganalisis...' : '✨ Buat Narasi Berbasis AI'}
           </button>
        </div>
        <div className="border-t-2 border-slate-900 pt-6 min-h-[100px] bg-slate-50/50 p-6 rounded-xl">
          {comment ? (
            <p className="text-slate-800 text-sm leading-relaxed font-medium italic">
              "{comment}"
            </p>
          ) : (
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] italic text-center">
              Belum ada narasi. Gunakan tombol di atas untuk generate otomatis.
            </p>
          )}
        </div>
      </div>

      {/* Tanda Tangan */}
      <div className="flex justify-between items-end px-2">
        <div className="text-center w-64">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-24">Mengetahui,<br/>Orang Tua / Wali Siswa</p>
          <div className="border-b border-slate-800 mx-auto"></div>
          <p className="text-[11px] font-black text-slate-900 mt-3 uppercase tracking-widest">( ............................................ )</p>
        </div>

        <div className="no-print mb-4">
          <button 
            onClick={handlePrint}
            className="bg-[#111827] text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-xl active:scale-95"
          >
            Cetak Raport Digital
          </button>
        </div>

        <div className="text-center w-64">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-24">
            {settings.city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>{settings.signatoryTitle}
          </p>
          <div className="border-b border-slate-800 mx-auto"></div>
          <p className="text-[11px] font-black text-slate-900 mt-3 uppercase tracking-widest">Drs. EDU SMART, M.Pd</p>
        </div>
      </div>
    </div>
  );
};
