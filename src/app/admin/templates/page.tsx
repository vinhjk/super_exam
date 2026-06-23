"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  HelpCircle,
  FolderKanban,
  CheckCircle,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Rule {
  categoryId: string;
  type: "single" | "multi" | "essay";
  level: string;
  count: number;
}

interface Template {
  id: string;
  title: string;
  duration: number;
  isActive: boolean;
  rules: Rule[];
}

export default function TemplatesPage() {
  const { user, logout } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Edit / Create Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);

  const loadData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        fetch("/api/admin/templates"),
        fetch("/api/admin/categories"),
      ]);

      if (tRes.ok && cRes.ok) {
        const tData = await tRes.json();
        const cData = await cRes.json();
        setTemplates(tData.templates || []);
        setCategories(cData.categories || []);
      } else {
        setError("Không thể tải cấu hình đề thi.");
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

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setDuration(60);
    setIsActive(false);
    setRules([]);
    setShowForm(true);
  };

  const handleOpenEdit = (template: Template) => {
    setEditingId(template.id);
    setTitle(template.title);
    setDuration(template.duration);
    setIsActive(template.isActive);
    setRules(template.rules || []);
    setShowForm(true);
  };

  const handleAddRule = () => {
    if (categories.length === 0) return;
    setRules((prev) => [
      ...prev,
      {
        categoryId: categories[0].id,
        type: "single",
        level: "easy",
        count: 5,
      },
    ]);
  };

  const handleRemoveRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRuleChange = (idx: number, field: keyof Rule, val: any) => {
    setRules((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        [field]: field === "count" ? Number(val) : val,
      };
      return updated;
    });
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || duration <= 0) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: title.trim(),
          duration,
          isActive,
          rules,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowForm(false);
        await loadData();
      } else {
        setError(data.error || "Không thể lưu cấu hình đề thi.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối máy chủ khi lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: template.id,
          title: template.title,
          duration: template.duration,
          isActive: !template.isActive,
          rules: template.rules,
        }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (e) {
      console.error(e);
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
        {/* Title Action */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cấu Hình Đề Thi</h1>
            <p className="text-slate-400 text-xs mt-1">
              Thiết lập quy tắc chọn câu hỏi ngẫu nhiên (Matrix) từ ngân hàng đề cho thí sinh.
            </p>
          </div>

          {!showForm && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-primary-500/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo cấu hình mới</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Template Form Container */}
        {showForm && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <h2 className="font-bold text-slate-800 text-sm">
              {editingId ? "Chỉnh sửa cấu hình" : "Thêm cấu hình mới"}
            </h2>
            <form onSubmit={handleSaveTemplate} className="space-y-6">
              <div className="grid grid-cols-3 gap-6 items-center">
                <div>
                  <label htmlFor="tempTitle" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Tiêu đề bài kiểm tra
                  </label>
                  <input
                    type="text"
                    id="tempTitle"
                    placeholder="VD: Kiểm Tra Giữa Kỳ Toán"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label htmlFor="tempDur" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Thời gian làm bài (Phút)
                  </label>
                  <input
                    type="number"
                    id="tempDur"
                    min="1"
                    placeholder="VD: 45"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="flex items-center gap-2 cursor-pointer focus:outline-none"
                  >
                    {isActive ? (
                      <ToggleRight className="w-9 h-9 text-primary-600" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-300" />
                    )}
                    <span className="text-xs font-bold text-slate-600">Phát hành ngay</span>
                  </button>
                </div>
              </div>

              {/* Matrix rules builder */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700">Ma trận câu hỏi (Matrix Rules)</h3>
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm quy tắc</span>
                  </button>
                </div>

                {rules.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 p-8 rounded-xl text-center text-slate-400 text-xs">
                    Hãy bấm thêm quy tắc để thiết lập phân phối câu hỏi.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100"
                      >
                        {/* Category selection */}
                        <div className="flex-1">
                          <select
                            value={rule.categoryId}
                            onChange={(e) => handleRuleChange(idx, "categoryId", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Question type selection */}
                        <div>
                          <select
                            value={rule.type}
                            onChange={(e) => handleRuleChange(idx, "type", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                          >
                            <option value="single">Trắc nghiệm (1 đáp án)</option>
                            <option value="multi">Trắc nghiệm (Nhiều đáp án)</option>
                            <option value="essay">Tự luận</option>
                          </select>
                        </div>

                        {/* Difficulty selection */}
                        <div>
                          <select
                            value={rule.level}
                            onChange={(e) => handleRuleChange(idx, "level", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                          >
                            <option value="easy">Dễ</option>
                            <option value="medium">Trung bình</option>
                            <option value="hard">Khá</option>
                            <option value="advanced">Nâng cao</option>
                          </select>
                        </div>

                        {/* Count input */}
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            placeholder="Số câu"
                            value={rule.count}
                            onChange={(e) => handleRuleChange(idx, "count", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                          />
                        </div>

                        {/* Remove action button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form submit/abort buttons */}
              <div className="flex justify-end gap-4 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-500 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-primary-500/10 flex items-center gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Lưu cấu hình đề</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Templates lists */}
        <div className="grid grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">
                    {template.title}
                  </h3>
                  <button
                    onClick={() => handleToggleActive(template)}
                    className="focus:outline-none shrink-0"
                  >
                    {template.isActive ? (
                      <ToggleRight className="w-8 h-8 text-primary-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300" />
                    )}
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Mã đề: {template.id}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300 hidden" />
                  <span>Thời gian: {template.duration} phút</span>
                </div>
                <button
                  onClick={() => handleOpenEdit(template)}
                  className="text-primary-600 hover:text-primary-700 cursor-pointer font-bold"
                >
                  Thiết lập Ma trận
                </button>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="col-span-3 bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400 text-sm shadow-xs">
              Chưa có cấu hình đề thi nào được tạo. Nhấn "Tạo cấu hình mới" để bắt đầu.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
