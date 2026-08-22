import React, { useState, useEffect } from "react";
import { Briefcase, Mail, Phone, User, Calendar, Building, DollarSign, Shield } from "lucide-react";
import { getEmployee, updateEmployee } from "../api/employees";
import { PayrollDisplay } from "./Payroll";

const styles = {
  card: { backgroundColor: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
  tabButton: { padding: "0.75rem 1.5rem", border: "none", background: "transparent", fontWeight: "600", fontSize: "0.95rem", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: "-2px", color: "#64748b", transition: "all 0.2s" },
  tabButtonActive: { color: "#6b21a8", borderBottom: "2px solid #6b21a8" },
  sectionTitle: { margin: "0 0 1.5rem 0", color: "#0f172a", fontSize: "1.25rem", fontWeight: "700" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: { color: "#64748b", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" },
  value: { color: "#0f172a", fontSize: "1rem", fontWeight: "500", padding: "0.5rem 0" },
  input: { padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.95rem", color: "#0f172a" },
  select: { padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.95rem", color: "#0f172a", backgroundColor: "white" },
  buttonPrimary: { padding: "0.6rem 1.2rem", background: "linear-gradient(135deg, #6b21a8, #3b82f6)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  buttonSecondary: { padding: "0.6rem 1.2rem", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }
};

export function ProfileDisplay({ employeeId, isSelf, isAdmin = false, defaultTab = "resume" }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchEmp() {
      try {
        setLoading(true);
        const data = await getEmployee(employeeId);
        setEmployee(data);
        setEditForm(data);
      } catch (err) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    if (employeeId) fetchEmp();
  }, [employeeId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateEmployee(employeeId, editForm);
      setEmployee(updated);
      setEditForm(updated);
      setIsEditing(false);
    } catch (err) {
      alert("Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || {}),
        [name]: value
      }
    }));
  };

  if (loading) return <div style={{ color: "#64748b" }}>Loading profile...</div>;
  if (error) return <div style={{ color: "#ef4444" }}>{error}</div>;
  if (!employee) return null;

  const currentData = isEditing ? editForm : employee;
  const canEdit = isSelf || isAdmin;

  // Reused header
  const renderHeader = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
      <div style={{ position: "relative" }}>
        {employee.profilePicture ? (
           <img src={employee.profilePicture} alt={employee.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#f1f5f9" }} />
        ) : (
           <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
             <User size={40} />
           </div>
        )}
      </div>
      <div>
        <h3 style={{ margin: "0 0 0.25rem 0", fontWeight: "800", color: "#0f172a", fontSize: "1.5rem" }}>{employee.name || employee.fullName}</h3>
        <span style={{ padding: "0.25rem 0.75rem", backgroundColor: "#f1f5f9", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
          {employee.customId || employee.loginId}
        </span>
      </div>
    </div>
  );

  return (
    <div>
      {renderHeader()}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "2px solid #f1f5f9", marginBottom: "2rem", overflowX: "auto" }}>
        <button onClick={() => setActiveTab("resume")} style={{ ...styles.tabButton, ...(activeTab === "resume" ? styles.tabButtonActive : {}) }}>Resume</button>
        <button onClick={() => setActiveTab("private")} style={{ ...styles.tabButton, ...(activeTab === "private" ? styles.tabButtonActive : {}) }}>Private Info</button>
        {canEdit && (
           <button onClick={() => setActiveTab("salary")} style={{ ...styles.tabButton, ...(activeTab === "salary" ? styles.tabButtonActive : {}) }}>Salary Info</button>
        )}
        <button onClick={() => setActiveTab("security")} style={{ ...styles.tabButton, ...(activeTab === "security" ? styles.tabButtonActive : {}) }}>Security</button>
      </div>

      {/* Action Buttons */}
      {canEdit && activeTab !== "resume" && activeTab !== "salary" && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginBottom: "1.5rem" }}>
          {isEditing ? (
            <>
              <button onClick={() => { setEditForm(employee); setIsEditing(false); }} style={styles.buttonSecondary}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={styles.buttonPrimary}>{saving ? "Saving..." : "Save Changes"}</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} style={styles.buttonPrimary}>Edit Info</button>
          )}
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === "resume" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.label}>Role / Dept</span>
              <span style={styles.value}>{employee.designation || "Employee"} • {employee.department || "General"}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Email</span>
              <span style={styles.value}>{employee.email}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Phone</span>
              <span style={styles.value}>{employee.phone || "Not provided"}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.label}>About</span>
              <span style={styles.value}>{employee.about || "No details provided."}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "private" && (
        <div>
          <h4 style={styles.sectionTitle}>Personal Details</h4>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.label}>Date of Birth</span>
              {isEditing ? (
                <input type="date" name="dateOfBirth" value={currentData.dateOfBirth ? currentData.dateOfBirth.split("T")[0] : ""} onChange={handleChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.dateOfBirth ? new Date(currentData.dateOfBirth).toLocaleDateString() : "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Gender</span>
              {isEditing ? (
                <select name="gender" value={currentData.gender || ""} onChange={handleChange} style={styles.select}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <span style={styles.value}>{currentData.gender || "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Marital Status</span>
              {isEditing ? (
                <select name="maritalStatus" value={currentData.maritalStatus || ""} onChange={handleChange} style={styles.select}>
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              ) : (
                <span style={styles.value}>{currentData.maritalStatus || "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Nationality</span>
              {isEditing ? (
                <input type="text" name="nationality" value={currentData.nationality || ""} onChange={handleChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.nationality || "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Personal Email</span>
              {isEditing ? (
                <input type="email" name="personalEmail" value={currentData.personalEmail || ""} onChange={handleChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.personalEmail || "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Residing Address</span>
              {isEditing ? (
                <input type="text" name="address" value={currentData.address || ""} onChange={handleChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.address || "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Date of Joining</span>
              {isEditing && isAdmin ? (
                <input type="date" name="dateOfJoining" value={currentData.dateOfJoining ? currentData.dateOfJoining.split("T")[0] : ""} onChange={handleChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.dateOfJoining ? new Date(currentData.dateOfJoining).toLocaleDateString() : "-"}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "salary" && canEdit && (
        <PayrollDisplay employeeId={employeeId} isSelf={isSelf} isAdmin={isAdmin} />
      )}

      {activeTab === "security" && (
        <div>
          <h4 style={styles.sectionTitle}>Bank Details</h4>
          <div style={styles.grid}>
            <div style={styles.field}>
              <span style={styles.label}>Account Number</span>
              {isEditing ? (
                <input type="text" name="accountNumber" value={currentData.bankDetails?.accountNumber || ""} onChange={handleBankChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.bankDetails?.accountNumber || "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Bank Name</span>
              {isEditing ? (
                <input type="text" name="bankName" value={currentData.bankDetails?.bankName || ""} onChange={handleBankChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.bankDetails?.bankName || "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>IFSC Code</span>
              {isEditing ? (
                <input type="text" name="ifscCode" value={currentData.bankDetails?.ifscCode || ""} onChange={handleBankChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.bankDetails?.ifscCode || "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>PAN No</span>
              {isEditing ? (
                <input type="text" name="panNo" value={currentData.bankDetails?.panNo || ""} onChange={handleBankChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.bankDetails?.panNo || "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>UAN No</span>
              {isEditing ? (
                <input type="text" name="uanNo" value={currentData.bankDetails?.uanNo || ""} onChange={handleBankChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.bankDetails?.uanNo || "-"}</span>
              )}
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Employee Code</span>
              <span style={styles.value}>{currentData.customId}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Full Page View
export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  if (!user) return <div style={{ padding: "2rem" }}>Loading...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={styles.card}>
        <ProfileDisplay employeeId={user.id || user._id} isSelf={true} isAdmin={user.role?.toLowerCase() === "admin"} />
      </div>
    </div>
  );
}
