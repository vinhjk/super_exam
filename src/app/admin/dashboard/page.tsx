"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  FileText,
  FileQuestion,
  GraduationCap,
  Loader2,
  Calendar,
  AlertTriangle,
  Award,
  CheckCircle,
} from "lucide-react";

interface Stats {
  users: number;
  templates: number;
  questions: number;
  sessions: number;
}

interface ExamSessionItem {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  status: "ongoing" | "pending_review" | "graded";
  score: number | null;
  cheatAttempts: number;
  user: {
    displayName: string | null;
    email: string;
  };
  template: {
    title: string;
  };
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats>({ users: 0, templates: 0, questions: 0, sessions: 0 });
  const [sessions, setSessions] = useState<ExamSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard-data");
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setSessions(data.sessions || []);
      } else {
        setError(data.error || "Không thể tải dữ liệu thống kê.");
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
        {/* Title Section */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Quản Trị</h1>
          <p className="text-slate-400 text-xs mt-1">Theo dõi hoạt động học tập, làm bài và quản lý ngân hàng dữ liệu.</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-semibold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Học viên</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.users}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cấu hình đề</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.templates}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
              <FileQuestion className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Câu hỏi</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.questions}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lượt thi</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.sessions}</p>
            </div>
          </div>
        </div>

        {/* Live quiz history list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm">Danh sách học viên làm bài</h2>
            <span className="text-xs text-slate-400 font-medium">Tổng số: {sessions.length} lượt</span>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Chưa có học viên nào thực hiện bài thi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Học viên</th>
                    <th className="px-6 py-4">Đề thi</th>
                    <th className="px-6 py-4">Ngày bắt đầu</th>
                    <th className="px-6 py-4 text-center">Rời tab</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Điểm số</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                  {sessions.map((session) => {
                    const startFormatted = new Date(session.startedAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    let statusBadge = "bg-blue-50 text-blue-700 border-blue-100";
                    let statusText = "Đang làm";
                    let isPending = false;

                    if (session.status === "pending_review") {
                      statusBadge = "bg-amber-50 text-amber-700 border-amber-100";
                      statusText = "Chờ chấm tự luận";
                      isPending = true;
                    } else if (session.status === "graded") {
                      statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                      statusText = "Đã xong";
                    }

                    return (
                      <tr key={session.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-800">{session.user.displayName || "User"}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{session.user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {session.template.title}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{startFormatted}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`font-black ${
                              session.cheatAttempts > 0 ? "text-rose-600 font-extrabold" : "text-slate-400"
                            }`}
                          >
                            {session.cheatAttempts}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusBadge}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-slate-800 text-sm">
                          {session.score !== null ? `${session.score} /10` : "--"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isPending ? (
                            <button
                              onClick={() => router.push(`/admin/sessions/${session.id}/grade`)}
                              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[10px] px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
                            >
                              Chấm tự luận
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/dashboard/session/${session.id}`)}
                              className="border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 font-semibold text-[10px] px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
                            >
                              Xem chi tiết
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
