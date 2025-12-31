
import React, { useState, useEffect, useCallback } from 'react';
import { Exam, Question, ExamResult } from '../types';

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => {});
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("Warning: Cheat Detection. You switched tabs.");
        setIsCheatDetected(true);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
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
      score: (score / exam.questions.length) * 100,
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
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4 flex justify-between items-center">
          <span>Fullscreen mode is required for this exam.</span>
          <button onClick={requestFullscreen} className="bg-red-600 text-white px-4 py-2 rounded">Enter Fullscreen</button>
        </div>
      )}

      <header className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{exam.title}</h1>
          <p className="text-gray-500">{exam.subject}</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-blue-600'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Remaining Time</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full flex-grow">
        <div className="bg-white border rounded-xl p-6 shadow-sm mb-8">
          <p className="text-sm text-gray-400 mb-2">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
          <h2 className="text-xl font-medium mb-6">{currentQuestion.text}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <label 
                key={idx} 
                className={`block p-4 border rounded-lg cursor-pointer transition-all ${answers[currentQuestion.id] === idx ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'hover:bg-gray-50'}`}
              >
                <input 
                  type="radio" 
                  className="hidden" 
                  name={`q-${currentQuestion.id}`} 
                  checked={answers[currentQuestion.id] === idx} 
                  onChange={() => setAnswers({...answers, [currentQuestion.id]: idx})} 
                />
                <span className="flex items-center">
                  <span className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${answers[currentQuestion.id] === idx ? 'bg-blue-600 border-blue-600' : ''}`}>
                    {answers[currentQuestion.id] === idx && <span className="w-2 h-2 bg-white rounded-full" />}
                  </span>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto w-full border-t pt-6 flex justify-between items-center bg-white sticky bottom-0 py-4">
        <button 
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 border rounded-lg text-gray-600 disabled:opacity-30"
        >
          Previous
        </button>

        {currentQuestionIndex === exam.questions.length - 1 ? (
          <button 
            onClick={handleSubmit}
            className="px-10 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            Submit Exam
          </button>
        ) : (
          <button 
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            className="px-10 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Next Question
          </button>
        )}
      </footer>
    </div>
  );
};
