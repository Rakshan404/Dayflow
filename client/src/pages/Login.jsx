import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Briefcase,
  ShieldCheck,
  UserCheck,
  KeyRound,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  // Role Selection State ("employee" or "admin")
  const [activeRole, setActiveRole] = useState("employee");

  // Form State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Status & Feedback State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Helper to fill demo admin credentials
  const fillAdminCredentials = () => {
    setActiveRole("admin");
    setIdentifier("ADMIN20260001");
    setPassword("Admin@123");
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!identifier.trim()) {
      setErrorMsg(
        activeRole === "admin"
          ? "Please enter your Admin ID (e.g. ADMIN20260001) or Email."
          : "Please enter your Employee Login ID (e.g. OIJODO20260001) or Email."
      );
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password,
        role: activeRole,
      });

      const { token, user, message } = response.data;

      // Save token and user info in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      const isAdmin = user.role && user.role.toLowerCase() === "admin";

      setSuccessMsg(
        isAdmin
          ? "Admin identity verified! Redirecting to Admin Hub..."
          : "Welcome back! Redirecting to your Employee Dashboard..."
      );

      // Redirect based on role
      setTimeout(() => {
        if (isAdmin) {
          navigate("/admin/portal");
        } else {
          navigate("/dashboard");
        }
      }, 1000);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to connect to authentication server. Please check your credentials.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-mesh">
      {/* Decorative ambient background accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-200/40 to-purple-300/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-amber-200/40 to-rose-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Floating Dual-Panel Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-slate-300/60 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[570px] relative z-10 border border-slate-100">
        
        {/* ================= FORM SECTION (7 Columns) ================= */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Brand Logo & Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-slate-800 text-lg tracking-tight flex items-center gap-1.5">
                  Dayflow <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold tracking-normal border border-indigo-100">HRMS</span>
                </span>
              </div>

              {/* Role Indicator Badge */}
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold border transition ${
                  activeRole === "admin"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}
              >
                {activeRole === "admin" ? "🛡️ Admin Portal" : "🧑‍💼 Employee Portal"}
              </span>
            </div>

            {/* Role Switcher Tabs */}
            <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 mb-6 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setActiveRole("employee");
                  setErrorMsg("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeRole === "employee"
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Login as Employee</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRole("admin");
                  setErrorMsg("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeRole === "admin"
                    ? "bg-white text-purple-700 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Login as Admin</span>
              </button>
            </div>

            {/* Primary Header */}
            <div className="mb-5 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {activeRole === "admin" ? (
                  <>
                    Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Verification</span>
                  </>
                ) : (
                  <>
                    Sign in to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Dayflow</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeRole === "admin"
                  ? "Enter your administrator credentials to add employees or manage the dashboard."
                  : "Enter the Login ID and password shared by your Admin to access your dashboard."}
              </p>
            </div>

            {/* Quick Demo Admin Credential Helper */}
            {activeRole === "admin" && (
              <div className="mb-4 p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/70 flex items-center justify-between text-xs text-purple-900">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                  <span><strong>ID:</strong> ADMIN20260001 &bull; <strong>Pass:</strong> Admin@123</span>
                </div>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline bg-white/80 px-2 py-0.5 rounded shadow-2xs transition"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* Dynamic Status Alerts */}
            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dual Identifier Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  {activeRole === "admin" ? "Admin ID or Email" : "Employee Login ID or Email"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeRole === "admin"
                        ? "ADMIN20260001 or admin@dayflow.com"
                        : "OIJODO20260001 or employee@domain.com"
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        activeRole === "admin"
                          ? "Default Admin Password is: Admin@123"
                          : "Please contact your HR administrator to re-send your login ID and password via WhatsApp."
                      );
                    }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 focus:outline-none transition"
                    title={showPassword ? "Hide password (🙈)" : "Show password (👁️)"}
                  >
                    {showPassword ? (
                      <span className="text-base">🙈</span>
                    ) : (
                      <span className="text-base">👁️</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600">Remember this device</span>
                </label>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Protected Portal</span>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-8 rounded-full text-white font-bold text-sm tracking-wider uppercase shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2 ${
                    activeRole === "admin"
                      ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 shadow-purple-200 hover:shadow-purple-300"
                      : "bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 shadow-indigo-200 hover:shadow-indigo-300"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>AUTHENTICATING...</span>
                    </>
                  ) : (
                    <>
                      <span>{activeRole === "admin" ? "VERIFY ADMIN & ENTER" : "SIGN IN AS EMPLOYEE"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ================= WELCOME BANNER PANEL (5 Columns) ================= */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 sm:p-12 flex flex-col justify-between items-center text-center text-white relative overflow-hidden">
          {/* Subtle geometric background graphics */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          {/* Top Pill / Badge */}
          <div className="relative z-10 w-full flex justify-end">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold tracking-wide text-indigo-100 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Dayflow HRMS v2.0</span>
            </div>
          </div>

          {/* Center Message */}
          <div className="relative z-10 my-auto py-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              {activeRole === "admin" ? "Admin Hub" : "Hello, Employee!"}
            </h2>
            <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed max-w-xs mx-auto mb-8 font-light">
              {activeRole === "admin"
                ? "Verify admin access to onboard new employees, generate unique Login IDs, and view HR analytics."
                : "Log in with the corporate credentials provided by your HR administrator to view your attendance, salary, and leaves."}
            </p>

            {/* Switch Mode Ghost Button */}
            <button
              type="button"
              onClick={() => {
                setActiveRole(activeRole === "admin" ? "employee" : "admin");
                setErrorMsg("");
              }}
              className="inline-block border-2 border-white rounded-full text-white font-bold text-xs uppercase tracking-wider px-8 py-2.5 hover:bg-white hover:text-indigo-700 transition duration-300 shadow-lg shadow-black/10 active:scale-95"
            >
              {activeRole === "admin" ? "SWITCH TO EMPLOYEE" : "SWITCH TO ADMIN"}
            </button>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 text-[11px] text-indigo-200/75">
            Dayflow Human Resource Management System
          </div>
        </div>

      </div>
    </div>
  );
}


