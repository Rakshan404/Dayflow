import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Briefcase,
  ShieldCheck,
  Copy,
  Send,
  ArrowLeft,
  KeyRound,
  Share2,
} from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  // Form State
  const [companyName, setCompanyName] = useState("Odoo India");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Employee");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Helper to generate a strong random password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let autoPass = "Dayflow@";
    for (let i = 0; i < 4; i++) {
      autoPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(autoPass);
    setConfirmPassword(autoPass);
  };

  // Real-time Live Custom ID Preview Calculator
  const predictedCustomId = useMemo(() => {
    try {
      // 1. Company Prefix (2 letters)
      const cleanCompany = (companyName || "Odoo India").trim();
      const companyWords = cleanCompany.split(/\s+/).filter(Boolean);
      let comp = "";
      if (companyWords.length >= 2) {
        const w1 = companyWords[0].replace(/[^a-zA-Z]/g, "");
        const w2 = companyWords[1].replace(/[^a-zA-Z]/g, "");
        comp = ((w1[0] || "X") + (w2[0] || "X")).toUpperCase();
      } else {
        const letters = cleanCompany.replace(/[^a-zA-Z]/g, "").toUpperCase();
        comp = (letters + "XX").slice(0, 2);
      }

      // 2. Name Prefix (4 letters: first 2 of first name + first 2 of last name)
      const cleanName = (fullName || "John Doe").trim();
      const nameParts = cleanName.split(/\s+/).filter(Boolean);
      let namePref = "";
      if (nameParts.length >= 2) {
        const p1 = (nameParts[0].replace(/[^a-zA-Z]/g, "").toUpperCase() + "XX").slice(0, 2);
        const p2 = (nameParts[nameParts.length - 1].replace(/[^a-zA-Z]/g, "").toUpperCase() + "XX").slice(0, 2);
        namePref = p1 + p2;
      } else {
        const p1 = (cleanName.replace(/[^a-zA-Z]/g, "").toUpperCase() + "XX").slice(0, 2);
        namePref = p1 + "XX";
      }

      const year = new Date().getFullYear();
      return `${comp}${namePref}${year}####`;
    } catch {
      return "OIJODO2026####";
    }
  }, [companyName, fullName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Please enter the employee's full name.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMsg("Please enter or auto-generate a password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/signup", {
        companyName: companyName.trim() || "Odoo India",
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        password,
        confirmPassword,
        joiningYear: new Date().getFullYear(),
      });

      const { user } = response.data;

      // Store created employee with plain password for immediate WhatsApp sharing
      setCreatedEmployee({
        ...user,
        plainPassword: password,
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Employee registration failed. Please check the details.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Share Trigger
  const handleShareWhatsApp = () => {
    if (!createdEmployee) return;

    const portalUrl = window.location.origin;
    const cleanPhone = (createdEmployee.phone || "").replace(/[^0-9]/g, "");

    const messageText =
      `*Welcome to Dayflow HRMS!* 🎉\n\n` +
      `Hello *${createdEmployee.fullName}*,\n` +
      `Your employee account has been created by the HR Administrator.\n\n` +
      `🏢 *Company:* ${createdEmployee.companyName}\n` +
      `🆔 *Login ID:* ${createdEmployee.customId}\n` +
      `🔑 *Temporary Password:* ${createdEmployee.plainPassword}\n` +
      `🌐 *Login Portal:* ${portalUrl}\n\n` +
      `Please log in using your Login ID and password to access your dashboard.`;

    const encodedText = encodeURIComponent(messageText);

    let url = "";
    if (cleanPhone.length >= 10) {
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodedText}`;
    }

    window.open(url, "_blank");
  };

  const copyCustomIdOnly = () => {
    if (createdEmployee?.customId) {
      navigator.clipboard.writeText(createdEmployee.customId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const copyAllCredentials = () => {
    if (!createdEmployee) return;
    const portalUrl = window.location.origin;
    const text =
      `Dayflow HRMS Credentials:\n` +
      `Name: ${createdEmployee.fullName}\n` +
      `Login ID: ${createdEmployee.customId}\n` +
      `Password: ${createdEmployee.plainPassword}\n` +
      `Portal: ${portalUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-mesh">
      {/* Decorative ambient background accents */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-purple-200/40 to-indigo-300/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-tr from-rose-200/40 to-amber-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Floating Dual-Panel Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-slate-300/60 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[590px] relative z-10 border border-slate-100">
        
        {/* ================= WELCOME BANNER PANEL (5 Columns) ================= */}
        <div className="md:col-span-5 bg-gradient-to-br from-purple-700 via-indigo-700 to-indigo-900 p-8 sm:p-10 flex flex-col justify-between items-center text-center text-white relative overflow-hidden order-last md:order-first">
          {/* Ambient geometric graphics */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          {/* Top Back Link & Pill */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <Link
              to="/admin/portal"
              className="inline-flex items-center gap-1 text-xs text-purple-200 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Hub</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold tracking-wide text-indigo-100 border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Admin Authorized</span>
            </div>
          </div>

          {/* Center Message */}
          <div className="relative z-10 my-auto py-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              Onboard Employee
            </h2>
            <p className="text-purple-100/90 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto mb-6 font-light">
              Create an employee account, auto-generate their corporate <strong>Login ID</strong>, and share the credentials directly via WhatsApp.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
              <Link
                to="/admin/portal"
                className="w-full py-2.5 rounded-full border-2 border-white text-white font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-purple-800 transition shadow-sm active:scale-95"
              >
                Back to Admin Hub
              </Link>
              <Link
                to="/"
                className="w-full py-2 rounded-full bg-white/10 text-purple-100 font-semibold text-xs hover:bg-white/20 transition"
              >
                Sign In Page
              </Link>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 text-[11px] text-purple-200/75">
            Auto-Generated Unique Corporate Credentials
          </div>
        </div>

        {/* ================= FORM SECTION (7 Columns) ================= */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white order-first md:order-last">
          <div>
            {/* Header with Logo */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-200">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-slate-800 text-lg tracking-tight">
                  Dayflow <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-100">HRMS</span>
                </span>
              </div>

              {/* Dynamic Live ID format preview */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>ID: {predictedCustomId}</span>
              </div>
            </div>

            {/* Headline */}
            <div className="mb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Add New Employee
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter details to generate employee Login ID and credentials.
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* ================= SUCCESS CARD WITH WHATSAPP SHARING ================= */}
            {createdEmployee ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200 text-slate-800 mb-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-purple-800 font-bold text-sm mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Employee Created & ID Generated!</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Share these credentials directly with <strong>{createdEmployee.fullName}</strong>:
                </p>

                {/* Credentials Display Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider block">
                        Generated Login ID
                      </span>
                      <span className="text-base font-extrabold text-slate-900 font-mono tracking-wide">
                        {createdEmployee.customId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={copyCustomIdOnly}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition"
                      title="Copy Login ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId ? "Copied!" : "Copy ID"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Password
                      </span>
                      <span className="text-sm font-bold text-slate-800 font-mono">
                        {createdEmployee.plainPassword}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Email
                      </span>
                      <span className="text-xs text-slate-600 font-mono">
                        {createdEmployee.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action: Share via WhatsApp Button */}
                <div className="space-y-2 mb-3">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>SHARE CREDENTIALS VIA WHATSAPP</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyAllCredentials}
                    className="w-full py-2 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>{copiedAll ? "All Credentials Copied to Clipboard!" : "Copy Full Credentials Text"}</span>
                  </button>
                </div>

                {/* Secondary Navigation Buttons */}
                <div className="flex gap-2 pt-1 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedEmployee(null);
                      setFullName("");
                      setEmail("");
                      setPhone("");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition text-center"
                  >
                    + Add Another Employee
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-white transition"
                  >
                    Admin Dashboard &rarr;
                  </button>
                </div>
              </div>
            ) : (
              /* ================= SIGNUP FORM ================= */
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Company Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Company Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Odoo India"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Employee Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="employee@domain.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Phone Number (For WhatsApp Sharing) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                        Phone (WhatsApp)
                      </label>
                      <span className="text-[10px] text-emerald-600 font-semibold">For WhatsApp Send</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password with Auto-Generate Helper */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] text-purple-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Auto-Generate</span>
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-purple-600 transition"
                      >
                        {showPassword ? (
                          <span className="text-xs">🙈</span>
                        ) : (
                          <span className="text-xs">👁️</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-purple-600 transition"
                      >
                        {showConfirmPassword ? (
                          <span className="text-xs">🙈</span>
                        ) : (
                          <span className="text-xs">👁️</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role and Year Info */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase">Role:</span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-600"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Joining Year: {new Date().getFullYear()}
                  </span>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-8 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:from-purple-700 hover:to-indigo-800 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>CREATING EMPLOYEE & GENERATING ID...</span>
                      </>
                    ) : (
                      <>
                        <span>CREATE EMPLOYEE & GENERATE ID</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


