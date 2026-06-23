"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogIn, Loader2, Award, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const { signInWithGoogle, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError("Không thể đăng nhập. Vui lòng đảm bảo bạn chọn tài khoản Google hợp lệ.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Visual background details */}
      <div className="absolute w-96 h-96 bg-primary-100/40 rounded-full blur-3xl -top-12 -left-12 -z-10" />
      <div className="absolute w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl -bottom-12 -right-12 -z-10" />

      {/* Main glassmorphism card */}
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-xl flex flex-col">
        {/* Brand details */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-primary-500/20">
            <Award className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            SuperExam SaaS
          </h1>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1.5">
            Hệ thống Quản lý thi trắc nghiệm & tự luận
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="leading-normal">{error}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center space-y-6">
          <div className="text-center text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
            Đăng nhập nhanh chóng và bảo mật thông qua liên kết tài khoản Google của bạn.
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || authLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 font-semibold border border-slate-200 py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:hover:bg-white cursor-pointer active:scale-[0.99]"
          >
            {loading || authLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            ) : (
              <>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  className="w-5 h-5"
                />
                <span className="text-sm">Tiếp tục với Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-[10px] text-slate-400 font-medium">
          Phiên bản Standalone Node.js &bull; Bảo mật dữ liệu PostgreSQL
        </div>
      </div>
    </div>
  );
}
