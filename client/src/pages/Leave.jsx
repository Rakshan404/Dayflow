import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getLeaveBalance, getMyLeaves, createLeave, approveLeave, rejectLeave } from "../api/leave";
import { updateLeaveBalance } from "../api/employees";

// TODO: Replace this with real data fetched from GET /api/employees once Person A builds it.
const HARDCODED_EMPLOYEES = [
  { _id: "6a89504ebaf4c650c80593a2", name: "UI Employee", paid: 24, sick: 7 }
];

// Global Style Constants for matching "Visual Language"
const styles = {
  card: { backgroundColor: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", border: "none" },
  gradientBg: { background: "linear-gradient(135deg, #6b21a8, #3b82f6)" },
  gradientText: { background: "linear-gradient(135deg, #6b21a8, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  h2: { margin: "0", fontWeight: "800", color: "#111827", fontSize: "2rem" },
  h3: { margin: "0 0 1rem 0", fontWeight: "700", color: "#111827", fontSize: "1.5rem" },
  buttonPrimary: { padding: "0.6rem 1.2rem", background: "linear-gradient(135deg, #6b21a8, #3b82f6)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "opacity 0.2s" },
  buttonSecondary: { padding: "0.6rem 1.2rem", backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  input: { width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #d1d5db", backgroundColor: "#f9fafb", color: "#111827" },
  label: { display: "block", marginBottom: "0.3rem", color: "#4b5563", fontWeight: "500", fontSize: "0.9rem" },
  modalBackdrop: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(17, 24, 39, 0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" },
  modalCard: { backgroundColor: "white", padding: "2rem", borderRadius: "16px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", position: "relative" },
  tableHeader: { padding: "1rem", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", fontSize: "0.75rem", tracking: "wider", borderBottom: "2px solid #e5e7eb" },
  tableCell: { padding: "1rem", color: "#374151", borderBottom: "1px solid #f3f4f6" }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function AdminAllocation({ onClose }) {
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [paid, setPaid] = useState("");
  const [sick, setSick] = useState("");
  
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedEmpId) {
      const emp = HARDCODED_EMPLOYEES.find(e => e._id === selectedEmpId);
      if (emp) {
        setPaid(emp.paid);
        setSick(emp.sick);
      }
    } else {
      setPaid("");
      setSick("");
    }
    setStatus(null);
  }, [selectedEmpId]);

  const handleSave = async () => {
    setStatus(null);
    if (!selectedEmpId) return;
    
    if (paid < 0 || sick < 0) {
      setStatus({ type: 'error', msg: "Days cannot be negative." });
      return;
    }

    setSaving(true);
    try {
      const data = await updateLeaveBalance(selectedEmpId, paid, sick);
      setStatus({ type: 'success', msg: `Updated to Paid: ${data.leaveBalances.paid}, Sick: ${data.leaveBalances.sick}` });
      const emp = HARDCODED_EMPLOYEES.find(e => e._id === selectedEmpId);
      if (emp) {
        emp.paid = data.leaveBalances.paid;
        emp.sick = data.leaveBalances.sick;
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || "Failed to update allocation." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      style={styles.modalBackdrop} 
      onClick={onClose}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div 
        style={styles.modalCard} 
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
      >
        <button onClick={onClose} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af" }}>&times;</button>
        
        <h3 style={styles.h3}>Allocate <span style={styles.gradientText}>Balances</span></h3>
        
        {status && (
          <div style={{ padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", backgroundColor: status.type === 'error' ? "#fef2f2" : "#f0fdf4", color: status.type === 'error' ? "#b91c1c" : "#15803d", fontWeight: "500" }}>
            {status.msg}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={styles.label}>Select Employee</label>
            <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} style={styles.input}>
              <option value="">-- Choose Employee --</option>
              {HARDCODED_EMPLOYEES.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Paid Days</label>
              <input type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} disabled={!selectedEmpId} style={styles.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Sick Days</label>
              <input type="number" min="0" value={sick} onChange={(e) => setSick(e.target.value)} disabled={!selectedEmpId} style={styles.input} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
            <button onClick={onClose} style={styles.buttonSecondary}>Close</button>
            <button onClick={handleSave} disabled={!selectedEmpId || saving} style={{ ...styles.buttonPrimary, opacity: (!selectedEmpId || saving) ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper to decode JWT payload

export default function Leave() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [balances, setBalances] = useState({ paid: null, sick: null });
  const [leaves, setLeaves] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [type, setType] = useState("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [adminComments, setAdminComments] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [initTimeout, setInitTimeout] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }
    try {
      const u = JSON.parse(userStr);
      if (u && u.role) {
        setRole(u.role.toLowerCase());
      } else {
        navigate("/login");
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!role) {
        setInitTimeout(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [role]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        const [balRes, leavesRes] = await Promise.all([
          getLeaveBalance(),
          getMyLeaves()
        ]);
        setBalances(balRes);
        setLeaves(leavesRes);
        setErrorData(null);
      } catch (err) {
        console.error(err);
        setErrorData("Failed to load leave information.");
      } finally {
        setLoadingData(false);
      }
    }
    if (role) {
      fetchData();
    }
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);
    try {
      await createLeave({ type, startDate, endDate, remarks });
      setShowForm(false);
      setType("paid");
      setStartDate("");
      setEndDate("");
      setRemarks("");
      
      const [balRes, leavesRes] = await Promise.all([
        getLeaveBalance(),
        getMyLeaves()
      ]);
      setBalances(balRes);
      setLeaves(leavesRes);
    } catch (err) {
      console.error("Error creating leave:", err);
      setFormError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAdminAction = async (id, actionStr) => {
    setActionLoadingId(id);
    try {
      const comment = adminComments[id];
      if (actionStr === "approve") {
        await approveLeave(id, comment);
      } else {
        await rejectLeave(id, comment);
      }
      const updatedLeaves = await getMyLeaves();
      setLeaves(updatedLeaves);
    } catch (err) {
      console.error(`Error ${actionStr} leave:`, err);
      alert(err.response?.data?.message || `Failed to ${actionStr} request.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!role) {
    if (initTimeout) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2 style={styles.h2}>Authentication Error</h2>
          <p style={{ margin: "1rem 0" }}>We couldn't verify your session.</p>
          <button onClick={() => navigate("/login")} style={styles.buttonPrimary}>
            Go to Login
          </button>
        </div>
      );
    }
    return <div style={{ padding: "2rem" }}>Initializing...</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {errorData && (
        <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", fontWeight: "500", border: "1px solid #fecaca" }}>
          {errorData}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}
      >
        <h2 style={styles.h2}>Time <span style={styles.gradientText}>Off</span></h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          {role === "admin" && (
            <button onClick={() => setShowAllocationModal(true)} style={styles.buttonSecondary}>
              Allocate Balances
            </button>
          )}
          {role === "employee" && (
            <button onClick={() => setShowForm(true)} style={styles.buttonPrimary}>
              + Request Time Off
            </button>
          )}
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show"
      >

      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem" }}>
        <motion.div variants={itemVariants} style={{ ...styles.card, flex: 1, borderTop: "4px solid #6b21a8" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#4b5563", fontWeight: "600" }}>Paid Time Off</h4>
          {loadingData ? (
            <div style={{ color: "#9ca3af" }}>Loading...</div>
          ) : (
            <>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: "#111827" }}>
                <span style={styles.gradientText}>{balances.paid?.available}</span> / {balances.paid?.total}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>days available</div>
            </>
          )}
        </motion.div>
        <motion.div variants={itemVariants} style={{ ...styles.card, flex: 1, borderTop: "4px solid #3b82f6" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#4b5563", fontWeight: "600" }}>Sick Time Off</h4>
          {loadingData ? (
            <div style={{ color: "#9ca3af" }}>Loading...</div>
          ) : (
            <>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: "#111827" }}>
                <span style={{ color: "#3b82f6" }}>{balances.sick?.available}</span> / {balances.sick?.total}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>days available</div>
            </>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showAllocationModal && role === "admin" && (
          <AdminAllocation onClose={() => setShowAllocationModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && role === "employee" && (
          <motion.div 
            style={styles.modalBackdrop} 
            onClick={() => setShowForm(false)}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              style={styles.modalCard} 
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
            >
              <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af" }}>&times;</button>
              <h3 style={styles.h3}>Apply for <span style={styles.gradientText}>Leave</span></h3>
              {formError && <div style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" }}>{formError}</div>}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={styles.label}>Leave Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} style={styles.input} required>
                    <option value="paid">Paid Time Off</option>
                    <option value="sick">Sick Time Off</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.input} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.input} required />
                  </div>
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={styles.label}>Remarks (Optional)</label>
                  <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} style={{ ...styles.input, minHeight: "80px" }} placeholder="Reason for leave..." />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                  <button type="button" onClick={() => setShowForm(false)} style={styles.buttonSecondary}>Cancel</button>
                  <button type="submit" disabled={formSubmitting} style={{ ...styles.buttonPrimary, opacity: formSubmitting ? 0.7 : 1 }}>
                    {formSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loadingData && !errorData && (
        <motion.div variants={itemVariants} style={styles.card}>
          <h3 style={styles.h3}>{role === "admin" ? "All Employee Requests" : "My Requests"}</h3>
          
          {leaves.length === 0 ? (
            <p style={{ margin: 0, color: "#6b7280" }}>No leave requests found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    {role === "admin" && <th style={styles.tableHeader}>Employee</th>}
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Start Date</th>
                    <th style={styles.tableHeader}>End Date</th>
                    <th style={styles.tableHeader}>Days</th>
                    <th style={styles.tableHeader}>Status</th>
                    <th style={styles.tableHeader}>Remarks</th>
                    {role === "admin" && <th style={styles.tableHeader}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave._id}>
                      {role === "admin" && (
                        <td style={{ ...styles.tableCell, fontWeight: "600", color: "#111827" }}>
                          {leave.employeeId?.name || "Unknown Employee"}
                        </td>
                      )}
                      <td style={{ ...styles.tableCell, textTransform: "capitalize", fontWeight: "500" }}>{leave.type}</td>
                      <td style={styles.tableCell}>{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td style={styles.tableCell}>{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td style={{ ...styles.tableCell, fontWeight: "600" }}>{leave.allocationDays}</td>
                      <td style={styles.tableCell}>
                        <span style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          backgroundColor: leave.status === "approved" ? "#dcfce7" : leave.status === "rejected" ? "#fee2e2" : "#fef3c7",
                          color: leave.status === "approved" ? "#166534" : leave.status === "rejected" ? "#991b1b" : "#92400e"
                        }}>
                          {leave.status}
                        </span>
                      </td>
                      <td style={{ ...styles.tableCell, color: "#6b7280", maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {leave.remarks || "-"}
                      </td>
                      {role === "admin" && (
                        <td style={styles.tableCell}>
                          {leave.status === "pending" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <input 
                                type="text"
                                placeholder="Optional comment"
                                value={adminComments[leave._id] || ""}
                                onChange={(e) => setAdminComments({ ...adminComments, [leave._id]: e.target.value })}
                                style={{ ...styles.input, padding: "0.4rem", fontSize: "0.85rem", width: "160px" }}
                              />
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                  onClick={() => handleAdminAction(leave._id, "approve")}
                                  disabled={actionLoadingId === leave._id}
                                  style={{ padding: "0.4rem 0.8rem", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: actionLoadingId === leave._id ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: "600" }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleAdminAction(leave._id, "reject")}
                                  disabled={actionLoadingId === leave._id}
                                  style={{ padding: "0.4rem 0.8rem", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: actionLoadingId === leave._id ? "not-allowed" : "pointer", fontSize: "0.85rem", fontWeight: "600" }}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: "#9ca3af", fontSize: "0.85rem", fontStyle: "italic" }}>
                              {leave.adminComment && `"${leave.adminComment}"`}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </motion.div>
        )}

        {role === "employee" && (
          <motion.div variants={itemVariants}>
            <EmployeeCalendar 
              leaves={leaves} 
              loading={loadingData}
              onEmptyDateClick={(dateStr) => {
                setShowForm(true);
                setStartDate(dateStr);
              }}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function EmployeeCalendar({ leaves, onEmptyDateClick, loading }) {
  const [popover, setPopover] = useState(null);
  
  const YEAR = 2026;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const PUBLIC_HOLIDAYS_2026 = [
    { date: "2026-01-26", name: "Republic Day" },
    { date: "2026-08-15", name: "Independence Day" },
    { date: "2026-10-02", name: "Gandhi Jayanti" },
    { date: "2026-11-08", name: "Diwali" },
    { date: "2026-12-25", name: "Christmas Day" }
  ];

  const getLeaveForDate = (year, month, day) => {
    const calDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.find(l => {
      const startStr = l.startDate.split('T')[0];
      const endStr = l.endDate.split('T')[0];
      return calDateStr >= startStr && calDateStr <= endStr;
    });
  };

  const handleDayClick = (e, year, month, day, leave) => {
    e.stopPropagation();
    if (leave) {
      setPopover({ leave, x: e.clientX, y: e.clientY });
    } else {
      setPopover(null);
      const calDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      onEmptyDateClick(calDateStr);
    }
  };

  useEffect(() => {
    const close = () => setPopover(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <div style={{ ...styles.card, marginTop: "2rem" }}>
      <h3 style={styles.h3}>Leave <span style={styles.gradientText}>Calendar</span> ({YEAR})</h3>
      
      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", fontSize: "0.85rem", flexWrap: "wrap", fontWeight: "500", color: "#4b5563" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "12px", height: "12px", backgroundColor: "#dcfce7", border: "2px solid #22c55e", borderRadius: "4px" }}></div>
          <span>Approved</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "12px", height: "12px", backgroundColor: "#fef3c7", border: "2px solid #f59e0b", borderRadius: "4px" }}></div>
          <span>Pending</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "12px", height: "12px", backgroundColor: "#f3f4f6", border: "2px solid #d1d5db", borderRadius: "4px" }}></div>
          <span style={{ textDecoration: "line-through", color: "#9ca3af" }}>Rejected</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "8px", height: "8px", backgroundColor: "#ef4444", borderRadius: "50%" }}></div>
          <span>Public Holiday</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Loading calendar...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {months.map((monthName, monthIndex) => {
            const daysInMonth = new Date(YEAR, monthIndex + 1, 0).getDate();
            const firstDayIndex = new Date(YEAR, monthIndex, 1).getDay();
            
            const emptyCells = Array.from({ length: firstDayIndex });
            const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

            return (
              <div key={monthName} style={{ border: "1px solid #e5e7eb", padding: "0.75rem", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                <h4 style={{ margin: "0 0 0.75rem 0", textAlign: "center", fontSize: "0.95rem", fontWeight: "700", color: "#374151" }}>{monthName}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center", fontSize: "0.8rem" }}>
                  {daysOfWeek.map(d => <div key={d} style={{ fontWeight: "700", color: "#9ca3af", marginBottom: "0.25rem" }}>{d}</div>)}
                  
                  {emptyCells.map((_, i) => <div key={`empty-${i}`}></div>)}
                  
                  {dayCells.map(day => {
                    const leave = getLeaveForDate(YEAR, monthIndex, day);
                    const calDateStr = `${YEAR}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const holiday = PUBLIC_HOLIDAYS_2026.find(h => h.date === calDateStr);

                    let cellStyle = { padding: "6px 0", cursor: "pointer", borderRadius: "4px", position: "relative", fontWeight: "500", transition: "all 0.2s" };
                    let contentStyle = {};
                    
                    if (leave) {
                      if (leave.status === "approved") {
                        cellStyle.backgroundColor = "#dcfce7";
                        cellStyle.color = "#166534";
                      } else if (leave.status === "pending") {
                        cellStyle.backgroundColor = "#fef3c7";
                        cellStyle.color = "#92400e";
                      } else if (leave.status === "rejected") {
                        cellStyle.backgroundColor = "#f3f4f6";
                        cellStyle.color = "#9ca3af";
                        contentStyle.textDecoration = "line-through";
                      }
                    } else {
                      cellStyle.backgroundColor = "#fff";
                      cellStyle.color = "#374151";
                    }

                    return (
                      <div 
                        key={day} 
                        style={cellStyle}
                        onClick={(e) => handleDayClick(e, YEAR, monthIndex, day, leave)}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                        title={leave ? undefined : holiday ? holiday.name : "Click to request leave"}
                      >
                        <span style={contentStyle}>{day}</span>
                        {holiday && (
                          <div 
                            style={{ position: "absolute", bottom: "2px", left: "50%", transform: "translateX(-50%)", width: "4px", height: "4px", backgroundColor: "#ef4444", borderRadius: "50%" }} 
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {popover && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ position: "fixed", left: popover.x + 10, top: popover.y + 10, backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", padding: "1.25rem", borderRadius: "12px", zIndex: 1000, maxWidth: "250px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: "0 0 0.5rem 0", textTransform: "capitalize", color: "#111827", fontWeight: "700" }}>{popover.leave.type} Leave</h4>
            <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "#4b5563" }}>
              <strong>Dates:</strong> {new Date(popover.leave.startDate).toLocaleDateString()} - {new Date(popover.leave.endDate).toLocaleDateString()}
            </p>
            <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "#4b5563" }}>
              <strong>Status:</strong> <span style={{textTransform: "uppercase", fontWeight: "700", color: popover.leave.status === 'approved' ? '#166534' : popover.leave.status === 'rejected' ? '#991b1b' : '#92400e'}}>{popover.leave.status}</span>
            </p>
            {popover.leave.remarks && (
              <p style={{ margin: "0", fontSize: "0.85rem", color: "#4b5563" }}><strong>Remarks:</strong> {popover.leave.remarks}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
