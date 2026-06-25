"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";

export interface Template {
  id: string;
  title: string;
  duration: number;
  isActive: boolean;
  rules?: any;
}

export interface Session {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  status: "ongoing" | "pending_review" | "graded";
  score: number | null;
  template: {
    title: string;
    duration: number;
    rules?: any;
  };
}

export interface Category {
  id: string;
  name: string;
}

// CHỈ THỊ 2: LOGIC PARSE JSON BẰNG LẬP TRÌNH PHÒNG THỦ
export const getExamCategory = (rules: any): string => {
  try {
    if (!rules) return "mixed";
    let parsedRules = rules;
    if (typeof rules === "string") {
      parsedRules = JSON.parse(rules);
    }
    if (!Array.isArray(parsedRules)) {
      return "mixed";
    }
    // Lọc loại bỏ các rule rác
    const validRules = parsedRules.filter(
      (rule) => rule != null && typeof rule === "object" && typeof rule.categoryId === "string"
    );
    const categoryIds = validRules.map((rule) => rule.categoryId);
    const uniqueIds = new Set(categoryIds);
    if (uniqueIds.size === 1) {
      return Array.from(uniqueIds)[0];
    }
    return "mixed";
  } catch (error) {
    console.error("Failed to parse or evaluate rules:", error);
    return "mixed";
  }
};

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

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

  // Compute statistics
  const gradedSessions = sessions.filter((s) => s.status === "graded" && s.score !== null);
  const averageScore =
    gradedSessions.length > 0
      ? Math.round((gradedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / gradedSessions.length) * 100) / 100
      : 0;

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
        {error && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="leading-normal">{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đã thi</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">{sessions.length}</p>
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

        {/* Category Cards Grid */}
        <section className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">Danh mục đề thi</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const count = templates.filter(t => getExamCategory(t.rules) === cat.id).length;
              return (
                <Link
                  key={cat.id}
                  href={`/dashboard/categories/${cat.id}`}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100 group-hover:bg-primary-100 transition-colors shrink-0">
                    <BookOpen className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-primary-700 transition-colors truncate">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {count} đề thi khả dụng
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Link>
              );
            })}

            {/* Card tĩnh "Hỗn hợp" */}
            {(() => {
              const count = templates.filter(t => getExamCategory(t.rules) === "mixed").length;
              return (
                <Link
                  href="/dashboard/categories/mixed"
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-100 transition-colors shrink-0">
                    <Award className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-indigo-700 transition-colors truncate">
                      Hỗn hợp
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {count} đề thi khả dụng
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Link>
              );
            })()}
          </div>
        </section>
      </main>
    </div>
  );
}
