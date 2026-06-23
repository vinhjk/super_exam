"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { parseAikenText, ParsedQuestion } from "@/lib/parser/aiken";
import {
  ArrowLeft,
  Loader2,
  FileCheck2,
  AlertTriangle,
  Play,
  CheckCircle,
  FolderOpen,
  Edit2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function AikenImportPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("easy");
  const [rawText, setRawText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        if (res.ok) {
          setCategories(data.categories || []);
          if (data.categories?.length > 0) {
            setCategoryId(data.categories[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleParse = () => {
    setError("");
    setSuccessMsg("");
    if (!rawText.trim()) {
      setError("Vui lòng nhập nội dung đề thi dạng Aiken.");
      return;
    }

    try {
      const results = parseAikenText(rawText);
      if (results.length === 0) {
        setError("Không nhận diện được câu hỏi nào. Vui lòng kiểm tra lại định dạng.");
      } else {
        setParsedQuestions(results);
        setSuccessMsg(`Đã phân tích thành công ${results.length} câu hỏi. Vui lòng rà soát lại bên dưới.`);
      }
    } catch (e: any) {
      setError("Lỗi phân tích: " + e.message);
    }
  };

  const handleEditQuestionText = (index: number, val: string) => {
    setParsedQuestions((prev) => {
      const updated = [...prev];
      updated[index].text = val;
      return updated;
    });
  };

  const handleSaveToPostgres = async () => {
    if (parsedQuestions.length === 0 || !categoryId) return;

    setSaving(true);
    setError("");
    setSuccessMsg("");

    // Enrich parsed questions with form settings
    const questionsPayload = parsedQuestions.map((q) => ({
      ...q,
      categoryId,
      level,
    }));

    try {
      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questionsPayload }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin/questions");
      } else {
        setError(data.error || "Không thể thực hiện lưu hàng loạt.");
        setSaving(false);
      }
    } catch (e) {
      console.error(e);
      setError("Lỗi kết nối máy chủ khi thực hiện import.");
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
        {/* Header Block */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/questions")}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Import câu hỏi từ Word (Aiken)</h1>
            <p className="text-slate-400 text-xs mt-1">Dán văn bản định dạng Aiken để phân tách tự động các đáp án và lưu.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Input Panel */}
        <div className="grid grid-cols-3 gap-8 items-start">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            <h2 className="font-bold text-slate-800 text-sm">Cài đặt mặc định khi nhập</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="cat" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Danh mục chủ đề
                </label>
                <select
                  id="cat"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="diff" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Độ khó câu hỏi
                </label>
                <select
                  id="diff"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khá</option>
                  <option value="advanced">Nâng cao</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl space-y-2 text-[10px] text-slate-500 font-medium leading-relaxed">
              <p className="font-bold text-slate-700">Quy tắc định dạng Aiken:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Câu hỏi viết trên 1 dòng đơn.</li>
                <li>Lựa chọn bắt đầu bằng chữ cái in hoa kèm dấu chấm/ngoặc đơn (A. hoặc A)).</li>
                <li>Đánh dấu sao (*) ở trước chữ cái cho đáp án đúng (VD: *A. Option).</li>
                <li>Hệ thống tự nhận diện trắc nghiệm (Single/Multi) hoặc tự luận (nếu không có option).</li>
              </ul>
            </div>
          </div>

          <div className="col-span-2 space-y-6">
            {/* Raw input text area */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h2 className="font-bold text-slate-800 text-sm">Dán nội dung văn bản đề thi</h2>
              <textarea
                rows={10}
                placeholder="VD:&#10;Thủ đô của Việt Nam là gì?&#10;*A. Hà Nội&#10;B. Sài Gòn&#10;C. Đà Nẵng&#10;&#10;Ai là tác giả Truyện Kiều?&#10;*A. Nguyễn Du&#10;B. Nguyễn Trãi"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleParse}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  <Play className="w-4 h-4" />
                  <span>Phân tích văn bản</span>
                </button>
              </div>
            </div>

            {/* Preview and Edit data grid */}
            {parsedQuestions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800 text-sm">Rà soát dữ liệu sau phân tích</h2>
                  <button
                    onClick={handleSaveToPostgres}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-emerald-500/10 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <FileCheck2 className="w-4 h-4" />
                        <span>Lưu {parsedQuestions.length} câu vào Database</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
                  {parsedQuestions.map((q, idx) => (
                    <div key={idx} className="p-6 space-y-4 hover:bg-slate-50/20">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          Câu {idx + 1}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                          {q.type === "essay" ? "Tự luận" : "Trắc nghiệm"}
                        </span>
                        {q.type !== "essay" && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-primary-50 text-primary-600 rounded-md">
                            {q.type === "single" ? "Single Choice" : "Multi Choice"}
                          </span>
                        )}
                      </div>

                      {/* Question edit textbox */}
                      <div className="flex items-start gap-3">
                        <Edit2 className="w-4 h-4 text-slate-400 mt-2.5 shrink-0" />
                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => handleEditQuestionText(idx, e.target.value)}
                          className="flex-grow px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                        />
                      </div>

                      {/* Display parsed options */}
                      {q.options && q.options.length > 0 && (
                        <div className="pl-7 grid grid-cols-2 gap-2.5 text-[11px] text-slate-500 font-medium">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = q.correctAnswers?.includes(oIdx);
                            const letters = ["A", "B", "C", "D", "E", "F"];
                            return (
                              <div
                                key={oIdx}
                                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border ${
                                  isCorrect
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-700 font-semibold"
                                    : "border-slate-100 bg-slate-50/50"
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
