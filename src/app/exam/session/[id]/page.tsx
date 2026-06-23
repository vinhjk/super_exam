"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExamLayout } from "@/components/layout/ExamLayout";
import { TouchCard } from "@/components/ui/TouchCard";
import {
  Loader2,
  AlertTriangle,
  FileCheck2,
  HelpCircle,
  Edit3,
  CheckCircle,
} from "lucide-react";

interface Question {
  id: string;
  type: "single" | "multi" | "essay";
  level: string;
  text: string;
  options: string[] | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ExamSessionPage({ params }: PageProps) {
  const { id: sessionId } = use(params);
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [abortConfirmOpen, setAbortConfirmOpen] = useState(false);
  const [aborting, setAborting] = useState(false);
  const [error, setError] = useState("");

  // Anti-cheat state
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);

  // Sync references
  const answersRef = useRef<Record<string, any>>({});
  const lastSavedRef = useRef<string>("");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep answersRef updated to avoid stale closures in timers
  useEffect(() => {
    answersRef.current = userAnswers;
    // Cache locally instantly
    localStorage.setItem(`session_${sessionId}_answers`, JSON.stringify(userAnswers));
  }, [userAnswers, sessionId]);

  // Load quiz configuration
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/exam/session-details?sessionId=${sessionId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load session details");
        }

        const data = await res.json();
        if (data.status !== "ongoing") {
          // Already submitted, go to history
          router.replace("/dashboard");
          return;
        }

        setTitle(data.title);
        setQuestions(data.questions || []);

        // Restore answers (Local Cache prioritized, fallback to DB state)
        const localCache = localStorage.getItem(`session_${sessionId}_answers`);
        if (localCache) {
          try {
            setUserAnswers(JSON.parse(localCache));
          } catch (e) {
            setUserAnswers(data.userAnswers || {});
          }
        } else {
          setUserAnswers(data.userAnswers || {});
        }

        // Calculate time remaining based on startedAt
        const startedTime = new Date(data.startedAt).getTime();
        const durationMs = data.duration * 60 * 1000;
        const endTime = startedTime + durationMs;
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

