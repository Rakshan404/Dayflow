import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, LogOut } from "lucide-react";

// TEAM FLAG: I (Person D) have redesigned this shared Navbar file to match the wireframe layout. 
// - Removed direct links to Salary and Profile.
// - Added avatar dropdown for Profile/Logout.
// Please check your routes if you depended on the old top-level links!

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitials = () => {
    if (!user) return "?";
    const name = user.name || user.fullName || "User";
    return name.charAt(0).toUpperCase();
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Attendance", path: "/attendance" },
    { name: "Time Off", path: "/leave" }
  ];

  return (
    <nav style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      padding: "0 2rem", 
      height: "70px", 
      backgroundColor: "white", 
      borderBottom: "1px solid #f1f5f9",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
    }}>
      
      {/* Left: Company Logo/Name */}
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <Link to="/dashboard" style={{ 
          fontSize: "1.5rem", 
          fontWeight: "800", 
          textDecoration: "none", 
          color: "#0f172a",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <div style={{ 
            width: "32px", 
            height: "32px", 
            borderRadius: "8px", 
            background: "linear-gradient(135deg, #6b21a8, #3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold"
          }}>D</div>
          Dayflow
        </Link>
      </div>

      {/* Center: Nav Links */}
      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        {navLinks.map(link => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link 
              key={link.name} 
              to={link.path} 
              style={{
                textDecoration: "none",
                fontWeight: isActive ? "700" : "600",
                color: isActive ? "#6b21a8" : "#64748b",
                position: "relative",
                padding: "0.5rem 0",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#3b82f6"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#64748b"; }}
            >
              {link.name}
              {isActive && (
                <div style={{
                  position: "absolute",
                  bottom: "-15px",
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "linear-gradient(135deg, #6b21a8, #3b82f6)",
                  borderRadius: "3px 3px 0 0"
                }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* Right: Avatar Dropdown */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }} ref={dropdownRef}>
        <div style={{ position: "relative" }}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "none",
              background: "linear-gradient(135deg, #6b21a8, #3b82f6)",
              color: "white",
              fontWeight: "700",
              fontSize: "1.1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "transform 0.1s"
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            {getInitials()}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "50px",
              right: "0",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
              border: "1px solid #f1f5f9",
              width: "200px",
              padding: "0.5rem",
              zIndex: 1000
            }}>
              <div style={{ padding: "0.5rem", borderBottom: "1px solid #f1f5f9", marginBottom: "0.5rem" }}>
                <p style={{ margin: 0, fontWeight: "700", color: "#0f172a", fontSize: "0.95rem" }}>
                  {user?.name || user?.fullName || "User"}
                </p>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.email || "employee@domain.com"}
                </p>
              </div>
              
              <Link 
                to="/profile" 
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem",
                  textDecoration: "none",
                  color: "#334155",
                  fontWeight: "500",
                  fontSize: "0.9rem",
                  borderRadius: "8px",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <User size={16} /> My Profile
              </Link>
              
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem",
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  color: "#ef4444",
                  fontWeight: "500",
                  fontSize: "0.9rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
