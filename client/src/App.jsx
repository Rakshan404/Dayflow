import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import AdminPortal from "./pages/AdminPortal.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Attendance from "./pages/Attendance.jsx";
import Leave from "./pages/Leave.jsx";
import Payroll from "./pages/Payroll.jsx";
import Profile from "./pages/Profile.jsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/portal" element={<AdminPortal />} />
        <Route path="/admin/add-employee" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />


        <Route
          path="/dashboard"
          element={
            <>
              <Navbar />
              <Dashboard />
            </>
          }
        />
        <Route
          path="/attendance"
          element={
            <>
              <Navbar />
              <Attendance />
            </>
          }
        />
        <Route
          path="/leave"
          element={
            <>
              <Navbar />
              <Leave />
            </>
          }
        />
        <Route
          path="/payroll"
          element={
            <>
              <Navbar />
              <Payroll />
            </>
          }
        />
        <Route
          path="/profile"
          element={
            <>
              <Navbar />
              <Profile />
            </>
          }
        />
      </Routes>
    </>
  );
}
