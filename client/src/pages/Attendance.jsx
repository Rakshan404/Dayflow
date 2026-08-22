import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { getAttendance, getAdminAttendance, checkIn, checkOut } from "../api/attendance";
import { getMyLeaves } from "../api/leave";

const styles = {
  card: { backgroundColor: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", border: "none" },
  gradientText: { background: "linear-gradient(135deg, #6b21a8, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  buttonPrimary: { padding: "0.6rem 1.2rem", background: "linear-gradient(135deg, #6b21a8, #3b82f6)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  buttonSecondary: { padding: "0.4rem 0.6rem", backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" },
  tableHeader: { padding: "1rem", color: "#64748b", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", borderBottom: "2px solid #f1f5f9" },
  tableCell: { padding: "1rem", color: "#334155", borderBottom: "1px solid #f1f5f9", fontSize: "0.95rem" },
  statPill: { display: "flex", flexDirection: "column", padding: "0.75rem 1.25rem", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", minWidth: "140px" }
};

export default function Attendance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data
  const [attData, setAttData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  
  // Controls
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  
  // Employee check-in/out states for today
  const [checkingIn, setCheckingIn] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [hasCheckedOutToday, setHasCheckedOutToday] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(userStr);
    setUser(u);
  }, [navigate]);

  const isAdmin = user?.role?.toLowerCase() === "admin";

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        if (isAdmin) {
          // Admin fetches for a specific day
          const dateString = currentDate.toISOString().split("T")[0];
          const res = await getAdminAttendance(dateString);
          setAttData(res);
        } else {
          // Employee fetches all their own attendance
          const attRes = await getAttendance(user.id || user._id);
          setAttData(attRes);
          
          // Also fetch leaves for stats
          const leaveRes = await getMyLeaves();
          setLeavesData(leaveRes);

          // Determine today's check-in status
          const today = new Date().toDateString();
          const todayRecord = attRes.find(r => new Date(r.date).toDateString() === today);
          if (todayRecord) {
            setHasCheckedInToday(!!todayRecord.checkIn && todayRecord.checkIn !== "-");
            setHasCheckedOutToday(!!todayRecord.checkOut && todayRecord.checkOut !== "-");
          }
        }
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, currentDate, isAdmin]);

  const handleToggleCheckIn = async () => {
    setCheckingIn(true);
    try {
      if (!hasCheckedInToday) {
        await checkIn();
        setHasCheckedInToday(true);
      } else if (!hasCheckedOutToday) {
        await checkOut();
        setHasCheckedOutToday(true);
      }
      
      // Refresh my own data
      const attRes = await getAttendance(user.id || user._id);
      setAttData(attRes);
    } catch (err) {
      setError("Failed to check in/out.");
    } finally {
      setCheckingIn(false);
    }
  };

  // ----------------------------------------
  // Admin View Logic
  // ----------------------------------------
  const shiftDay = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  const filteredAdminData = useMemo(() => {
    if (!searchQuery) return attData;
    return attData.filter(r => r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [attData, searchQuery]);

  // ----------------------------------------
  // Employee View Logic
  // ----------------------------------------
  const shiftMonth = (months) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + months);
    setCurrentDate(d);
  };

  const handleMonthChange = (e) => {
    const d = new Date(currentDate);
    d.setMonth(parseInt(e.target.value, 10));
    setCurrentDate(d);
  };

  // Filter attendance for the selected month
  const monthlyAttData = useMemo(() => {
    if (isAdmin) return [];
    return attData.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  }, [attData, currentDate, isAdmin]);

  // Calculate Employee Stats
  const daysPresent = monthlyAttData.filter(r => r.status === "present").length;
  
  const leavesCount = useMemo(() => {
    if (isAdmin || !leavesData.length) return 0;
    // Count days of approved leaves intersecting this month
    return leavesData.filter(l => l.status === "approved").reduce((total, leave) => {
      const sd = new Date(leave.startDate);
      // Rough estimation: if leave starts in this month, add allocationDays
      if (sd.getMonth() === currentDate.getMonth() && sd.getFullYear() === currentDate.getFullYear()) {
        return total + (leave.allocationDays || 0);
      }
      return total;
    }, 0);
  }, [leavesData, currentDate, isAdmin]);

  const totalWorkingDays = daysPresent + leavesCount;

  if (!user) return <div style={{ padding: "2rem" }}>Initializing...</div>;

  const dateLabel = isAdmin 
    ? `${currentDate.getDate()}, ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`
    : `${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {error && (
        <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", fontWeight: "500", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, fontWeight: "800", color: "#0f172a", fontSize: "2rem" }}>
          Atten<span style={styles.gradientText}>dance</span>
        </h2>
        
        {!isAdmin && (
          <button 
            onClick={handleToggleCheckIn} 
            disabled={checkingIn || hasCheckedOutToday}
            style={{
              ...styles.buttonPrimary,
              opacity: (checkingIn || hasCheckedOutToday) ? 0.7 : 1,
              background: hasCheckedInToday && !hasCheckedOutToday ? "#ef4444" : undefined
            }}
          >
            {checkingIn ? "Processing..." : 
             hasCheckedOutToday ? "Done for today" : 
             hasCheckedInToday ? "Check Out" : "Check In"}
          </button>
        )}
      </div>

      <motion.div style={styles.card} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Controls Row */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", gap: "1rem" }}>
          
          {isAdmin ? (
            // Admin Controls
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button onClick={() => shiftDay(-1)} style={styles.buttonSecondary}><ChevronLeft size={16} /></button>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: "600" }}>
                  <CalendarIcon size={16} color="#6b21a8" />
                  Day View
                </div>
                <button onClick={() => shiftDay(1)} style={styles.buttonSecondary}><ChevronRight size={16} /></button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input 
                    type="text" 
                    placeholder="Search employee..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: "0.5rem 1rem 0.5rem 2.2rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", minWidth: "200px" }}
                  />
                </div>
                {/* Decorative View Toggle */}
                <div style={{ display: "flex", backgroundColor: "#f1f5f9", borderRadius: "8px", padding: "0.25rem" }}>
                  <span style={{ padding: "0.25rem 0.75rem", backgroundColor: "white", borderRadius: "6px", fontWeight: "600", color: "#0f172a", fontSize: "0.85rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>Day</span>
                  <span style={{ padding: "0.25rem 0.75rem", color: "#64748b", fontWeight: "500", fontSize: "0.85rem", cursor: "not-allowed" }}>Month</span>
                </div>
              </div>
            </>
          ) : (
            // Employee Controls
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button onClick={() => shiftMonth(-1)} style={styles.buttonSecondary}><ChevronLeft size={16} /></button>
                <select 
                  value={currentDate.getMonth()} 
                  onChange={handleMonthChange}
                  style={{ padding: "0.4rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", fontWeight: "600", backgroundColor: "#f8fafc", color: "#334155", cursor: "pointer" }}
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const d = new Date(2025, i, 1);
                    return <option key={i} value={i}>{d.toLocaleString('default', { month: 'short' })}</option>
                  })}
                </select>
                <button onClick={() => shiftMonth(1)} style={styles.buttonSecondary}><ChevronRight size={16} /></button>
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={styles.statPill}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Days Present</span>
                  <span style={{ fontSize: "1.25rem", color: "#16a34a", fontWeight: "800" }}>{daysPresent}</span>
                </div>
                <div style={styles.statPill}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Leaves Count</span>
                  <span style={{ fontSize: "1.25rem", color: "#ca8a04", fontWeight: "800" }}>{leavesCount}</span>
                </div>
                <div style={styles.statPill}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Work Days</span>
                  <span style={{ fontSize: "1.25rem", color: "#3b82f6", fontWeight: "800" }}>{totalWorkingDays}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Date Label */}
        <div style={{ paddingBottom: "1rem", borderBottom: "2px solid #f1f5f9", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.25rem", fontWeight: "700" }}>
            {isAdmin ? "Date: " : "Month: "} 
            <span style={{ color: "#6b21a8" }}>{dateLabel}</span>
          </h3>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading attendance...</div>
        ) : (isAdmin ? filteredAdminData.length === 0 : monthlyAttData.length === 0) ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>No attendance records for this period.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr>
                  {isAdmin ? (
                    <>
                      <th style={styles.tableHeader}>Employee</th>
                      <th style={styles.tableHeader}>Check In</th>
                      <th style={styles.tableHeader}>Check Out</th>
                      <th style={styles.tableHeader}>Work Hours</th>
                      <th style={styles.tableHeader}>Extra Hours</th>
                    </>
                  ) : (
                    <>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Check In</th>
                      <th style={styles.tableHeader}>Check Out</th>
                      <th style={styles.tableHeader}>Work Hours</th>
                      <th style={styles.tableHeader}>Extra Hours</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {(isAdmin ? filteredAdminData : monthlyAttData).map((record) => (
                  <motion.tr 
                    key={record._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ transition: "background-color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    {isAdmin ? (
                      <>
                        <td style={{ ...styles.tableCell, fontWeight: "600", color: "#0f172a" }}>{record.employeeName}</td>
                        <td style={styles.tableCell}>
                          <span style={{ display: "inline-block", padding: "0.25rem 0.5rem", backgroundColor: record.checkIn !== "-" ? "#dcfce7" : "#f1f5f9", color: record.checkIn !== "-" ? "#166534" : "#64748b", borderRadius: "6px", fontWeight: "500", fontSize: "0.9rem" }}>
                            {record.checkIn}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={{ display: "inline-block", padding: "0.25rem 0.5rem", backgroundColor: record.checkOut !== "-" ? "#dbeafe" : "#f1f5f9", color: record.checkOut !== "-" ? "#1e40af" : "#64748b", borderRadius: "6px", fontWeight: "500", fontSize: "0.9rem" }}>
                            {record.checkOut}
                          </span>
                        </td>
                        <td style={{ ...styles.tableCell, fontWeight: "600" }}>{record.workHours ? `${record.workHours}h` : "-"}</td>
                        <td style={{ ...styles.tableCell, color: record.extraHours > 0 ? "#16a34a" : "inherit" }}>
                          {record.extraHours ? `+${record.extraHours}h` : "-"}
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ ...styles.tableCell, fontWeight: "500" }}>{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                        <td style={styles.tableCell}>
                          <span style={{ display: "inline-block", padding: "0.25rem 0.5rem", backgroundColor: record.checkIn !== "-" ? "#dcfce7" : "#f1f5f9", color: record.checkIn !== "-" ? "#166534" : "#64748b", borderRadius: "6px", fontWeight: "500", fontSize: "0.9rem" }}>
                            {record.checkIn}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={{ display: "inline-block", padding: "0.25rem 0.5rem", backgroundColor: record.checkOut !== "-" ? "#dbeafe" : "#f1f5f9", color: record.checkOut !== "-" ? "#1e40af" : "#64748b", borderRadius: "6px", fontWeight: "500", fontSize: "0.9rem" }}>
                            {record.checkOut}
                          </span>
                        </td>
                        <td style={{ ...styles.tableCell, fontWeight: "600" }}>{record.workHours ? `${record.workHours}h` : "-"}</td>
                        <td style={{ ...styles.tableCell, color: record.extraHours > 0 ? "#16a34a" : "inherit" }}>
                          {record.extraHours ? `+${record.extraHours}h` : "-"}
                        </td>
                      </>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
