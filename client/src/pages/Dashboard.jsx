import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Briefcase, Mail, Phone, ChevronRight, User } from "lucide-react";
import { getAllEmployees } from "../api/employees";
import { checkIn, checkOut, getAttendance } from "../api/attendance";

const styles = {
  card: { backgroundColor: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", border: "none" },
  gradientBg: { background: "linear-gradient(135deg, #6b21a8, #3b82f6)" },
  gradientText: { background: "linear-gradient(135deg, #6b21a8, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  h2: { margin: "0", fontWeight: "800", color: "#111827", fontSize: "2rem" },
  buttonPrimary: { padding: "0.6rem 1.2rem", background: "linear-gradient(135deg, #6b21a8, #3b82f6)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "opacity 0.2s" },
  modalBackdrop: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(17, 24, 39, 0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" },
  modalCard: { backgroundColor: "white", padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Attendance states for current user
  const [checkingIn, setCheckingIn] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [hasCheckedOutToday, setHasCheckedOutToday] = useState(false);
  const [myStatus, setMyStatus] = useState("absent");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }
    try {
      setUser(JSON.parse(userStr));
    } catch (e) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch all employees
        const emps = await getAllEmployees();
        setEmployees(emps);
        
        // Fetch my attendance to determine button state
        const myId = user.id || user._id;
        const myAttendance = await getAttendance(myId);
        
        const today = new Date().toDateString();
        const todayRecord = myAttendance.find(r => new Date(r.date).toDateString() === today);
        
        if (todayRecord) {
           setHasCheckedInToday(!!todayRecord.checkIn && todayRecord.checkIn !== "-");
           setHasCheckedOutToday(!!todayRecord.checkOut && todayRecord.checkOut !== "-");
           setMyStatus(todayRecord.status);
        }
        
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleToggleCheckIn = async () => {
    setCheckingIn(true);
    try {
      if (!hasCheckedInToday) {
        await checkIn();
        setHasCheckedInToday(true);
        setMyStatus("present");
      } else if (!hasCheckedOutToday) {
        await checkOut();
        setHasCheckedOutToday(true);
      }
      
      // Update my own status in the employees list without full refetch
      const myId = user.id || user._id;
      setEmployees(prev => prev.map(emp => {
        if (emp._id === myId) {
           return { ...emp, status: "present" };
        }
        return emp;
      }));
      
    } catch (err) {
      setError("Failed to mark attendance.");
    } finally {
      setCheckingIn(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present": return "bg-green-500";
      case "leave": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  if (!user) return <div style={{ padding: "2rem" }}>Initializing...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", backgroundColor: "#f8fafc", minHeight: "calc(100vh - 70px)" }}>
      {error && (
        <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", fontWeight: "500", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {/* Top Section: Welcome & Actions */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ ...styles.card, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", marginBottom: "2rem", position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "300px", height: "300px", background: "linear-gradient(135deg, #6b21a820, #3b82f620)", borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" }} />
        
        <div style={{ zIndex: 1 }}>
          <h2 style={styles.h2}>Welcome, <span style={styles.gradientText}>{user.fullName || user.name}</span></h2>
          <p style={{ color: "#64748b", marginTop: "0.5rem", fontSize: "0.95rem" }}>
            {user.role?.toLowerCase() === "admin" ? "Administrator Dashboard" : "Employee Dashboard"}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", zIndex: 1 }}>
          {/* My Status Dot */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
             <div className={"w-4 h-4 rounded-full " + getStatusColor(myStatus)} style={{ border: "2px solid white", boxShadow: "0 0 0 1px #e2e8f0" }} />
             <span style={{ fontWeight: "600", color: "#334155", textTransform: "capitalize" }}>{myStatus}</span>
          </div>

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
      </motion.div>

      {/* Employee Grid */}
      <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", marginBottom: "1rem" }}>Team Directory</h3>
      
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading team members...</div>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>No employees found.</div>
      ) : (
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}
        >
          {employees.map(emp => (
            <motion.div 
              key={emp._id} 
              variants={itemVariants} 
              style={{ ...styles.card, cursor: "pointer", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", transition: "transform 0.2s, box-shadow 0.2s" }}
              onClick={() => setSelectedEmp(emp)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = styles.card.boxShadow; }}
            >
              <div style={{ position: "relative" }}>
                {emp.profilePicture ? (
                   <img src={emp.profilePicture} alt={emp.name} style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#f1f5f9" }} />
                ) : (
                   <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                     <User size={28} />
                   </div>
                )}
                {/* Status Dot */}
                <div 
                  className={getStatusColor(emp.status)} 
                  style={{ position: "absolute", bottom: "2px", right: "2px", width: "12px", height: "12px", borderRadius: "50%", border: "2px solid white" }} 
                  title={`Status: ${emp.status}`}
                />
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.25rem 0", fontWeight: "700", color: "#0f172a", fontSize: "1.05rem" }}>{emp.name || emp.fullName}</h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Briefcase size={14} /> {emp.designation || "Employee"}
                </p>
                <p style={{ margin: "0.15rem 0 0 0", color: "#64748b", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  {emp.department || "General"}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedEmp && (
          <motion.div 
            style={styles.modalBackdrop} 
            onClick={() => setSelectedEmp(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              style={styles.modalCard} 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
            >
              <button onClick={() => setSelectedEmp(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#94a3b8" }}>&times;</button>
              
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
                <div style={{ position: "relative" }}>
                  {selectedEmp.profilePicture ? (
                     <img src={selectedEmp.profilePicture} alt={selectedEmp.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#f1f5f9" }} />
                  ) : (
                     <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                       <User size={40} />
                     </div>
                  )}
                  <div 
                    className={getStatusColor(selectedEmp.status)} 
                    style={{ position: "absolute", bottom: "4px", right: "4px", width: "16px", height: "16px", borderRadius: "50%", border: "2px solid white" }} 
                  />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem 0", fontWeight: "800", color: "#0f172a", fontSize: "1.5rem" }}>{selectedEmp.name || selectedEmp.fullName}</h3>
                  <span style={{ padding: "0.25rem 0.75rem", backgroundColor: "#f1f5f9", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                    {selectedEmp.customId || selectedEmp.loginId}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ backgroundColor: "#f8fafc", padding: "0.5rem", borderRadius: "8px", color: "#3b82f6" }}>
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "#94a3b8" }}>Role / Dept</p>
                    <p style={{ margin: 0, fontWeight: "500", color: "#1e293b" }}>{selectedEmp.designation || "Employee"} • {selectedEmp.department || "General"}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ backgroundColor: "#f8fafc", padding: "0.5rem", borderRadius: "8px", color: "#8b5cf6" }}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "#94a3b8" }}>Email</p>
                    <p style={{ margin: 0, fontWeight: "500", color: "#1e293b" }}>{selectedEmp.email}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ backgroundColor: "#f8fafc", padding: "0.5rem", borderRadius: "8px", color: "#10b981" }}>
                    <Phone size={20} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "#94a3b8" }}>Phone</p>
                    <p style={{ margin: 0, fontWeight: "500", color: "#1e293b" }}>{selectedEmp.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>
              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
