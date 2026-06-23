"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Loader2,
  ArrowLeft,
  Users,
  Shield,
  Calendar,
  Mail,
  User as UserIcon,
  AlertCircle,
  Building2,
} from "lucide-react";

interface UserRecord {
  id: string;
  email: string;
  role: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrganizationDetailsPage({ params }: PageProps) {
  const { id: orgId } = use(params);
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();

  const [org, setOrg] = useState<Organization | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const loadOrgData = async () => {
    try {
      const res = await fetch(`/api/super-admin/organizations/${orgId}/users`);
      const data = await res.json();
      if (res.ok) {
        setOrg(data.organization);
        setUsers(data.users || []);
      } else {
        setError(data.error || "Không thể tải thông tin tổ chức.");
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi kết nối hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgData();
  }, [orgId]);

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setActionUserId(userId);
    setError("");

    try {
      const res = await fetch(`/api/super-admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update user state locally
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        setError(data.error || "Không thể cập nhật quyền hạn.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối khi thay đổi quyền.");
    } finally {
      setActionUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout
      userDisplayName={currentUser?.displayName || "Super Admin"}
      userEmail={currentUser?.email}
      userRole="super-admin"
      organizationName="Hệ Thống Tổng"
      onLogout={() => logout()}
    >
      <div className="space-y-8 select-none">
        {/* Navigation & Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/super-admin/dashboard")}
            className="p-2 rounded-xl bg-white border border-slate-100 shadow-xs hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Chi Tiết Tổ Chức</h1>
            <p className="text-slate-400 text-xs mt-1">
              Xem thông tin thành viên và điều chỉnh quyền hạn người dùng của tổ chức.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {org && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Organization Stats Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">{org.name}</h2>
                  <p className="text-[10px] font-medium text-slate-400">Tổ chức/Doanh nghiệp</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Mã mời (Invite Code):</span>
                  <span className="font-mono font-bold bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg select-text">
                    {org.inviteCode}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Thành viên:</span>
                  <span className="font-bold text-slate-800">{users.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Ngày tạo:</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(org.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate List Data Table */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <h2 className="font-bold text-slate-800 text-sm">Danh sách thành viên</h2>
                </div>
                <span className="bg-slate-100 text-slate-600 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase">
                  {users.length} Thành viên
                </span>
              </div>

              {users.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Chưa có thành viên nào tham gia tổ chức này qua invite code.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4">Họ và Tên</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Vai trò</th>
                        <th className="px-6 py-4">Ngày gia nhập</th>
                        <th className="px-6 py-4 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                      {users.map((member) => {
                        const isChanging = actionUserId === member.id;
                        const joinDate = new Date(member.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        });

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {member.photoURL ? (
                                  <img
                                    src={member.photoURL}
                                    alt="Avatar"
                                    className="w-7 h-7 rounded-full object-cover border border-slate-100"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                    <UserIcon className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <span className="font-bold text-slate-800">
                                  {member.displayName || "Chưa cập nhật"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-semibold select-text">
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{member.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                  member.role === "admin"
                                    ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                <Shield className="w-3 h-3 shrink-0" />
                                <span>{member.role === "admin" ? "Admin" : "User"}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-semibold">
                              <span>{joinDate}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleUpdateRole(member.id, member.role)}
                                disabled={isChanging}
                                className={`inline-flex items-center gap-1.5 font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-colors cursor-pointer border ${
                                  member.role === "admin"
                                    ? "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
                                } disabled:opacity-50`}
                              >
                                {isChanging ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : member.role === "admin" ? (
                                  "Hạ cấp (User)"
                                ) : (
                                  "Thăng cấp (Admin)"
                                )}
                              </button>
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
        )}
      </div>
    </AdminLayout>
  );
}
