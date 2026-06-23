"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { FolderKanban, Plus, Loader2, AlertCircle, Calendar } from "lucide-react";

interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export default function CategoriesPage() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
      } else {
        setError(data.error || "Không thể tải danh mục.");
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setNewCatName("");
        // Reload list
        await loadCategories();
      } else {
        setError(data.error || "Không thể lưu danh mục mới.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi mạng khi lưu danh mục.");
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
      userDisplayName={user?.displayName || "Admin"}
      userEmail={user?.email}
      userRole={(user?.role as any) || "admin"}
      organizationName="Tổ Chức Quản Trị"
      onLogout={() => logout()}
    >
      <div className="space-y-8 select-none">
        {/* Title Block */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Chủ Đề & Danh Mục</h1>
            <p className="text-slate-400 text-xs mt-1">Phân loại câu hỏi theo chủ đề chính của tổ chức.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8 items-start">
          {/* Left panel: Add Category Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-800 text-sm">Thêm danh mục mới</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label htmlFor="catName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tên danh mục chủ đề
                </label>
                <input
                  type="text"
                  id="catName"
                  placeholder="VD: Toán Giải Tích, Lịch Sử Đảng"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  disabled={adding}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={adding || !newCatName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs py-3 rounded-xl cursor-pointer shadow-md shadow-primary-500/10 transition-colors disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Lưu danh mục</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right panel: Categories list table */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-sm">Danh mục hiện có</h2>
            </div>

            {categories.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Chưa có danh mục chủ đề nào được tạo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Mã danh mục</th>
                      <th className="px-6 py-4">Tên chủ đề</th>
                      <th className="px-6 py-4">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                    {categories.map((cat) => {
                      const dateFormatted = new Date(cat.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{cat.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{cat.name}</td>
                          <td className="px-6 py-4 text-slate-500 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dateFormatted}</span>
                            </div>
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
