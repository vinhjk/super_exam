"use client";

import React, { useState, useEffect, useRef } from "react";
import { TimerDisplay } from "../ui/TimerDisplay";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FileCheck2,
  AlertCircle,
} from "lucide-react";

interface ExamQuestionSummary {
  id: string;
  type: string;
}

interface ExamLayoutProps {
  children: React.ReactNode;
  questions: ExamQuestionSummary[];
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
  secondsLeft: number;
  userAnswers: Record<string, any>;
  onSubmit: () => void;
  onAbort?: () => void;
  title?: string;
}

export const ExamLayout: React.FC<ExamLayoutProps> = ({
  children,
  questions,
  currentQuestionIndex,
  onQuestionSelect,
  secondsLeft,
  userAnswers,
  onSubmit,
  onAbort,
  title = "Bài thi trắc nghiệm",
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Swipe sensitivity threshold
  const minSwipeDistance = 50;

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).filter(
    (key) => userAnswers[key] !== undefined && userAnswers[key] !== "" && (Array.isArray(userAnswers[key]) ? userAnswers[key].length > 0 : true)
  ).length;

  const progressPercentage = (answeredCount / totalQuestions) * 100;

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentQuestionIndex < totalQuestions - 1) {
      // Next Question
      onQuestionSelect(currentQuestionIndex + 1);
    } else if (isRightSwipe && currentQuestionIndex > 0) {
      // Previous Question
      onQuestionSelect(currentQuestionIndex - 1);
    }

    // Reset touch variables
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getQuestionStatus = (index: number) => {
    const q = questions[index];
    const answer = userAnswers[q.id];
    const isCurrent = index === currentQuestionIndex;
    const isAnswered = answer !== undefined && answer !== "" && (Array.isArray(answer) ? answer.length > 0 : true);

    if (isCurrent) return "current";
    if (isAnswered) return "answered";
    return "unanswered";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 select-none">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white border-b border-slate-200/80 z-40 px-4 md:px-8 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm leading-tight line-clamp-1">{title}</h1>
              <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">Tiến độ: {answeredCount}/{totalQuestions} câu</p>
            </div>
          </div>

          {/* Progress Bar (Mobile) */}
          <div className="md:hidden flex-1 max-w-[180px]">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>{title}</span>
              <span>{answeredCount}/{totalQuestions}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Right Header Panel */}
          <div className="flex items-center gap-3 shrink-0">
            <TimerDisplay secondsLeft={secondsLeft} />
            {onAbort && (
              <button
                onClick={onAbort}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98] cursor-pointer"
              >
                Hủy bài thi
              </button>
            )}
            <button
              onClick={onSubmit}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98] shadow-md shadow-primary-500/10 cursor-pointer"
            >
              Nộp bài
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-8 gap-8 min-h-0">
        {/* Left Side: Question Pane */}
        <main
          className="flex-1 flex flex-col min-w-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Question card container */}
          <div className="flex-grow flex flex-col bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
            {children}
          </div>

          {/* Desktop/Mobile Bottom Navigation Bar */}
          <div className="mt-4 flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 shadow-sm shrink-0">
            <button
              onClick={() => onQuestionSelect(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            {/* Mobile Trigger for Question map bottom sheet */}
            <button
              onClick={() => setIsMapOpen(true)}
              className="md:hidden flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-primary-600 bg-primary-50 border border-primary-100 rounded-lg cursor-pointer"
            >
              <Menu className="w-4 h-4" />
              <span>Bản đồ câu hỏi ({answeredCount}/{totalQuestions})</span>
            </button>

            <span className="hidden md:inline text-xs font-semibold text-slate-400">
              Câu hỏi {currentQuestionIndex + 1} / {totalQuestions}
            </span>

            <button
              onClick={() => onQuestionSelect(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === totalQuestions - 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-800 text-xs md:text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50 disabled:hover:bg-slate-800 cursor-pointer"
            >
              <span>Câu sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* Right Side: Question Map (Desktop Only) */}
        <aside className="hidden md:flex w-80 flex-col bg-white border border-slate-100 rounded-2xl p-6 shadow-sm shrink-0 max-h-[calc(100vh-140px)] sticky top-24">
          <h2 className="font-bold text-slate-800 text-sm mb-4 tracking-tight">Bản đồ câu hỏi</h2>

          {/* Progress indicators inside map */}
          <div className="w-full bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 mb-6 text-xs text-slate-500 space-y-3">
            <div className="flex items-center justify-between font-semibold">
              <span>Hoàn thành</span>
              <span className="text-slate-800">{answeredCount} / {totalQuestions} câu ({Math.round(progressPercentage)}%)</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Questions Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(idx);
                let buttonStyle = "border-slate-200 hover:border-slate-400 text-slate-600 hover:bg-slate-50";

                if (status === "current") {
                  buttonStyle = "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/20";
                } else if (status === "answered") {
                  buttonStyle = "bg-primary-50 border-primary-200 text-primary-700 font-semibold";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => onQuestionSelect(idx)}
                    className={`
                      aspect-square rounded-xl border text-xs font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer
                      ${buttonStyle}
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Question Map Bottom Sheet */}
      {isMapOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay background */}
          <div
            onClick={() => setIsMapOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Slider bottom drawer */}
          <div className="relative bg-white border-t border-slate-200 rounded-t-3xl max-h-[75vh] flex flex-col p-6 z-10 animate-in slide-in-from-bottom duration-300">
            {/* Drawer Drag bar/Handle */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-5 shrink-0" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="font-bold text-slate-800 text-base">Bản đồ câu hỏi</h2>
              <button
                onClick={() => setIsMapOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Questions Grid scrollable */}
            <div className="flex-1 overflow-y-auto py-2">
              <div className="grid grid-cols-5 gap-3">
                {questions.map((q, idx) => {
                  const status = getQuestionStatus(idx);
                  let buttonStyle = "border-slate-200 text-slate-600 active:bg-slate-100";

                  if (status === "current") {
                    buttonStyle = "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20";
                  } else if (status === "answered") {
                    buttonStyle = "bg-primary-50 border-primary-200 text-primary-700 font-bold";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        onQuestionSelect(idx);
                        setIsMapOpen(false);
                      }}
                      className={`
                        aspect-square rounded-xl border text-sm font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer
                        min-h-[44px] min-w-[44px]
                        ${buttonStyle}
                      `}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submission alert */}
            <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Tiến trình tự động lưu. Bạn có thể nhấn nộp bài khi đã hoàn tất.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
