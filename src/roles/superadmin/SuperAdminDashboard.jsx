import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/SidebarSuperAdmin";

function SuperAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-screen transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"}`}>
        <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      </div>

      {/* Main content */}
      <main
        className={`transition-all duration-300 flex-1 p-8 overflow-y-auto bg-gray-100 ${
          sidebarOpen ? "ml-64" : "ml-16"
        }`}
      >
        <h1 className="text-3xl font-bold text-primary mb-6">Dashboard</h1>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link to="/superadmin/users">
            <div className="bg-white shadow-md rounded-lg p-6 flex items-center justify-center flex-col cursor-pointer hover:shadow-lg transition">
              <div className="text-4xl mb-2">👤</div>
              <h2 className="text-xl font-semibold text-primary">Users</h2>
            </div>
          </Link>
          <Link to="/superadmin/logs">
            <div className="bg-white shadow-md rounded-lg p-6 flex items-center justify-center flex-col cursor-pointer hover:shadow-lg transition">
              <div className="text-4xl mb-2">📝</div>
              <h2 className="text-xl font-semibold text-primary">Logs</h2>
            </div>
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-lg overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-4 text-center align-middle">User</th>
                <th className="p-4 text-center align-middle">Timestamp</th>
                <th className="p-4 text-center align-middle">Role</th>
                <th className="p-4 text-center align-middle">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-100">
                <td className="p-4 text-black text-center align-middle">Coby</td>
                <td className="p-4 text-black text-center align-middle">March 23, 2025 10:42 AM</td>
                <td className="p-4 text-black text-center align-middle">Creator</td>
                <td className="p-4 text-center align-middle">
                  <div className="flex justify-center gap-3">
                    <button className="!bg-primary !text-white px-4 py-2 rounded-md hover:!bg-primary transition-colors">
                      Edit
                    </button>
                    <button className="!bg-primary !text-white px-4 py-2 rounded-md hover:!bg-primary transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              {/* You can map more rows here dynamically */}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default SuperAdminDashboard;
