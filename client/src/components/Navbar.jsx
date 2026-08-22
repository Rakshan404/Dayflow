import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ display: "flex", gap: "1rem", padding: "1rem", borderBottom: "1px solid #ccc" }}>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/attendance">Attendance</Link>
      <Link to="/leave">Time Off</Link>
      <Link to="/payroll">Salary</Link>
      <Link to="/profile">Profile</Link>
    </nav>
  );
}
