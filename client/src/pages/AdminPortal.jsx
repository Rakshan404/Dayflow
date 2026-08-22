import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserPlus,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Users,
  Briefcase,
  Sparkles,
  ArrowRight,
  Send,
  Building,
} from "lucide-react";

export default function AdminPortal() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !userStr) {
      navigate("/");
      return;
    }
    try {
      const parsed = JSON.parse(userStr);
      if (parsed.role && parsed.role.toLowerCase() !== "admin") {
        navigate("/dashboard");
        return;
      }
      setAdminUser(parsed);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-mesh">
      {/* Ambient background gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:px-6 shadow-sm border border-slate-200/70 flex items-center justify-between relative z-10 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-200">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 text-lg tracking-tight">
                Dayflow
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                ADMIN HUB
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Admin ID: {adminUser?.customId || "ADMIN20260001"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{adminUser?.fullName || "System Admin"}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl mx-auto my-auto relative z-10 py-4">
        {/* Welcome Headline */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Administrator Actions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Admin Control Center</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
            Select an action below to onboard new employees or access system analytics and management modules.
          </p>
        </div>

        {/* The 2 Primary Admin Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          
          {/* Option 1: Add Employee */}
          <div className="group bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/70 border border-slate-100 hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-100/60 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full pointer-events-none group-hover:scale-110 transition duration-300" />

            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 mb-6 group-hover:scale-105 transition">
                <UserPlus className="w-7 h-7" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-purple-600 tracking-wider uppercase">
                  Option 1
                </span>
                <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-100">
                  ID Generator
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
                Add Employee
              </h3>

              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                Onboard a new employee, auto-generate their corporate <strong>Login ID</strong> (e.g. <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded font-mono">OIJODO20260001</code>), and share their credentials directly to their <strong>WhatsApp</strong>.
              </p>
            </div>

            <Link
              to="/admin/add-employee"
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <span>ADD EMPLOYEE & GENERATE ID</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Option 2: Dashboard */}
          <div className="group bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/70 border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/60 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full pointer-events-none group-hover:scale-110 transition duration-300" />

            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-6 group-hover:scale-105 transition">
                <LayoutDashboard className="w-7 h-7" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
                  Option 2
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                  Analytics & Overview
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
                Admin Dashboard
              </h3>

              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                Access full administrative control over company attendance records, employee time-off approval workflows, payroll structures, and profiles.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <span>ENTER ADMIN DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center text-xs text-slate-400 py-4 relative z-10">
        Dayflow HRMS &bull; Corporate Human Resource Administration Platform
      </footer>
    </div>
  );
}
