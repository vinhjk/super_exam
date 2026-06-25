"use client";

import React, { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getExamCategory, Template, Session, Category } from "../../page";
import {
  LogOut,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  Trophy,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

export default function CategoryDetailPage({ params }: PageProps) {
  const { categoryId } = use(params);
  const { user, logout } = useAuth();
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [startLoadingId, setStartLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/exam/dashboard-data");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        setSessions(data.sessions || []);
        setCategories(data.categories || []);
      } else {
        const err = await res.json();
        setError(err.error || "Không thể tải dữ liệu.");
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartExam = async (templateId: string) => {
    setStartLoadingId(templateId);
    setError("");
    try {
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/exam/session/${data.sessionId}`);
      } else {
        setError(data.error || "Không thể bắt đầu bài thi.");
        setStartLoadingId(null);
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi mạng, vui lòng kiểm tra lại kết nối.");
      setStartLoadingId(null);
    }
  };

  // Filter templates & sessions based on computed categoryId
  const filteredTemplates = templates.filter(
    (t) => getExamCategory(t.rules) === categoryId
  );

  const filteredSessions = sessions.filter(
    (s) => getExamCategory(s.template.rules) === categoryId
  );

  // Compute statistics scoped to this category
  const gradedSessions = filteredSessions.filter((s) => s.status === "graded" && s.score !== null);
  const averageScore =
    gradedSessions.length > 0
      ? Math.round((gradedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / gradedSessions.length) * 100) / 100
      : 0;

  // Get current category name
  const currentCategoryName =
    categoryId === "mixed"
      ? "Hỗn hợp"
      : categories.find((c) => c.id === categoryId)?.name || "Danh mục";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 flex flex-col font-sans">
      {/* Mobile-First Header */}
      <header className="bg-white border-b border-slate-200/80 px-4 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                  {user?.displayName?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 line-clamp-1">{user?.displayName}</h1>
              <p className="text-[10px] text-slate-400 font-medium">Học viên</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-rose-600 cursor-pointer transition-colors active:scale-95 shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Core Container */}
      <main className="max-w-xl w-full mx-auto px-4 mt-6 flex-1 space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              {currentCategoryName}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Danh mục: {categoryId === "mixed" ? "Đề thi tổng hợp nhiều chủ đề" : "Đề thi chuyên biệt"}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đã thi</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">{filteredSessions.length}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm TB</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">{averageScore} /10</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="leading-normal">{error}</span>
          </div>
        )}

        {/* Active Exams Section */}
        <section className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Đề thi khả dụng</h2>

          {filteredTemplates.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs shadow-xs">
              Hiện chưa có đề thi nào trong danh mục này được kích hoạt.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-4 transition-transform active:scale-[0.99]"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{template.title}</h3>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Thời gian: {template.duration} phút</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartExam(template.id)}
                    disabled={startLoadingId !== null}
                    className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shrink-0 cursor-pointer shadow-md shadow-primary-500/10 transition-colors"
                  >
                    {startLoadingId === template.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Bắt đầu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Exam Sessions History */}
        <section className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Lịch sử làm bài</h2>

          {filteredSessions.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs shadow-xs">
              Bạn chưa tham gia kỳ thi nào thuộc danh mục này.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const dateFormatted = new Date(session.startedAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                // Status configuration
                let statusLabel = "Đang làm";
                let statusColor = "bg-blue-50 text-blue-700 border-blue-100";
                let scoreLabel = "--";

                if (session.status === "pending_review") {
                  statusLabel = "Chờ chấm";
                  statusColor = "bg-amber-50 text-amber-700 border-amber-100";
                } else if (session.status === "graded") {
                  statusLabel = "Đã xong";
                  statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  scoreLabel = `${session.score} điểm`;
                }

                const canReview = session.status === "graded";

                return (
                  <div
                    key={session.id}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-xs leading-tight line-clamp-1">
                        {session.template.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>{dateFormatted}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {statusLabel}
                        </span>
                        <p className="text-xs font-black text-slate-700 mt-1">{scoreLabel}</p>
                      </div>

                      {canReview ? (
                        <button
                          onClick={() => router.push(`/dashboard/session/${session.id}`)}
                          className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer border border-slate-100"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="w-8 h-8 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
