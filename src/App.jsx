import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

// ✅ Lazy-loaded Public Pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

// ✅ Lazy-loaded User Pages
const UserChat = lazy(() => import("./pages/user/UserChat"));

// ✅ Lazy-loaded SuperAdmin Pages
const SuperAdminDashboard = lazy(() => import("./roles/superadmin/SuperAdminDashboard"));
const SuperAdminUsers = lazy(() => import("./roles/superadmin/SuperAdminUsers"));
const SuperAdminLogs = lazy(() => import("./roles/superadmin/SuperAdminLogs"));

// ✅ Lazy-loaded Co-SuperAdmin Pages
const CoSuperAdminDashboard = lazy(() => import("./roles/cosuperadmin/CoSuperAdminDashboard"));
const CoSuperAdminAdmins = lazy(() => import("./roles/cosuperadmin/CoSuperAdminAdmins"));
const CoSuperAdminDepartments = lazy(() => import("./roles/cosuperadmin/CoSuperAdminDepartments"));
const CoSuperAdminThemes = lazy(() => import("./roles/cosuperadmin/CoSuperAdminThemes"));
const CoSuperAdminLogs = lazy(() => import("./roles/cosuperadmin/CoSuperAdminLogs"));

// ✅ Lazy-loaded Admin Creator Pages
const AdminCreatorDashboard = lazy(() => import("./roles/admincreator/AdminCreatorDashboard"));
const AdminCreatorDocuments = lazy(() => import("./roles/admincreator/AdminCreatorDocuments"));
const AdminCreatorLogs = lazy(() => import("./roles/admincreator/AdminCreatorLogs"));

// ✅ Lazy-loaded Admin Approver Pages
const AdminApproverDashboard = lazy(() => import("./roles/adminapprover/AdminApproverDashboard"));
const AdminApproverDocuments = lazy(() => import("./roles/adminapprover/AdminApproverDocuments"));
const AdminApproverUploadDocuments = lazy(() => import("./roles/adminapprover/AdminApproverUploadDocuments"));
const AdminApproverLogs = lazy(() => import("./roles/adminapprover/AdminApproverLogs"));

// ✅ Protected Routes
import ProtectedRoute from "./utils/ProtectedRoute";
import UserProtectedRoute from "./utils/UserProtectedRoute";

// ✅ Toast system
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Router>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              {/* SuperAdmin */}
              <Route path="/superadmin" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/users" element={<SuperAdminUsers />} />
              <Route path="/superadmin/logs" element={<SuperAdminLogs />} />

              {/* Co-SuperAdmin */}
              <Route path="/cosuperadmin" element={<CoSuperAdminDashboard />} />
              <Route path="/cosuperadmin/admins" element={<CoSuperAdminAdmins />} />
              <Route path="/cosuperadmin/departments" element={<CoSuperAdminDepartments />} />
              <Route path="/cosuperadmin/themes" element={<CoSuperAdminThemes />} />
              <Route path="/cosuperadmin/logs" element={<CoSuperAdminLogs />} />

              {/* Admin Creator */}
              <Route path="/admincreator" element={<AdminCreatorDashboard />} />
              <Route path="/admincreator/documents" element={<AdminCreatorDocuments />} />
              <Route path="/admincreator/logs" element={<AdminCreatorLogs />} />

              {/* Admin Approver */}
              <Route path="/adminapprover" element={<AdminApproverDashboard />} />
              <Route path="/adminapprover/documents" element={<AdminApproverDocuments />} />
              <Route path="/adminapprover/uploaddocuments" element={<AdminApproverUploadDocuments />} />
              <Route path="/adminapprover/logs" element={<AdminApproverLogs />} />
            </Route>

            {/* User routes */}
            <Route element={<UserProtectedRoute />}>
              <Route path="/user/chat" element={<UserChat />} />
              <Route path="/chat/:convId" element={<UserChat />} />
              <Route path="/chat" element={<UserChat />} />
            </Route>
          </Routes>
        </Suspense>
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
          success: { style: { background: "#22c55e" }, iconTheme: { primary: "#fff", secondary: "#22c55e" } },
          error: { style: { background: "#ef4444" }, iconTheme: { primary: "#fff", secondary: "#ef4444" } },
          loading: { style: { background: "#2563eb" } },
          custom: { style: { background: "#f59e0b" } },
        }}
      />
    </>
  );
}

export default App;
