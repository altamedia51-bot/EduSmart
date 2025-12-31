
import React, { useState, useEffect, useCallback } from 'react';
import { Exam, Question, ExamResult } from '../types.ts';

interface ExamModuleProps {
  exam: Exam;
  studentId: string;
  onFinish: (result: ExamResult) => void;
  onCancel: () => void;
}

export const ExamModule: React.FC<ExamModuleProps> = ({ exam, studentId, onFinish, onCancel }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isCheatDetected, setIsCheatDetected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => {});
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsCheatDetected(true);
        alert("PERINGATAN: Deteksi Kecurangan! Anda terdeteksi berpindah tab atau meminimalkan browser.");
      }
    };

    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) {
        setIsCheatDetected(true);
        alert("PELANGGARAN: Anda keluar dari mode Fullscreen! Ujian ini mencatat aksi Anda sebagai indikasi kecurangan.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = useCallback(() => {
    let score = 0;
    exam.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) score += 1;
    });

    const finalResult: ExamResult = {
      studentId,
      examId: exam.id,
      score: (score / (exam.questions.length || 1)) * 100,
      cheated: isCheatDetected,
      timestamp: Date.now(),
    };
    
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
    onFinish(finalResult);
  }, [answers, exam, studentId, isCheatDetected, onFinish]);

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 bg-white z-50 p-4 md:p-8 flex flex-col overflow-y-auto">
      {!isFullscreen && (
        <div className="bg-red-600 text-white p-4 rounded-2xl mb-6 flex justify-between items-center shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             <span className="font-bold">MODE FULLSCREEN WAJIB AKTIF! Keluar dari mode ini dianggap curang.</span>
          </div>
          <button onClick={requestFullscreen} className="bg-white text-red-600 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all">Masuk Fullscreen</button>
        </div>
      )}

      {isCheatDetected && (
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-xl mb-6 flex items-center gap-4">
          <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="font-bold">PELANGGARAN TERCATAT: Sistem mendeteksi aktivitas mencurigakan.</span>
        </div>
      )}

      <header className="flex justify-between items-center border-b pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100">
             {exam.title.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{exam.title}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{exam.subject}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black font-mono leading-none ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-indigo-600'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Sisa Waktu</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full flex-grow">
        {currentQuestion ? (
          <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-10 shadow-xl shadow-slate-100 mb-10">
            <div className="flex items-center gap-3 mb-8">
               <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest">Pertanyaan {currentQuestionIndex + 1} / {exam.questions.length}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-10 leading-snug">{currentQuestion.text}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => (
                <label 
                  key={idx} 
                  className={`group relative flex items-center p-6 border-2 rounded-[2rem] cursor-pointer transition-all duration-300 ${answers[currentQuestion.id] === idx ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-slate-50 border-slate-100'}`}
                >
                  <input 
                    type="radio" 
                    className="hidden" 
                    name={`q-${currentQuestion.id}`} 
                    checked={answers[currentQuestion.id] === idx} 
                    onChange={() => setAnswers({...answers, [currentQuestion.id]: idx})} 
                  />
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm mr-4 transition-all ${answers[currentQuestion.id] === idx ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`font-bold transition-colors ${answers[currentQuestion.id] === idx ? 'text-indigo-700' : 'text-slate-600'}`}>
                    {option}
                  </span>
                  {answers[currentQuestion.id] === idx && (
                    <div className="absolute right-6 w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-200"></div>
                  )}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-24 text-center">
             <p className="text-slate-400 italic">Memuat pertanyaan...</p>
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto w-full border-t border-slate-50 pt-8 flex justify-between items-center bg-white sticky bottom-0 py-6">
        <button 
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest disabled:opacity-20 hover:bg-slate-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          Kembali
        </button>

        <div className="flex gap-2">
           {exam.questions.map((_, i) => (
             <div 
               key={i} 
               onClick={() => setCurrentQuestionIndex(i)}
               className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${i === currentQuestionIndex ? 'w-8 bg-indigo-500' : answers[exam.questions[i].id] !== undefined ? 'bg-emerald-400' : 'bg-slate-200'}`}
             ></div>
           ))}
        </div>

        {currentQuestionIndex === exam.questions.length - 1 ? (
          <button 
            onClick={handleSubmit}
            className="px-12 py-3 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 active:scale-95"
          >
            Kirim Jawaban
          </button>
        ) : (
          <button 
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            className="flex items-center gap-2 px-12 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            Lanjut
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </footer>
    </div>
  );
};