        setSecondsLeft(remaining);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Không thể khởi động phiên thi.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, router]);

  // Countdown ticking timer
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          // Force Submit on timeout
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Throttled Server Auto-save (Every 12 seconds check)
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(async () => {
      const answersStr = JSON.stringify(answersRef.current);
      if (answersStr === lastSavedRef.current) return; // No updates needed

      try {
        const res = await fetch("/api/exam/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userAnswers: answersRef.current,
          }),
        });

        if (res.ok) {
          lastSavedRef.current = answersStr;
          console.log("Progress saved to PostgreSQL.");
        }
      } catch (e) {
        console.error("Auto-save sync error:", e);
      }
    }, 12000);

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [sessionId]);

  // Page Visibility Listener (Anti-Cheat)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Tab was blurred
        setCheatCount((prev) => prev + 1);
        setShowCheatWarning(true);

        try {
          // Log breach to PostgreSQL immediately
          await fetch("/api/exam/visibility-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              eventDescription: `Rời khỏi màn hình thi (Chuyển Tab/Thu nhỏ trình duyệt). Lần vi phạm thứ ${cheatCount + 1}`,
            }),
          });
        } catch (e) {
          console.error("Failed to log focus breach:", e);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [sessionId, cheatCount]);

  const handleSelectAnswer = (qId: string, answerVal: any, type: "single" | "multi") => {
    setUserAnswers((prev) => {
      const currentAnswer = prev[qId];

      if (type === "single") {
        return {
          ...prev,
          [qId]: [answerVal], // Store single choices as array for API consistency
        };
      } else {
        // Multi choice
        const answersList = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
        const index = answersList.indexOf(answerVal);
        if (index > -1) {
          answersList.splice(index, 1);
        } else {
          answersList.push(answerVal);
        }
        return {
          ...prev,
          [qId]: answersList,
        };
      }
    });
  };

  const handleEssayChange = (qId: string, val: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const submitExam = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userAnswers,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Clear caches
        localStorage.removeItem(`session_${sessionId}_answers`);
        router.replace("/dashboard");
      } else {
        setError(data.error || "Nộp bài thất bại. Vui lòng liên hệ giám thị.");
        setSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi kết nối máy chủ khi nộp bài. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  const handleAbortExam = async () => {
    setAborting(true);
    setError("");
    try {
      const res = await fetch("/api/exam/abort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      if (res.ok) {
        // Clear caches
        localStorage.removeItem(`session_${sessionId}_answers`);
        router.push("/dashboard");
      } else {
        setError(data.error || "Không thể hủy bài thi. Vui lòng liên hệ giám thị.");
        setAborting(false);
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi kết nối máy chủ khi hủy bài thi. Vui lòng thử lại.");
      setAborting(false);
    }
  };

  const handleForceSubmit = async () => {
    console.log("Timer expired. Forcing submission...");
    setSubmitting(true);
    // Directly submit current answers state
    await submitExam();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Đang tải đề thi...</span>
        </div>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-100 shadow-lg">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Lỗi Tải Đề Thi</h2>
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

  const activeQuestion = questions[currentIdx];

  return (
    <>
      <ExamLayout
        title={title}
        questions={questions}
        currentQuestionIndex={currentIdx}
        onQuestionSelect={setCurrentIdx}
        secondsLeft={secondsLeft || 0}
        userAnswers={userAnswers}
        onSubmit={() => setSubmitConfirmOpen(true)}
        onAbort={() => setAbortConfirmOpen(true)}
      >
        {activeQuestion && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Badge level */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full tracking-wider">
                  Câu hỏi {currentIdx + 1} / {questions.length}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-primary-50 text-primary-600 border border-primary-100 rounded-full tracking-wider">
                  Mức độ: {activeQuestion.level}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full tracking-wider">
                  {activeQuestion.type === "essay" ? "Tự luận" : "Trắc nghiệm"}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-base md:text-lg font-bold text-slate-800 leading-relaxed">
                {activeQuestion.text}
              </h2>

              {/* Input Render Area */}
              {activeQuestion.type === "essay" ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Bài làm tự luận của bạn
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Nhập nội dung câu trả lời tự luận tại đây..."
                    value={userAnswers[activeQuestion.id] || ""}
                    onChange={(e) => handleEssayChange(activeQuestion.id, e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 bg-slate-50 text-sm leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activeQuestion.options?.map((opt, optIdx) => {
                    const letters = ["A", "B", "C", "D", "E", "F"];
                    const currentAnswer = userAnswers[activeQuestion.id];
                    const isSelected = Array.isArray(currentAnswer)
                      ? currentAnswer.includes(optIdx)
                      : false;

                    return (
                      <TouchCard
                        key={optIdx}
                        label={letters[optIdx] || String(optIdx + 1)}
                        content={opt}
                        selected={isSelected}
                        onClick={() =>
                          handleSelectAnswer(activeQuestion.id, optIdx, activeQuestion.type as "single" | "multi")
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </ExamLayout>

      {/* Visibility Cheat Warning Overlay Modal */}
      {showCheatWarning && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-rose-100 shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-200 animate-bounce">
              <AlertTriangle className="w-9 h-9 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Cảnh Báo Vi Phạm Focus!
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Hệ thống phát hiện bạn vừa rời khỏi màn hình làm bài thi (chuyển tab hoặc thu nhỏ trình duyệt). Hành vi này đã bị ghi nhận và gửi báo cáo về hệ thống giám thị.
            </p>
            <div className="bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl text-rose-700 text-xs font-bold mb-6 flex items-center gap-2">
              <span>Tổng số lần ghi nhận vi phạm:</span>
              <span className="text-base font-black text-rose-900">{cheatCount}</span>
            </div>
            <button
              onClick={() => setShowCheatWarning(false)}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-md shadow-rose-500/10 cursor-pointer"
            >
              Tôi đã hiểu và quay lại làm bài
            </button>
          </div>
        </div>
      )}

      {/* Submission Confirm Modal */}
      {submitConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-5 border border-primary-100">
              <CheckCircle className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận nộp bài</h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-6">
              Bạn có chắc chắn muốn nộp bài thi ngay bây giờ không? Đảm bảo đã rà soát tất cả câu trả lời trước khi gửi. Hành động này không thể hoàn tác.
            </p>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setSubmitConfirmOpen(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-600 cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitExam}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-md shadow-primary-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Xác nhận nộp</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abort/Cancel Confirm Modal */}
      {abortConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 border border-amber-100">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hủy bài thi hiện tại?</h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-6">
              Bạn có chắc chắn muốn hủy bài thi này để chọn đề khác không? Mọi tiến trình làm bài hiện tại sẽ không được lưu. Hành động này không thể hoàn tác.
            </p>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setAbortConfirmOpen(false)}
                disabled={aborting}
                className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-600 cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAbortExam}
                disabled={aborting}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {aborting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Xác nhận hủy</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
