"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else {
        if (user.role === "super-admin") {
          router.replace("/super-admin/dashboard");
        } else if (user.role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          if (!user.organizationId) {
            router.replace("/join");
          } else {
            router.replace("/dashboard");
          }
        }
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Đang khởi tạo hệ thống...</span>
      </div>
    </div>
  );
}
