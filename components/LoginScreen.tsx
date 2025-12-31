
import React from 'react';
import { UserRole } from '../types';

interface LoginScreenProps {
  onSelectRole: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">EduSmart <span className="text-blue-600">AI</span></h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-slate-800">Selamat Datang</h2>
            <p className="text-slate-500 text-lg">Silakan pilih akses masuk untuk mengelola atau mengikuti pembelajaran digital Anda.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => onSelectRole(UserRole.TEACHER)}
            className="group relative overflow-hidden bg-white p-8 rounded-3xl border-2 border-transparent hover:border-blue-600 transition-all duration-300 shadow-xl shadow-slate-200 text-left"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-slate-300 group-hover:text-blue-600 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Guru</h3>
            <p className="text-slate-500">Kelola ujian, nilai siswa, dan buat raport otomatis berbasis AI.</p>
          </button>

          <button 
            onClick={() => onSelectRole(UserRole.STUDENT)}
            className="group relative overflow-hidden bg-white p-8 rounded-3xl border-2 border-transparent hover:border-emerald-600 transition-all duration-300 shadow-xl shadow-slate-200 text-left"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0v6m0 0l4 2.22a.45.45 0 010 .78L12 21l-4-2.22a.45.45 0 010-.78L12 20z" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-slate-300 group-hover:text-emerald-600 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Siswa</h3>
            <p className="text-slate-500">Akses ujian, pantau nilai, dan lihat progres belajar Anda.</p>
          </button>
        </div>
      </div>
    </div>
  );
};
