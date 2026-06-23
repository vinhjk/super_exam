"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { Building2, Plus, Loader2, AlertCircle, Calendar, Hash, Users } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  _count: {
    users: number;
    templates: number;
  };
}

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [newOrgName, setNewOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const loadOrganizations = async () => {
    try {
      const res = await fetch("/api/super-admin/organizations");
      const data = await res.json();
      if (res.ok) {
        setOrganizations(data.organizations || []);
        setTotalUsers(data.totalUsers || 0);
      } else {
        setError(data.error || "Không thể tải danh sách tổ chức.");
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi kết nối hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/super-admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setNewOrgName("");
        await loadOrganizations();
      } else {
        setError(data.error || "Không thể lưu tổ chức mới.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi mạng khi liên kết tổ chức.");
    } finally {
      setAdding(false);
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
      userDisplayName={user?.displayName || "Super Admin"}
      userEmail={user?.email}
      userRole="super-admin"
      organizationName="Hệ Thống Tổng"
      onLogout={() => logout()}
    >
      <div className="space-y-8 select-none">
        {/* Title Block */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Hệ Thống Tổ Chức (Tenants)</h1>
          <p className="text-slate-400 text-xs mt-1">
            Quản trị viên cấp cao: Tạo mới tổ chức và tự động cấp mã invite code bảo mật.
          </p>
        </div>

        {/* Platform Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Tenants count */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số Tổ chức (Tenants)</p>
              <h3 className="text-xl font-black text-slate-800 mt-0.5">{organizations.length}</h3>
            </div>
          </div>

          {/* Card 2: Users count */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số User toàn hệ thống</p>
              <h3 className="text-xl font-black text-slate-800 mt-0.5">{totalUsers}</h3>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8 items-start">
          {/* Left panel: Add organization Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-800 text-sm">Thêm tổ chức mới</h2>
            <form onSubmit={handleAddOrganization} className="space-y-4">
              <div>
                <label htmlFor="orgName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tên tổ chức (Tenant Name)
                </label>
                <input
                  type="text"
                  id="orgName"
                  placeholder="VD: Trường Đại Học CNTT, Tổ Chức A"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  required
                  disabled={adding}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={adding || !newOrgName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs py-3 rounded-xl cursor-pointer shadow-md shadow-primary-500/10 transition-colors disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Lưu tổ chức</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right panel: Organizations table */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-sm">Các tổ chức hiện tại</h2>
            </div>

            {organizations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Chưa có tổ chức nào được khởi tạo trong hệ thống SaaS.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Tên tổ chức</th>
                      <th className="px-6 py-4">Mã mời (Invite Code)</th>
                      <th className="px-6 py-4 text-center">Thành viên</th>
                      <th className="px-6 py-4 text-center">Đề thi</th>
                      <th className="px-6 py-4">Ngày tạo</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                    {organizations.map((org) => {
                      const dateFormatted = new Date(org.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });

                      return (
                        <tr key={org.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800">{org.name}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg select-text">
                              {org.inviteCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">
                            {org._count.users}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">
                            {org._count.templates}
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dateFormatted}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <a
                              href={`/super-admin/organizations/${org.id}`}
                              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                            >
                              Xem chi tiết
                            </a>
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
      </div>
    </AdminLayout>
  );
}
