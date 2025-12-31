
import React, { useState } from 'react';
import { Student } from '../types.ts';
import { generateReportComment } from '../services/geminiService.ts';

interface ReportGeneratorProps {
  student: Student;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ student }) => {
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerateAIComment = async () => {
    setLoading(true);
    try {
      const result = await generateReportComment(student.name, student.grades);
      setComment(result);
    } catch (error) {
      setComment("Gagal memuat komentar AI. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const scores = Object.values(student.grades) as number[];
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-12 print:p-0 shadow-2xl rounded-[2.5rem] print:shadow-none print:rounded-none">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-[900] text-[#1e293b] tracking-[0.15em] mb-1">SMADA GENIUS ACADEMY</h1>
        <p className="text-[#94a3b8] font-bold text-xs tracking-[0.2em] uppercase mb-6">Sistem Evaluasi Digital Terintegrasi</p>
        <div className="border-t-[1px] border-black mb-1"></div>
        <div className="border-t-[3px] border-black"></div>
      </div>

      {/* Student Info & Final Average */}
      <div className="flex justify-between items-start mt-12 mb-12">
        <div className="space-y-3 text-[#64748b] font-bold text-sm tracking-wide">
          <div className="grid grid-cols-[120px_10px_1fr] items-center">
            <span>NAMA SISWA</span>
            <span>:</span>
            <span className="text-[#1e293b] font-black uppercase">{student.name}</span>
          </div>
          <div className="grid grid-cols-[120px_10px_1fr] items-center">
            <span>NIS</span>
            <span>:</span>
            <span className="text-[#1e293b] font-black">{student.nis}</span>
          </div>
          <div className="grid grid-cols-[120px_10px_1fr] items-center">
            <span>PERIODE</span>
            <span>:</span>
            <span className="text-[#1e293b] font-black">Semester Ganjil 2024</span>
          </div>
        </div>

        {/* Average Score Box */}
        <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-6 w-40 text-center shadow-sm relative">
           <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2">RERATA AKHIR</p>
           <div className="bg-white border border-slate-200 rounded-xl py-4 shadow-inner">
              <span className="text-5xl font-black text-[#334155] leading-none">{avg}</span>
           </div>
        </div>
      </div>

      {/* Competency Table */}
      <div className="overflow-hidden border border-slate-200 rounded-lg mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111827] text-white text-[10px] font-black uppercase tracking-[0.15em]">
              <th className="px-6 py-5 w-[60%] border-r border-white/10">Nama Ujian / Kompetensi</th>
              <th className="px-4 py-5 text-center border-r border-white/10">KKM</th>
              <th className="px-4 py-5 text-center border-r border-white/10">Nilai</th>
              <th className="px-6 py-5 text-center">Keterangan</th>
            </tr>
          </thead>
          <tbody className="text-[#475569] font-bold text-[11px] uppercase tracking-wider">
            {/* Added explicit cast to scoreValue to fix unknown type comparison error */}
            {Object.entries(student.grades).map(([subject, scoreValue], idx) => {
              const score = scoreValue as number;
              return (
                <tr key={subject} className={idx % 2 === 1 ? 'bg-[#fcfcfd]' : 'bg-white'}>
                  <td className="px-6 py-4 border-b border-slate-100 border-r border-slate-100">
                    {String.fromCharCode(65 + idx)}. {subject} DIGITAL
                  </td>
                  <td className="px-4 py-4 text-center border-b border-slate-100 border-r border-slate-100 text-[#94a3b8]">75</td>
                  <td className="px-4 py-4 text-center border-b border-slate-100 border-r border-slate-100 font-black text-[#1e293b]">{score}</td>
                  <td className="px-6 py-4 text-center border-b border-slate-100 font-black">
                    <span className={score >= 75 ? 'text-emerald-600' : 'text-rose-500'}>
                      {score >= 75 ? 'KOMPETEN' : 'BELUM TUNTAS'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Commentary Section */}
      <div className="mb-16">
        <div className="flex justify-between items-center mb-2">
           <h3 className="text-xs font-black text-[#1e293b] uppercase tracking-widest">Catatan Evaluasi Guru</h3>
           <button 
             onClick={handleGenerateAIComment}
             disabled={loading}
             className="no-print bg-[#5b59e5] text-white text-[9px] font-black px-4 py-1.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-all uppercase tracking-widest"
           >
             {loading ? 'Sistem AI Berpikir...' : '✨ Generate Narasi AI'}
           </button>
        </div>
        <div className="border-t-2 border-black pt-4 min-h-[100px]">
          {comment ? (
            <p className="text-[#334155] text-sm leading-relaxed font-medium italic">
              "{comment}"
            </p>
          ) : (
            <p className="text-slate-300 text-[11px] font-bold uppercase tracking-widest italic py-4">
              Narasi evaluasi belum dibuat. Gunakan fitur AI untuk membuat komentar otomatis berbasis performa.
            </p>
          )}
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between items-end no-print:mb-10">
        <div className="text-center">
          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-16">Mengetahui,<br/>Orang Tua / Wali Siswa</p>
          <div className="w-48 border-b border-slate-300 mx-auto"></div>
          <p className="text-[10px] font-black text-[#1e293b] mt-2 uppercase tracking-widest">( .................................... )</p>
        </div>

        <div className="no-print">
          <button 
            onClick={handlePrint}
            className="bg-[#111827] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-xl"
          >
            Cetak Raport Digital
          </button>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-16">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Kepala Sekolah</p>
          <div className="w-48 border-b border-slate-300 mx-auto"></div>
          <p className="text-[10px] font-black text-[#1e293b] mt-2 uppercase tracking-widest">Drs. EDU SMART, M.Pd</p>
        </div>
      </div>
    </div>
  );
};
