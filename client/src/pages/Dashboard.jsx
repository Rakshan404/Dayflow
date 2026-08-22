import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  User,
  ShieldCheck,
  Calendar,
  Clock,
  UserPlus,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  Building,
  Mail,
  Phone,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const isAdmin = user?.role && user.role.toLowerCase() === "admin";

  return (
    <div className="min-h-[calc(100vh-70px)] bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Welcome Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-50 to-purple-50 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold border ${
                  isAdmin
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {isAdmin ? "🛡️ Administrator Dashboard" : "🧑‍💼 Employee Dashboard"}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {user?.customId || user?.loginId || "OIJODO20260001"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, <span className="text-indigo-600">{user?.fullName || user?.name || "Team Member"}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isAdmin
                ? "You have full administrative privileges to onboard employees, generate IDs, and view company metrics."
                : "Your workspace is ready. Check your daily attendance, leave balances, and salary information."}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="relative z-10 flex flex-wrap gap-2.5">
            {isAdmin ? (
              <>
                <Link
                  to="/admin/add-employee"
                  className="py-2.5 px-5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Employee</span>
                </Link>
                <Link
                  to="/admin/portal"
                  className="py-2.5 px-5 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition"
                >
                  Admin Hub
                </Link>
              </>
            ) : (
              <Link
                to="/attendance"
                className="py-2.5 px-5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Mark Attendance</span>
              </Link>
            )}
          </div>
        </div>

        {/* User Profile & Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Official Corporate Identity */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Corporate Identity
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Employee ID</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono">
                  {user?.customId || user?.loginId || "OIJODO20260001"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Company</span>
                <span className="text-sm font-semibold text-slate-800">
                  {user?.companyName || "Odoo India"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Email</span>
                <span className="text-xs text-slate-600 font-mono">
                  {user?.email || "employee@domain.com"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Attendance & Status */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Today's Status
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-800">Present (Active Shift)</span>
              </div>
              <p className="text-xs text-slate-500">
                Shift logged at 09:30 AM. Track working hours and check-outs in the Attendance tab.
              </p>
              <Link
                to="/attendance"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 pt-1"
              >
                <span>View Attendance Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Quick Navigation */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Quick Links
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  to="/leave"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-xs font-semibold text-slate-700 transition"
                >
                  <span>Request Time Off / Leave</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/payroll"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-xs font-semibold text-slate-700 transition"
                >
                  <span>View Payslips & Salary</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-xs font-semibold text-slate-700 transition"
                >
                  <span>My Profile Details</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

