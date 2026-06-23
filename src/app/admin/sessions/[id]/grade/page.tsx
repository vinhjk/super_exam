"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileCheck2,
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

export default function ManualGradingPage({ params }: PageProps) {
  const { id: sessionId } = use(params);
  const { user, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const res = await fetch(`/api/exam/session-details?sessionId=${sessionId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.status !== "pending_review") {
            router.replace("/admin/dashboard");
            return;
          }

          setTitle(data.title);
          setQuestions(data.questions || []);
          setUserAnswers(data.userAnswers || {});

          // Initialize essay scores to 0
          const initialScores: Record<string, number> = {};
          (data.questions || []).forEach((q: Question) => {
            if (q.type === "essay") {
              initialScores[q.id] = 0;
            }
          });
          setEssayScores(initialScores);
        } else {
          setError(data.error || "Không thể tải chi tiết bài làm.");
        }
      } catch (e) {
        console.error(e);
        setError("Lỗi kết nối máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, router]);

  const handleScoreChange = (qId: string, val: string) => {
    let numVal = Number(val);
    if (isNaN(numVal)) numVal = 0;
    numVal = Math.min(Math.max(numVal, 0), 10); // constraint to 0-10

    setEssayScores((prev) => ({
      ...prev,
      [qId]: numVal,
    }));
  };

  const handleGradeSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/grade-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          essayScores,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Lưu điểm thất bại. Vui lòng thử lại.");
        setSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi kết nối khi lưu kết quả.");
      setSubmitting(false);
    }
  };

  const essayQuestions = questions.filter((q) => q.type === "essay");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout
      userDisplayName={user?.displayName || "Admin"}
      userEmail={user?.email}
      userRole={(user?.role as any) || "admin"}
      organizationName="Tổ Chức Quản Trị"
      onLogout={() => logout()}
    >
      <div className="space-y-8 select-none">
        {/* Header / Back Action */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Chấm Điểm Tự Luận</h1>
            <p className="text-slate-400 text-xs mt-1">Bài thi: {title}</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {essayQuestions.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 text-sm">
            Bài làm này không chứa câu hỏi tự luận để chấm điểm.
          </div>
        ) : (
          <div className="space-y-6">
            {essayQuestions.map((q, index) => {
              const answerText = userAnswers[q.id] || "";

              return (
                <div
                  key={q.id}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Câu tự luận {index + 1}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full">
                      Mức độ: {q.level}
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-800 text-sm leading-relaxed">{q.text}</h3>
                  </div>

                  {/* Candidate Answer Box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Bài làm của thí sinh:
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {answerText || "(Thí sinh không làm câu hỏi này)"}
                    </p>
                  </div>

                  {/* Grade Entry Form */}
                  <div className="flex items-center gap-4 bg-primary-50/20 border border-primary-100 p-4 rounded-xl max-w-sm">
                    <div className="flex-1">
                      <label
                        htmlFor={`score-${q.id}`}
                        className="block text-[10px] font-bold text-primary-700 uppercase tracking-wider mb-1"
                      >
                        Nhập điểm chấm (0 - 10):
                      </label>
                      <input
                        type="number"
                        id={`score-${q.id}`}
                        min="0"
                        max="10"
                        step="0.5"
                        placeholder="VD: 8.5"
                        value={essayScores[q.id] === 0 ? "" : essayScores[q.id]}
                        onChange={(e) => handleScoreChange(q.id, e.target.value)}
                        className="w-full px-3 py-2 border border-primary-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                      />
                    </div>
                    <div className="shrink-0 text-slate-400 text-xs font-black self-end pb-2.5">
                      / 10 điểm
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Submit Block */}
            <div className="bg-slate-100/50 p-6 rounded-2xl border border-slate-200 flex items-center justify-between gap-6">
              <div className="text-xs text-slate-500 font-semibold max-w-lg">
                Hệ thống sẽ tổng hợp điểm các câu tự luận với điểm trắc nghiệm đã được chấm tự động để xuất ra điểm số chung cuộc cho thí sinh.
              </div>
              <button
                onClick={handleGradeSubmit}
                disabled={submitting}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs px-6 py-3 rounded-xl cursor-pointer shadow-md shadow-primary-500/10 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <FileCheck2 className="w-4 h-4" />
                    <span>Hoàn tất & Công bố điểm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
