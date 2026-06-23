"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Calendar,
} from "lucide-react";

interface ReviewQuestion {
  id: string;
  type: "single" | "multi" | "essay";
  level: string;
  text: string;
  options: string[] | null;
  correctAnswers: number[] | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ExamReviewPage({ params }: PageProps) {
  const { id: sessionId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await fetch(`/api/exam/review?sessionId=${sessionId}`);
        const result = await res.json();
        if (res.ok && result.success) {
          setData(result);
        } else {
          setError(result.error || "Không thể tải kết quả bài thi.");
        }
      } catch (e) {
        console.error(e);
        setError("Lỗi kết nối máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-100 shadow-lg">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Lỗi Tải Kết Quả</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.replace("/dashboard")}
            className="bg-primary-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl cursor-pointer"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { title, score, userAnswers, questions, startedAt, submittedAt, cheatAttempts } = data;

  const dateFormatted = new Date(startedAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans select-none">
      {/* Header bar */}
      <header className="bg-white border-b border-slate-200/80 px-4 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-800 line-clamp-1">Xem lại bài thi</h1>
            <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{title}</p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto px-4 mt-6 space-y-6">
        {/* Score Panel */}
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
            <Trophy className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{score !== null ? `${score} / 10` : "Chờ Chấm"}</h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Kết quả bài làm</p>

          <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs font-semibold text-slate-500">
            <div className="flex flex-col items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Ngày thi: {dateFormatted}</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-l border-slate-100">
              <AlertTriangle className={`w-4 h-4 ${cheatAttempts > 0 ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
              <span>Số lần rời tab: {cheatAttempts}</span>
            </div>
          </div>
        </section>

        {/* Detailed Question Review */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Chi tiết câu hỏi</h2>

          {questions.map((q: ReviewQuestion, idx: number) => {
            const userAnswer = userAnswers[q.id];
            const correctAnswers = q.correctAnswers || [];

            // Check if correct
            let isCorrect = false;
            if (q.type === "single") {
              const uAnsIndex = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
              const cAnsIndex = correctAnswers[0];
              isCorrect = uAnsIndex !== undefined && Number(uAnsIndex) === Number(cAnsIndex);
            } else if (q.type === "multi") {
              const uAnsArray = Array.isArray(userAnswer) ? userAnswer.map(Number).sort() : [];
              const cAnsArray = correctAnswers.map(Number).sort();
              isCorrect =
                uAnsArray.length === cAnsArray.length &&
                uAnsArray.every((val, i) => val === cAnsArray[i]);
            }

            return (
              <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                {/* Question Info */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Câu hỏi {idx + 1} &bull; {q.type === "essay" ? "Tự luận" : "Trắc nghiệm"}
                  </span>
                  {q.type !== "essay" && (
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        isCorrect
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đúng</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Sai</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-slate-800 leading-relaxed">{q.text}</p>

                {/* Option renders */}
                {q.type === "essay" ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bài làm tự luận:</p>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {userAnswer || "(Không có nội dung câu trả lời)"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {q.options?.map((opt, optIdx) => {
                      const isUserSelected = Array.isArray(userAnswer)
                        ? userAnswer.includes(optIdx)
                        : Number(userAnswer) === optIdx;
                      const isCorrectChoice = correctAnswers.includes(optIdx);

                      let optionStyle = "border-slate-100 bg-slate-50/50 text-slate-700";
                      let badge = null;

                      if (isCorrectChoice) {
                        optionStyle = "border-emerald-500 bg-emerald-50/40 text-emerald-800 font-semibold";
                        badge = <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">Đáp án đúng</span>;
                      } else if (isUserSelected && !isCorrectChoice) {
                        optionStyle = "border-rose-300 bg-rose-50/30 text-rose-800";
                        badge = <span className="text-[9px] font-bold uppercase text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-md">Bạn chọn</span>;
                      }

                      if (isUserSelected && isCorrectChoice) {
                        badge = (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">Bạn chọn đúng</span>
                          </div>
                        );
                      }

                      const letters = ["A", "B", "C", "D", "E", "F"];

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs ${optionStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-black text-slate-400">{letters[optIdx]}.</span>
                            <span>{opt}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
