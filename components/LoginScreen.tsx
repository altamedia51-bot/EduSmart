
import React, { useState } from 'react';
import { UserRole, Student, AppState } from '../types.ts';

interface LoginScreenProps {
  onLogin: (role: UserRole, student?: Student) => void;
  students: Student[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, students }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [pin, setPin] = useState('');
  const [nis, setNis] = useState('');
  const [error, setError] = useState('');

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN for Teacher is '1234'
    if (pin === '1234') {
      onLogin(UserRole.TEACHER);
    } else {
      setError('PIN Salah. Silakan coba lagi (Default: 1234)');
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.nis === nis);
    if (student) {
      onLogin(UserRole.STUDENT, student);
    } else {
      setError('NIS tidak terdaftar. Pastikan NIS benar.');
    }
  };

  const resetSelection = () => {
    setSelectedRole(null);
    setPin('');
    setNis('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#5b59e5] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">EduSmart <span className="text-[#5b59e5]">AI</span></h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-slate-800">Selamat Datang</h2>
            <p className="text-slate-500 text-lg">Platform pendidikan digital cerdas untuk masa depan yang lebih baik.</p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          {!selectedRole ? (
            <div className="grid grid-cols-1 gap-4 w-full animate-in fade-in duration-300">
              <button 
                onClick={() => setSelectedRole(UserRole.TEACHER)}
                className="group relative overflow-hidden bg-white p-8 rounded-3xl border-2 border-transparent hover:border-[#5b59e5] transition-all duration-300 shadow-xl shadow-slate-200 text-left"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-4 bg-indigo-50 text-[#5b59e5] rounded-2xl group-hover:bg-[#5b59e5] group-hover:text-white transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Masuk Sebagai Guru</h3>
                <p className="text-slate-500">Akses dashboard manajemen ujian, siswa, dan laporan digital.</p>
              </button>

              <button 
                onClick={() => setSelectedRole(UserRole.STUDENT)}
                className="group relative overflow-hidden bg-white p-8 rounded-3xl border-2 border-transparent hover:border-emerald-600 transition-all duration-300 shadow-xl shadow-slate-200 text-left"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0v6m0 0l4 2.22a.45.45 0 010 .78L12 21l-4-2.22a.45.45 0 010-.78L12 20z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Masuk Sebagai Siswa</h3>
                <p className="text-slate-500">Ikuti ujian aktif dan lihat perkembangan nilai Anda secara realtime.</p>
              </button>
            </div>
          ) : (
            <div className="bg-white w-full p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
              <button 
                onClick={resetSelection}
                className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest mb-8 hover:text-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                Kembali
              </button>

              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">
                {selectedRole === UserRole.TEACHER ? 'LOGIN GURU' : 'LOGIN SISWA'}
              </h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">
                {selectedRole === UserRole.TEACHER ? 'Masukkan PIN Keamanan Anda' : 'Masukkan Nomor Induk Siswa (NIS)'}
              </p>

              <form onSubmit={selectedRole === UserRole.TEACHER ? handleTeacherLogin : handleStudentLogin} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">
                    {selectedRole === UserRole.TEACHER ? 'PIN GURU (4 DIGIT)' : 'NIS SISWA'}
                  </label>
                  <input 
                    type={selectedRole === UserRole.TEACHER ? 'password' : 'text'}
                    value={selectedRole === UserRole.TEACHER ? pin : nis}
                    onChange={(e) => {
                      if (selectedRole === UserRole.TEACHER) setPin(e.target.value);
                      else setNis(e.target.value);
                      setError('');
                    }}
                    autoFocus
                    maxLength={selectedRole === UserRole.TEACHER ? 4 : undefined}
                    placeholder={selectedRole === UserRole.TEACHER ? '••••' : 'Contoh: 12345'}
                    className="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-black text-xl text-slate-800 outline-none ring-2 ring-transparent focus:ring-[#5b59e5]/10 shadow-inner"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 ${selectedRole === UserRole.TEACHER ? 'bg-[#5b59e5] shadow-indigo-100 hover:bg-indigo-700' : 'bg-emerald-500 shadow-emerald-100 hover:bg-emerald-600'}`}
                >
                  MASUK SEKARANG
                </button>
              </form>
              
              {selectedRole === UserRole.TEACHER && (
                <p className="mt-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                  Default PIN: 1234
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
