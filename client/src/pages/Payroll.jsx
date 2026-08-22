import React, { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import { updateSalary } from "../api/salary";

const styles = {
  section: { backgroundColor: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1rem" },
  h4: { margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.1rem", fontWeight: "700" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  label: { color: "#475569", fontWeight: "500", fontSize: "0.95rem" },
  value: { fontWeight: "600", color: "#0f172a" },
  input: { padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", width: "120px", textAlign: "right" },
  buttonPrimary: { padding: "0.6rem 1.2rem", background: "linear-gradient(135deg, #6b21a8, #3b82f6)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }
};

export function PayrollDisplay({ employeeId, isSelf, isAdmin = false }) {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSalary() {
      try {
        setLoading(true);
        const res = await api.get(`/salary/${employeeId}`);
        if (res.data.success) {
          setSalary(res.data.salary);
          setEditForm(res.data.salary);
        } else {
          setError(res.data.message || "Failed to load salary.");
        }
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setError("You do not have permission to view this salary data.");
        } else if (err.response && err.response.status === 404) {
          setError("No salary record found for this employee.");
          // For admins, init a blank slate to create one
          if (isAdmin) {
             const blank = {
               monthlyWage: 0,
               workingDaysPerWeek: 5,
               breakTime: 60,
               basicPercent: 50,
               hraPercent: 50,
               standardAllowancePercent: 16.67,
               performanceBonusPercent: 8.33,
               ltaPercent: 8.33,
               pfEmployeePercent: 12,
               pfEmployerPercent: 12,
               professionalTax: 200
             };
             setSalary(blank);
             setEditForm(blank);
             setError(null); // Clear error since we can create it
          }
        } else {
          setError("Error fetching salary info.");
        }
      } finally {
        setLoading(false);
      }
    }
    
    if (employeeId) fetchSalary();
  }, [employeeId, isAdmin]);

  // Derived calculations (using editForm if editing, else salary)
  const currentData = isEditing && editForm ? editForm : salary;
  
  const calcs = useMemo(() => {
    if (!currentData) return {};
    const wage = currentData.monthlyWage || 0;
    
    const basic = (wage * (currentData.basicPercent || 0)) / 100;
    const hra = (basic * (currentData.hraPercent || 0)) / 100; // HRA is % of Basic
    const stdAllowance = (wage * (currentData.standardAllowancePercent || 0)) / 100;
    const perfBonus = (wage * (currentData.performanceBonusPercent || 0)) / 100;
    const lta = (wage * (currentData.ltaPercent || 0)) / 100;
    
    const sumFixed = basic + hra + stdAllowance + perfBonus + lta;
    const fixedAllowance = Math.max(0, wage - sumFixed); // Residual

    const pfEmployee = (basic * (currentData.pfEmployeePercent || 0)) / 100;
    const pfEmployer = (basic * (currentData.pfEmployerPercent || 0)) / 100;
    const pt = currentData.professionalTax || 0;

    return {
      wage,
      yearly: wage * 12,
      basic, hra, stdAllowance, perfBonus, lta, fixedAllowance,
      pfEmployee, pfEmployer, pt
    };
  }, [currentData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await updateSalary(employeeId, editForm);
      if (res.success) {
        setSalary(res.salary);
        setIsEditing(false);
      }
    } catch (err) {
      alert("Failed to save salary.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: Number(value) }));
  };

  if (loading) return <div style={{ color: "#64748b" }}>Loading salary info...</div>;
  if (error) return <div style={{ color: "#ef4444", backgroundColor: "#fef2f2", padding: "1rem", borderRadius: "8px" }}>{error}</div>;
  if (!currentData) return null;

  const formatCurrency = (val) => "₹" + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Top Controls */}
      {isAdmin && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          {isEditing ? (
            <>
              <button onClick={() => { setEditForm(salary); setIsEditing(false); }} style={{ ...styles.buttonPrimary, background: "#f1f5f9", color: "#334155" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={styles.buttonPrimary}>{saving ? "Saving..." : "Save Structure"}</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} style={styles.buttonPrimary}>Edit Structure</button>
          )}
        </div>
      )}

      {/* Main Overview */}
      <div style={{ ...styles.section, background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
        <h4 style={styles.h4}>Compensation Overview</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <div style={styles.row}>
              <span style={styles.label}>Month Wage</span>
              {isEditing ? (
                <input type="number" name="monthlyWage" value={currentData.monthlyWage} onChange={handleChange} style={styles.input} />
              ) : (
                <span style={{ ...styles.value, fontSize: "1.5rem", color: "#16a34a" }}>{formatCurrency(calcs.wage)}</span>
              )}
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Yearly Wage</span>
              <span style={styles.value}>{formatCurrency(calcs.yearly)}</span>
            </div>
          </div>
          <div>
            <div style={styles.row}>
              <span style={styles.label}>No. of working days/week</span>
              {isEditing ? (
                <input type="number" name="workingDaysPerWeek" value={currentData.workingDaysPerWeek} onChange={handleChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.workingDaysPerWeek} Days</span>
              )}
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Break Time</span>
              {isEditing ? (
                <input type="number" name="breakTime" value={currentData.breakTime} onChange={handleChange} style={styles.input} />
              ) : (
                <span style={styles.value}>{currentData.breakTime} Minutes</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        {/* Earnings */}
        <div style={styles.section}>
          <h4 style={{ ...styles.h4, color: "#16a34a" }}>Salary Components (Earnings)</h4>
          
          <div style={styles.row}>
            <span style={styles.label}>Basic Salary</span>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {isEditing ? <><input type="number" name="basicPercent" value={currentData.basicPercent} onChange={handleChange} style={{...styles.input, width: "60px"}} /> %</> : <span style={{ color: "#64748b" }}>{currentData.basicPercent}%</span>}
              <span style={styles.value}>{formatCurrency(calcs.basic)}</span>
            </div>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>House Rent Allowance</span>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {isEditing ? <><input type="number" name="hraPercent" value={currentData.hraPercent} onChange={handleChange} style={{...styles.input, width: "60px"}} /> %</> : <span style={{ color: "#64748b" }}>{currentData.hraPercent}%</span>}
              <span style={styles.value}>{formatCurrency(calcs.hra)}</span>
            </div>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Standard Allowance</span>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {isEditing ? <><input type="number" name="standardAllowancePercent" value={currentData.standardAllowancePercent} onChange={handleChange} style={{...styles.input, width: "60px"}} /> %</> : <span style={{ color: "#64748b" }}>{currentData.standardAllowancePercent}%</span>}
              <span style={styles.value}>{formatCurrency(calcs.stdAllowance)}</span>
            </div>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Performance Bonus</span>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {isEditing ? <><input type="number" name="performanceBonusPercent" value={currentData.performanceBonusPercent} onChange={handleChange} style={{...styles.input, width: "60px"}} /> %</> : <span style={{ color: "#64748b" }}>{currentData.performanceBonusPercent}%</span>}
              <span style={styles.value}>{formatCurrency(calcs.perfBonus)}</span>
            </div>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Leave Travel Allowance</span>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {isEditing ? <><input type="number" name="ltaPercent" value={currentData.ltaPercent} onChange={handleChange} style={{...styles.input, width: "60px"}} /> %</> : <span style={{ color: "#64748b" }}>{currentData.ltaPercent}%</span>}
              <span style={styles.value}>{formatCurrency(calcs.lta)}</span>
            </div>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Fixed Allowance (Residual)</span>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span style={{ color: "#64748b" }}>Auto</span>
              <span style={styles.value}>{formatCurrency(calcs.fixedAllowance)}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div style={{ ...styles.section, background: "#fef2f2", borderColor: "#fecaca" }}>
            <h4 style={{ ...styles.h4, color: "#b91c1c" }}>Provident Fund Contribution</h4>
            <div style={styles.row}>
              <span style={styles.label}>Employee %</span>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                {isEditing ? <><input type="number" name="pfEmployeePercent" value={currentData.pfEmployeePercent} onChange={handleChange} style={{...styles.input, width: "60px"}} /> %</> : <span style={{ color: "#64748b" }}>{currentData.pfEmployeePercent}%</span>}
                <span style={{ ...styles.value, color: "#b91c1c" }}>{formatCurrency(calcs.pfEmployee)}</span>
              </div>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Employer %</span>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                {isEditing ? <><input type="number" name="pfEmployerPercent" value={currentData.pfEmployerPercent} onChange={handleChange} style={{...styles.input, width: "60px"}} /> %</> : <span style={{ color: "#64748b" }}>{currentData.pfEmployerPercent}%</span>}
                <span style={{ ...styles.value, color: "#b91c1c" }}>{formatCurrency(calcs.pfEmployer)}</span>
              </div>
            </div>
          </div>

          <div style={{ ...styles.section, background: "#fef2f2", borderColor: "#fecaca" }}>
            <h4 style={{ ...styles.h4, color: "#b91c1c" }}>Tax Deductions</h4>
            <div style={styles.row}>
              <span style={styles.label}>Professional Tax</span>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                {isEditing ? <><input type="number" name="professionalTax" value={currentData.professionalTax} onChange={handleChange} style={styles.input} /></> : <span style={{ color: "#64748b" }}>Flat</span>}
                <span style={{ ...styles.value, color: "#b91c1c" }}>{formatCurrency(calcs.pt)}</span>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}

// For backward compatibility if it's rendered as a page
export default function PayrollPage() {
  return <div style={{ padding: "2rem" }}>Redirecting...</div>;
}
