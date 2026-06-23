"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FileQuestion,
  FileText,
  Building2,
  LogOut,
  Monitor,
  AlertTriangle,
  User as UserIcon,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  userEmail?: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  userRole?: "super-admin" | "admin" | "user";
  organizationName?: string;
  onLogout?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  userEmail = "admin@example.com",
  userDisplayName = "Administrator",
  userPhotoURL,
  userRole = "admin",
  organizationName = "Default Organization",
  onLogout,
}) => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      roles: ["admin"],
    },
    {
      name: "Chủ đề & Mức độ",
      href: "/admin/categories",
      icon: FolderKanban,
      roles: ["admin"],
    },
    {
      name: "Ngân hàng câu hỏi",
      href: "/admin/questions",
      icon: FileQuestion,
      roles: ["admin"],
    },
    {
      name: "Cấu hình đề thi",
      href: "/admin/templates",
      icon: FileText,
      roles: ["admin"],
    },
    {
      name: "Quản lý Tổ chức",
      href: "/super-admin/dashboard",
      icon: Building2,
      roles: ["super-admin"],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-100 shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-200">
            <Monitor className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Vui lòng sử dụng máy tính
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Giao diện quản trị, xem thống kê và thiết lập đề thi phức tạp chỉ được tối ưu hóa cho màn hình lớn (Desktop/Laptop). Vui lòng đổi sang máy tính để có trải nghiệm tốt nhất.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
            <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Yêu cầu độ phân giải ngang tối thiểu 1024px</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="mt-6 flex items-center justify-center gap-2 text-sm text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col fixed inset-y-0 left-0 z-20">
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight text-base">
              SuperExam SaaS
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm shadow-primary-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary-600" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10">
          {/* Org Display */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
              {organizationName}
            </span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{userDisplayName}</p>
              <p className="text-xs text-slate-400 tracking-wide uppercase">{userRole}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {userPhotoURL ? (
                <img
                  src={userPhotoURL}
                  alt={userDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
