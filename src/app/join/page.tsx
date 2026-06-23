"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function JoinOrganizationPage() {
  const { user, refreshUser, logout } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Refresh session on client-side context
        await refreshUser();
        router.push("/dashboard");
      } else {
        setError(data.error || "Mã tham gia không chính xác hoặc đã hết hạn.");
      }
    } catch (err) {
      console.error(err);
      setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-100 shadow-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-4 border border-primary-100">
            <Building2 className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Gia nhập tổ chức của bạn
          </h2>
          <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
            Chào mừng {user?.displayName || "bạn"}! Tài khoản của bạn hiện chưa được liên kết với tổ chức nào. Vui lòng nhập mã invite do quản trị viên cung cấp để bắt đầu.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="leading-normal">{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-5">
          <div>
            <label
              htmlFor="inviteCode"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
            >
              Mã mời (Invite Code)
            </label>
            <input
              type="text"
              id="inviteCode"
              placeholder="VD: ORG-4X9A-P2ML"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold tracking-wider text-center uppercase focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 bg-slate-50 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 shadow-md shadow-primary-500/10 disabled:opacity-50 disabled:hover:bg-primary-600 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Xác nhận gia nhập</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button
            onClick={() => logout()}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            Đăng xuất khỏi tài khoản
          </button>
        </div>
      </div>
    </div>
  );
}
