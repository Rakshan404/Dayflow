import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getAttendance, getAdminAttendance, checkIn, checkOut } from "../api/attendance";

const styles = {
  card: { backgroundColor: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", border: "none" },
  gradientText: { background: "linear-gradient(135deg, #6b21a8, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  h2: { margin: "0", fontWeight: "800", color: "#111827", fontSize: "2rem" },
  h3: { margin: "0 0 1rem 0", fontWeight: "700", color: "#111827", fontSize: "1.5rem" },
  buttonPrimary: { padding: "0.6rem 1.2rem", background: "linear-gradient(135deg, #6b21a8, #3b82f6)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "opacity 0.2s" },
  buttonSecondary: { padding: "0.6rem 1.2rem", backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  tableHeader: { padding: "1rem", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", fontSize: "0.75rem", tracking: "wider", borderBottom: "2px solid #e5e7eb" },
  tableCell: { padding: "1rem", color: "#374151", borderBottom: "1px solid #f3f4f6" }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Attendance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [checkingIn, setCheckingIn] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [hasCheckedOutToday, setHasCheckedOutToday] = useState(false);
  
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }
    try {
      const u = JSON.parse(userStr);
      if (u && u.role) {
        setUser(u);
      } else {
        navigate("/login");
      }
    } catch (e) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        if (user.role.toLowerCase() === "admin") {
          const res = await getAdminAttendance();
          setData(res);
        } else {
          const res = await getAttendance(user.id || user._id);
          setData(res);
          // Check if checked in today
          const today = new Date().toDateString();
          const todayRecord = res.find(r => new Date(r.date).toDateString() === today);
          if (todayRecord) {
             setHasCheckedInToday(!!todayRecord.checkIn && todayRecord.checkIn !== "-");
             setHasCheckedOutToday(!!todayRecord.checkOut && todayRecord.checkOut !== "-");
          }
        }
        setError(null);
      } catch (err) {
        setError("Failed to load attendance records.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, currentMonth]);

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
      
      // Refresh data
      if (user.role.toLowerCase() !== "admin") {
         const res = await getAttendance(user.id || user._id);
         setData(res);
      }
    } catch (err) {
      setError("Failed to perform action.");
    } finally {
      setCheckingIn(false);
    }
  };

  const prevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };
  
  const nextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  if (!user) return <div style={{ padding: "2rem" }}>Initializing...</div>;

  const isAdmin = user.role.toLowerCase() === "admin";
  const monthString = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // For employee, filter data to current month
  const displayData = isAdmin ? data : data.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {error && (
        <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", fontWeight: "500", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}
      >
        <h2 style={styles.h2}>Atten<span style={styles.gradientText}>dance</span></h2>
        
        {!isAdmin && (
          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              onClick={handleToggleCheckIn} 
              disabled={checkingIn || hasCheckedOutToday}
              style={{
                ...styles.buttonPrimary,
                opacity: (checkingIn || hasCheckedOutToday) ? 0.7 : 1,
                background: hasCheckedInToday && !hasCheckedOutToday ? "#ef4444" : undefined // Red if checking out
              }}
            >
              {checkingIn ? "Processing..." : 
               hasCheckedOutToday ? "Done for today" : 
               hasCheckedInToday ? "Check Out" : "Check In"}
            </button>
          </div>
        )}
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <motion.div variants={itemVariants} style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={styles.h3}>{isAdmin ? "Today's Attendance" : "Monthly View"}</h3>
            
            {!isAdmin && (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button onClick={prevMonth} style={{ ...styles.buttonSecondary, padding: "0.4rem 0.8rem" }}>&lt;</button>
                <span style={{ fontWeight: "600", color: "#374151", minWidth: "140px", textAlign: "center" }}>
                  {monthString}
                </span>
                <button onClick={nextMonth} style={{ ...styles.buttonSecondary, padding: "0.4rem 0.8rem" }}>&gt;</button>
              </div>
            )}
          </div>
          
          {loading ? (
             <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
          ) : displayData.length === 0 ? (
             <p style={{ margin: 0, color: "#6b7280" }}>No records found for this period.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    {isAdmin ? (
                      <>
                        <th style={styles.tableHeader}>Employee</th>
                        <th style={styles.tableHeader}>Status</th>
                        <th style={styles.tableHeader}>Check In</th>
                        <th style={styles.tableHeader}>Check Out</th>
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
                  {displayData.map((record) => (
                    <tr key={record._id}>
                      {isAdmin ? (
                        <>
                          <td style={{ ...styles.tableCell, fontWeight: "600", color: "#111827" }}>{record.employeeName}</td>
                          <td style={styles.tableCell}>
                            <span style={{
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              backgroundColor: record.status === "present" ? "#dcfce7" : "#fee2e2",
                              color: record.status === "present" ? "#166534" : "#991b1b"
                            }}>
                              {record.status}
                            </span>
                          </td>
                          <td style={styles.tableCell}>{record.checkIn}</td>
                          <td style={styles.tableCell}>{record.checkOut}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ ...styles.tableCell, fontWeight: "500" }}>{new Date(record.date).toLocaleDateString()}</td>
                          <td style={styles.tableCell}>{record.checkIn}</td>
                          <td style={styles.tableCell}>{record.checkOut}</td>
                          <td style={styles.tableCell}>{record.workHours}</td>
                          <td style={styles.tableCell}>{record.extraHours}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
