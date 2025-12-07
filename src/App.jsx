import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SuperAdminDashboard from "./roles/superadmin/SuperAdminDashboard";
import SuperAdminUsers from "./roles/superadmin/SuperAdminUsers";
import SuperAdminLogs from "./roles/superadmin/SuperAdminLogs";
import CoSuperAdminDashboard from "./roles/cosuperadmin/CoSuperAdminDashboard";
import CoSuperAdminAdmins from "./roles/cosuperadmin/CoSuperAdminAdmins";
import CoSuperAdminDepartments from "./roles/cosuperadmin/CoSuperAdminDepartments";
import CoSuperAdminThemes from "./roles/cosuperadmin/CoSuperAdminThemes";
import CoSuperAdminLogs from "./roles/cosuperadmin/CoSuperAdminLogs";
import AdminCreatorDashboard from "./roles/admincreator/AdminCreatorDashboard";
import AdminCreatorDocuments from "./roles/admincreator/AdminCreatorDocuments";
import AdminCreatorLogs from "./roles/admincreator/AdminCreatorLogs";
import AdminApproverDashboard from "./roles/adminapprover/AdminApproverDashboard";
import AdminApproverDocuments from "./roles/adminapprover/AdminApproverDocuments";
import AdminApproverUploadDocuments from "./roles/adminapprover/AdminApproverUploadDocuments";
import AdminApproverLogs from "./roles/adminapprover/AdminApproverLogs";
import UserChat from "./pages/user/UserChat";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedRoute from "./utils/ProtectedRoute";
import UserProtectedRoute from "./utils/UserProtectedRoute";

// ✅ Toast system
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* SuperAdmin */}
            <Route path="/superadmin" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/users" element={<SuperAdminUsers />} />
            <Route path="/superadmin/logs" element={<SuperAdminLogs />} />

            {/* Co-SuperAdmin */}
            <Route path="/cosuperadmin" element={<CoSuperAdminDashboard />} />
            <Route
              path="/cosuperadmin/admins"
              element={<CoSuperAdminAdmins />}
            />
            <Route
              path="/cosuperadmin/departments"
              element={<CoSuperAdminDepartments />}
            />
            <Route
              path="/cosuperadmin/themes"
              element={<CoSuperAdminThemes />}
            />
            <Route path="/cosuperadmin/logs" element={<CoSuperAdminLogs />} />

            {/* Admin Creator */}
            <Route path="/admincreator" element={<AdminCreatorDashboard />} />
            <Route path="/admincreator/logs" element={<AdminCreatorLogs />} />
            <Route
              path="/admincreator/documents"
              element={<AdminCreatorDocuments />}
            />

            {/* Admin Approver */}
            <Route path="/adminapprover" element={<AdminApproverDashboard />} />
            <Route
              path="/adminapprover/documents"
              element={<AdminApproverDocuments />}
            />
            <Route
              path="/adminapprover/uploaddocuments"
              element={<AdminApproverUploadDocuments />}
            />
            <Route
              path="/adminapprover/logs"
              element={<AdminApproverLogs />}
            />
          </Route>

          {/* User routes */}
          <Route element={<UserProtectedRoute />}>
            <Route path="/user/chat" element={<UserChat />} />
          </Route>

          {/* Misc */}
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/chat/:convId" element={<UserChat />} />
          <Route path="/chat" element={<UserChat />} />
        </Routes>
      </Router>

      {/* ✅ Global toast notifications */}
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "8px",
            padding: "14px 18px",
            fontSize: "0.95rem",
            fontWeight: 500,
            color: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
          success: {
            iconTheme: { primary: "#fff", secondary: "#22c55e" },
            style: { background: "#22c55e" }, // Green success
          },
          error: {
            iconTheme: { primary: "#fff", secondary: "#ef4444" },
            style: { background: "#ef4444" }, // Red error
          },
          loading: {
            style: { background: "#2563eb" }, // Blue loading
          },
          custom: {
            style: { background: "#f59e0b" }, // Orange warning
          },
        }}
      />
    </>
  );
}

export default App;
