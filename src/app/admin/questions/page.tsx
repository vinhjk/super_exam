"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  FileQuestion,
  Plus,
  ArrowUpRight,
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

interface Question {
  id: string;
  type: string;
  level: string;
  text: string;
  options: string[] | null;
  correctAnswers: number[] | null;
  category: {
    name: string;
  };
}

export default function QuestionsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"single" | "multi" | "essay">("single");
  const [level, setLevel] = useState("easy");
  const [optionInputs, setOptionInputs] = useState<string[]>(["", "", "", ""]);
  const [correctSelections, setCorrectSelections] = useState<boolean[]>([false, false, false, false]);

  const loadData = async () => {
    try {
      const [qRes, cRes] = await Promise.all([
        fetch("/api/admin/questions"),
        fetch("/api/admin/categories"),
      ]);

      if (qRes.ok && cRes.ok) {
        const qData = await qRes.json();
        const cData = await cRes.json();
        setQuestions(qData.questions || []);
        setCategories(cData.categories || []);
        if (cData.categories?.length > 0) {
          setCategoryId(cData.categories[0].id);
        }
      } else {
        setError("Không thể tải thông tin ngân hàng câu hỏi.");
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

  const handleOptionChange = (idx: number, val: string) => {
    setOptionInputs((prev) => {
      const updated = [...prev];
      updated[idx] = val;
      return updated;
    });
  };

  const handleCorrectToggle = (idx: number) => {
    setCorrectSelections((prev) => {
      const updated = [...prev];
      if (type === "single") {
        // Clear others
        return updated.map((v, i) => i === idx);
      }
      updated[idx] = !updated[idx];
      return updated;
    });
  };

  const handleTypeChange = (newType: "single" | "multi" | "essay") => {
    setType(newType);
    if (newType === "single") {
      setCorrectSelections([true, false, false, false]); // default single correct choice
    } else {
      setCorrectSelections([false, false, false, false]);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !categoryId) return;

    setSaving(true);
    setError("");

    // Prepare payload
    let options: string[] | null = null;
    let correctAnswers: number[] | null = null;

    if (type !== "essay") {
      // Filter out empty options
      const activeOptions = optionInputs.map((o) => o.trim()).filter((o) => o.length > 0);
      if (activeOptions.length < 2) {
        setError("Vui lòng nhập tối thiểu 2 lựa chọn đáp án.");
        setSaving(false);
        return;
      }

      const indices: number[] = [];
      correctSelections.forEach((val, idx) => {
        if (val && idx < activeOptions.length) {
          indices.push(idx);
        }
      });

      if (indices.length === 0) {
        setError("Vui lòng chọn tối thiểu 1 lựa chọn đáp án đúng.");
        setSaving(false);
        return;
      }

      options = activeOptions;
      correctAnswers = indices;
    }

    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          type,
          level,
          text: text.trim(),
          options,
          correctAnswers,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Reset form
        setText("");
        setOptionInputs(["", "", "", ""]);
        setCorrectSelections([false, false, false, false]);
        setShowAddForm(false);
        // Reload list
        await loadData();
      } else {
        setError(data.error || "Không thể lưu câu hỏi.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối máy chủ khi lưu câu hỏi.");
    } finally {
      setSaving(false);
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
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Ngân Hàng Câu Hỏi</h1>
            <p className="text-slate-400 text-xs mt-1">Quản lý kho dữ liệu kiểm tra, nhập mới thủ công hoặc bulk-import.</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push("/admin/questions/import")}
              className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
              <span>Import từ Word (Aiken)</span>
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-primary-500/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Manual Add Form Toggle */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
            <h2 className="font-bold text-slate-800 text-sm">Thêm câu hỏi mới</h2>
            <form onSubmit={handleSaveQuestion} className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label htmlFor="cat" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Danh mục chủ đề
                  </label>
                  <select
                    id="cat"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="qType" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Loại câu hỏi
                  </label>
                  <select
                    id="qType"
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="single">Trắc nghiệm (1 đáp án)</option>
                    <option value="multi">Trắc nghiệm (Nhiều đáp án)</option>
                    <option value="essay">Tự luận</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="qLevel" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Mức độ khó
                  </label>
                  <select
                    id="qLevel"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khá</option>
                    <option value="advanced">Nâng cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="qText" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Đề bài câu hỏi
                </label>
                <textarea
                  id="qText"
                  rows={3}
                  placeholder="Nhập nội dung đề bài tại đây..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  className="w-full p-4 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50"
                />
              </div>

              {/* MCQ Options grid */}
              {type !== "essay" && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Các lựa chọn đáp án & Chọn đáp án đúng (*)
                  </label>
                  {optionInputs.map((opt, oIdx) => {
                    const letters = ["A", "B", "C", "D"];
                    return (
                      <div key={oIdx} className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleCorrectToggle(oIdx)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center border cursor-pointer shrink-0 transition-colors ${
                            correctSelections[oIdx]
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-200 text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          {letters[oIdx]}
                        </button>
                        <input
                          type="text"
                          placeholder={`Lựa chọn ${letters[oIdx]}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-4 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
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
                    <span>Lưu câu hỏi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Questions list display */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm">Câu hỏi trong hệ thống</h2>
            <span className="text-xs text-slate-400 font-medium">Tổng số: {questions.length} câu</span>
          </div>

          {questions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Chưa có câu hỏi nào được khởi tạo trong ngân hàng câu hỏi.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {questions.map((q) => (
                <div key={q.id} className="p-6 flex gap-6 items-start hover:bg-slate-50/30">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <FileQuestion className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase text-slate-400">
                        Mã: {q.id}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                        {q.category?.name || "Chủ đề"}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-primary-50 text-primary-600 rounded-md">
                        {q.type === "essay" ? "Tự luận" : "Trắc nghiệm"}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                        {q.level}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 leading-relaxed">{q.text}</p>

                    {/* Show choices if mcq */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium max-w-xl">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctAnswers?.includes(oIdx);
                          const letters = ["A", "B", "C", "D"];
                          return (
                            <div
                              key={oIdx}
                              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg border ${
                                isCorrect
                                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-700 font-bold"
                                  : "border-transparent bg-slate-50/50"
                              }`}
                            >
                              <span>{letters[oIdx]}.</span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
