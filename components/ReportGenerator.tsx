
import React, { useState } from 'react';
import { Student } from '../types';
import { generateReportComment } from '../services/geminiService';

interface ReportGeneratorProps {
  student: Student;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ student }) => {
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerateAIComment = async () => {
    setLoading(true);
    const result = await generateReportComment(student.name, student.grades);
    setComment(result);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-12 border shadow-2xl rounded-sm print:shadow-none print:border-none">
      <div className="flex justify-between items-start border-b-4 border-blue-900 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black text-blue-900 tracking-tighter mb-2">EDUSMART ACADEMY</h1>
          <p className="text-gray-500 uppercase tracking-widest text-sm">Official Academic Transcript</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-800">Date: {new Date().toLocaleDateString()}</p>
          <p className="text-gray-500">Report No: #SR-{student.id.toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="space-y-2">
          <p className="text-xs uppercase text-gray-400 font-bold">Student Name</p>
          <p className="text-xl font-bold text-gray-900 border-b pb-1">{student.name}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase text-gray-400 font-bold">Class / Year</p>
          <p className="text-xl font-bold text-gray-900 border-b pb-1">{student.class}</p>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="text-lg font-bold text-blue-900 uppercase tracking-wider mb-4">Academic Achievement</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-4 border">Subject</th>
              <th className="p-4 border text-center">Score</th>
              <th className="p-4 border text-center">Grade</th>
              <th className="p-4 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(student.grades).map(([subject, score]) => {
              // Fix: Cast score to number to resolve 'unknown' operator comparison error
              const s = score as number;
              return (
                <tr key={subject}>
                  <td className="p-4 border font-medium">{subject}</td>
                  <td className="p-4 border text-center font-bold">{s}</td>
                  <td className="p-4 border text-center font-bold text-blue-700">
                    {s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B' : 'C'}
                  </td>
                  <td className="p-4 border">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${s >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s >= 60 ? 'PASSED' : 'RETAKE'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-blue-900 uppercase tracking-wider">Educator's Commentary</h3>
          <button 
            onClick={handleGenerateAIComment}
            disabled={loading}
            className="no-print bg-blue-600 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? 'Thinking...' : '✨ Generate with AI'}
          </button>
        </div>
        <div className="min-h-[120px] p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
          {comment ? (
            <p className="text-gray-700 italic leading-relaxed text-lg">"{comment}"</p>
          ) : (
            <p className="text-gray-400 text-center py-8 italic">No comment provided. Use AI generator or write manually.</p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end mt-16 pt-8 border-t border-gray-100">
        <div className="text-center">
          <div className="w-48 border-b-2 border-gray-300 mb-2"></div>
          <p className="text-sm font-bold text-gray-800">Principal Signature</p>
        </div>
        <div className="no-print">
          <button 
            onClick={handlePrint}
            className="bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg"
          >
            Print Report
          </button>
        </div>
        <div className="text-center">
          <div className="w-48 border-b-2 border-gray-300 mb-2"></div>
          <p className="text-sm font-bold text-gray-800">School Stamp</p>
        </div>
      </div>
    </div>
  );
};
