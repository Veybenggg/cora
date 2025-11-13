// Enhanced component with modern card designs and responsive layouts (mobile/tablet/desktop)
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/SidebarCoSuperAdmin";
import { useAuthStore } from "../../stores/userStores";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Menu } from "lucide-react";
import { useAppSettingsStore } from "../../stores/useSettingsStore";
import { getUser,mostSearchData,fetchSatisfactionMetrics } from "../../api/api";
import ModalEditDepartment from "../../components/ModalEditDepartment";
import ModalConfirmDelete from "../../components/ModalConfirmDelete";
import ModalAdminUsers from "../../components/ModalAdminUsers";
import ModalDepartments from "../../components/ModalDepartments";
import { fetchDocument } from "../../api/api";


// Charts
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";


function CoSuperAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const departments = useAuthStore((state) => state.departments);
  const fetchDepartment = useAuthStore((state) => state.getDepartment);

  // Store actions
  const updateDepartment = useAuthStore((state) => state.updateDepartment);
  const deleteDepartment = useAuthStore((state) => state.deleteDepartment);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDept, setDeletingDept] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [showDepartmentsModal, setShowDepartmentsModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showAdminsModal, setShowAdminsModal] = useState(false);
  const [selectedAdminRole, setSelectedAdminRole] = useState(null);

  const [searchStartDate, setSearchStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [searchEndDate, setSearchEndDate] = useState(new Date());
  const [ratingStartDate, setRatingStartDate] = useState(new Date());
  const [ratingEndDate, setRatingEndDate] = useState(new Date());
  const [users,setUsers] = useState([])
  const [satisfactionChart, setSatisfactionChart] = useState([]);
  const [searchedDataClassification, setSearchedDataClassification] = useState([]);
  const [data, setData] = useState([]);
  const [manualData, setManualData] = useState([]);

useEffect(() => {
  const loadDocuments = async () => {
    try {
      const docs = await fetchDocument();

      // ✅ Only include docs that are neither approved/declined
      //    AND are not manual entries (filename is null/undefined)
      const filteredDocs = docs.filter((doc) => {
        const status = doc.status?.toLowerCase() || "pending-approval" || "approved";
        return (
          status !== "declined" &&
          doc.filename // ✅ exclude manual entry (filename is null)
        );
      });

      // Group by department
      const counts = {};
      filteredDocs.forEach((doc) => {
        const title = doc.status || "Unknown";
        counts[title] = (counts[title] || 0) + 1;
      });

      // Convert to recharts-friendly format
      const chartData = Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      }));

      setData(chartData);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  loadDocuments();
}, []);


useEffect(() => {
    const loadManualEntries = async () => {
      try {
        const docs = await fetchDocument();

        // ✅ Only include manual entries (filename === null)
        const manualDocs = docs.filter((doc) => !doc.filename);

        // Group by form name (use title for example)
        const counts = {};
        manualDocs.forEach((doc) => {
          const form = doc.status || "Unknown";
          counts[form] = (counts[form] || 0) + 1;
        });

        const chartData = Object.entries(counts).map(([name, count]) => ({
          name,
          count,
        }));

        setManualData(chartData);
      } catch (err) {
        console.error("Failed to load manual entries:", err);
      }
    };

    loadManualEntries();
  }, []);
  
useEffect(() => {
  const fetchMostSearch = async () => {
    try {
      if (!searchStartDate || !searchEndDate) return;

      const data = await mostSearchData(searchStartDate, searchEndDate, 10);

      const formatted = data.map((item) => ({
        name: item.title,
        count: item.count,
      }));

      setSearchedDataClassification(formatted);
    } catch (err) {
      console.error("Failed to load most searched data:", err);
    }
  };

  fetchMostSearch();
}, [searchStartDate, searchEndDate]);


useEffect(()=>{

})
  


  const roleMap = {
    Creator: "admincreator",
    Approver: "adminapprover",
    Guest: "guest",
  };

  const handleAdminSliceClick = (sliceName) => {
    setSelectedAdminRole(roleMap[sliceName] ?? null);
    setShowAdminsModal(true);
  };

  const handleDepartmentBarClick = () => {
    setShowDepartmentsModal(true);
  };


  
  useEffect(() => {
    fetchDepartment();
  }, [fetchDepartment]);

  // Responsive breakpoint (md < 768px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767.98px)");
    const handler = (e) => setIsMobile(e.matches);
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = sidebarOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isMobile, sidebarOpen]);

  // Theme color
  const primaryColor = useAppSettingsStore((s) => s.primary_color) || "#3b82f6";

  // Desktop offset: 17rem open / 5rem closed; Mobile: overlay (0 offset)
  const sidebarOffset = useMemo(
    () => (isMobile ? "0" : sidebarOpen ? "17rem" : "5rem"),
    [isMobile, sidebarOpen]
  );

  

  // Sample data
  


  // Color schemes
  const COLORS = ["#E53E3E", "#3182CE", "#38A169"];
  const SEARCH_COLORS = [
    "#2D3748",
    "#4A5568",
    "#718096",
    "#A0AEC0",
    "#CBD5E0",
    "#E2E8F0",
  ];
  const RATING_COLORS = ["#48BB78", "#68D391", "#FBD38D", "#FC8181", "#F56565"];
  const FILE_COLORS = ["#8B5CF6", "#06B6D4", "#F59E0B"];
  const MANUAL_COLORS = ["#EF4444", "#10B981", "#3B82F6"];

  // Event handlers
  const handleEditClick = (dept) => {
    setEditingDept(dept);
    setShowEditModal(true);
  };

  const handleUpdateDepartment = async (id, data) => {
    await updateDepartment(id, data);
    const { error } = useAuthStore.getState();
    if (!error) {
      alert("Department updated successfully!");
      await fetchDepartment();
      setShowEditModal(false);
      setEditingDept(null);
    } else {
      alert("Failed to update department: " + error);
      throw new Error(error);
    }
  };

  const handleDeleteClick = (dept) => {
    setDeletingDept(dept);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDept) return;
    try {
      setIsDeleting(true);
      setDeleteError("");
      await deleteDepartment(deletingDept.id);
      const { error } = useAuthStore.getState();
      if (error) throw new Error(error);

      await fetchDepartment();
      setShowDeleteModal(false);
      setDeletingDept(null);
      alert("Department deleted successfully!");
    } catch (err) {
      setDeleteError(err?.message || "Failed to delete department.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUser();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        
      }
    };

    fetchUsers();
  }, []);


const userChart = users.reduce((acc, user) => {
    const role = user.role || "Unknown";

    // skip superadmin + co-superadmin
    if (role === "superadmin" || role === "co-superadmin") return acc;

    const found = acc.find((item) => item.name === role);
    if (found) {
      found.value += 1;
    } else {
      acc.push({ name: role, value: 1 });
    }
    return acc;
  }, []);

const deptChart = users.reduce((acc, user) => {
  const department = user.department || "Unknown"
   
  if(department === "Unknown") return acc;
  const found = acc.find((item) => item.name === department);
  if (found) {
    found.count += 1; 
  } else {
    acc.push({ name: department, count: 1 }); // add new
  }
  return acc;
}, []);


useEffect(() => {
  const getMetrics = async () => {
    try {
      const start = ratingStartDate?.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const end = ratingEndDate?.toLocaleDateString("en-CA");

      const data = await fetchSatisfactionMetrics({ start_date: start, end_date: end });
      setSatisfactionChart(data);
    } catch (error) {
      console.error("Failed to load satisfaction metrics:", error);
    }
  };

  getMetrics();
}, [ratingStartDate, ratingEndDate]);


  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Mobile backdrop (tap to close) */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (mobile = drawer; desktop = collapsible) */}
      <div
        className={[
          "fixed top-0 left-0 h-screen z-50 transition-all duration-300",
          isMobile
            ? `w-64 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
            : `${sidebarOpen ? "w-64" : "w-16"}`,
        ].join(" ")}
      >
        <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} isMobile={isMobile} />
      </div>

      {/* Main Content (shifts on desktop, overlay on mobile) */}
      <main
        className="transition-all duration-300 p-6 overflow-y-auto bg-gray-50 w-full"
        style={{ marginLeft: sidebarOffset }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {/* Mobile: burger + large title */}
          <div className="md:hidden flex items-center gap-3">
            <Menu
              onClick={() => setSidebarOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="Open menu"
              className="h-6 w-6 cursor-pointer"
              style={{ color: primaryColor }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSidebarOpen(true);
              }}
              aria-pressed={sidebarOpen}
            />
            <div className="flex-1">
              <h1
                className="text-2xl sm:text-3xl font-bold leading-tight"
                style={{ color: primaryColor }}
              >
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Monitor analytics and manage system data
              </p>
            </div>
          </div>

          {/* Desktop title */}
          <div className="hidden md:block">
            <h1
              className="text-3xl font-bold leading-tight mb-2"
              style={{ color: primaryColor }}
            >
              Dashboard
            </h1>
            <p className="text-gray-600">Monitor analytics and manage system data</p>
          </div>
        </div>

        {/* Top Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Classification of Most Searched Data */}
          <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200 hover:-translate-y-1 overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mr-3">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2
                      className="text-xl font-semibold mb-1"
                      style={{ color: primaryColor }}
                    >
                      Most Searched Data
                    </h2>
                    <p className="text-sm text-gray-600">Classification analysis</p>
                  </div>
                </div>

                {/* Date Range Picker */}
                <div className="flex items-center space-x-2">
                  <DatePicker
                    selected={searchStartDate}
                    onChange={(date) => setSearchStartDate(date)}
                    selectsStart
                    startDate={searchStartDate}
                    endDate={searchEndDate}
                    className="text-black border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-400">to</span>
                  <DatePicker
                    selected={searchEndDate}
                    onChange={(date) => setSearchEndDate(date)}
                    selectsEnd
                    startDate={searchStartDate}
                    endDate={searchEndDate}
                    minDate={searchStartDate}
                    className="text-black border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mb-6 bg-gray-50 rounded-lg py-2">
                Period: {searchStartDate?.toLocaleDateString()} –{" "}
                {searchEndDate?.toLocaleDateString()}
              </p>

              <div className="flex items-center gap-6">
                {/* Bar Chart */}
                <div className="w-2/3">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={searchedDataClassification}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={11}
                        tick={{ fill: "#64748b" }}
                      />
                      <YAxis tick={{ fill: "#64748b" }} />
                        <Tooltip
                          formatter={(value) => [`${value} searches`, "Count"]}
                          labelFormatter={(label) => `Category: ${label}`}
                          wrapperStyle={{ zIndex: 9999, pointerEvents: "none" }}
                          allowEscapeViewBox={{ x: true, y: true }}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            color: "#0f172a" // slate-900
                          }}
                          itemStyle={{ color: "#0f172a" }}
                          labelStyle={{ color: "#334155", fontWeight: 600 }} // slate-700
                        />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {searchedDataClassification.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              SEARCH_COLORS[index % SEARCH_COLORS.length]
                            }
                            style={{
                              filter:
                                "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                            }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Labels */}
                <ul className="space-y-3 w-1/3">
                  {searchedDataClassification.map((entry, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-lg shadow-sm"
                          style={{
                            backgroundColor:
                              SEARCH_COLORS[index % SEARCH_COLORS.length],
                          }}
                        ></span>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-gray-900">
                            {entry.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {entry.category}
                          </span>
                        </div>
                      </div>
                      <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-700 shadow-sm">
                        {entry.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* User Experience Rating */}
          <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-emerald-200 hover:-translate-y-1 overflow-hidden">
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg mr-3">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1" style={{ color: primaryColor }}>
                User Experience Rating
              </h2>
              <p className="text-sm text-gray-600">Satisfaction metrics</p>
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center space-x-2">
            <DatePicker
              selected={ratingStartDate}
              onChange={(date) => setRatingStartDate(date)}
              selectsStart
              startDate={ratingStartDate}
              endDate={ratingEndDate}
              className="text-black border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <span className="text-gray-400">to</span>
            <DatePicker
              selected={ratingEndDate}
              onChange={(date) => setRatingEndDate(date)}
              selectsEnd
              startDate={ratingStartDate}
              endDate={ratingEndDate}
              minDate={ratingStartDate}
              className="text-black border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Period Display */}
        <p className="text-xs text-gray-500 text-center mb-6 bg-gray-50 rounded-lg py-2">
          Period: {ratingStartDate ? ratingStartDate.toLocaleDateString() : "-"} –{" "}
          {ratingEndDate ? ratingEndDate.toLocaleDateString() : "-"}
        </p>

        {/* Chart */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-full md:w-2/3">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={satisfactionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={11}
                  tick={{ fill: "#64748b" }}
                />
                <YAxis tick={{ fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => [`${value} responses`, "Count"]}
                  labelFormatter={(label) => `Rating: ${label}`}
                  wrapperStyle={{ zIndex: 9999, pointerEvents: "none" }}
                  allowEscapeViewBox={{ x: true, y: true }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    color: "#0f172a",
                  }}
                  itemStyle={{ color: "#0f172a" }}
                  labelStyle={{ color: "#334155", fontWeight: 600 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {satisfactionChart.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={RATING_COLORS[index % RATING_COLORS.length]}
                      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
        </div>

        {/* Analytics Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Admin Users Card */}
          <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200 hover:-translate-y-1 overflow-hidden cursor-pointer"onClick={() => handleAdminSliceClick("user")}>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {userChart.reduce((sum, item) => sum + item.value, 0)}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2" style={{ color: primaryColor }}>
                Users
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
               All users and their role.
              </p>

              <div className="flex items-center gap-6">
                {/* Pie Chart */}
                <div className="w-2/3 relative">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={userChart}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={3}
                        onClick={() => setShowAdminsModal(true)}
                      >
                        {userChart.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            style={{
                              cursor: "pointer",
                              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
                            }}
                          />
                        ))}
                      </Pie>
      <Tooltip
        formatter={(value, name) => [`${value} users`, name]}
        wrapperStyle={{ zIndex: 9999, pointerEvents: "none" }}
        allowEscapeViewBox={{ x: true, y: true }}
        contentStyle={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          color: "#0f172a"
        }}
        itemStyle={{ color: "#0f172a" }}
        labelStyle={{ color: "#334155", fontWeight: 600 }}
      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Labels */}
                <ul className="space-y-3 w-1/3">
                  {userChart.map((entry, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></span>
                        <span className="font-medium text-gray-700 text-sm">{entry.name}</span>
                      </div>
                      <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-700 shadow-sm">
                        {entry.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Departments Card */}
          <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-emerald-200 hover:-translate-y-1 overflow-hidden">

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">
                    {deptChart.reduce((sum, item) => sum + item.count, 0)}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Total Users</div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2" style={{ color: primaryColor }}>
                Departments
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                User distribution across organizational departments.
              </p>

              <div className="flex items-center gap-6">
                {/* Bar Chart */}
                <div className="w-2/3">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={deptChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                      />
      <Tooltip
        formatter={(value) => [`${value} users`, "Count"]}
        wrapperStyle={{ zIndex: 9999, pointerEvents: "none" }}
        allowEscapeViewBox={{ x: true, y: true }}
        contentStyle={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          color: "#0f172a"
        }}
        itemStyle={{ color: "#0f172a" }}
        labelStyle={{ color: "#334155", fontWeight: 600 }}
      />
                      <Bar
                        dataKey="count"
                        cursor="pointer"
                        onClick={handleDepartmentBarClick}
                        radius={[6, 6, 0, 0]}
                      >
                        {deptChart.map((dept, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                            style={{
                              filter:
                                "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
                            }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Labels */}
                <ul className="space-y-3 w-1/3">
                  {deptChart.map((entry, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={handleDepartmentBarClick}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-lg shadow-sm"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></span>
                        <span className="font-medium text-gray-700 text-sm">
                          {entry.name}
                        </span>
                      </div>
                      <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-700 shadow-sm">
                        {entry.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* File Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* File Uploads Card */}
          <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-purple-200 hover:-translate-y-1 overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {data.reduce((sum, d) => sum + d.value, 0)}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Total
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2 text-purple-600">
          File Uploads
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Document uploads by department and the status.
        </p>

        <div className="flex items-center gap-6">
          {/* Pie Chart */}
          <div className="w-2/3 relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={FILE_COLORS[index % FILE_COLORS.length]}
                      style={{
                        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} files`, name]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Labels */}
          <ul className="space-y-3 w-1/3">
            {data.map((entry, i) => (
              <li
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{
                      backgroundColor: FILE_COLORS[i % FILE_COLORS.length],
                    }}
                  ></span>
                  <span className="font-medium text-gray-700 text-sm">
                    {entry.name}
                  </span>
                </div>
                <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-700 shadow-sm">
                  {entry.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

          {/* Manual Entries Card*/}
          <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-red-200 hover:-translate-y-1 overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">
              {manualData.reduce((sum, d) => sum + d.count, 0)}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2" style={{ color: "red" }}>
          Manual Entries
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Direct data entry forms and submissions.
        </p>

        <div className="flex items-center gap-6">
          {/* Bar Chart */}
          <div className="w-2/3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={manualData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => [`${value} entries`, "Count"]}
                  wrapperStyle={{ zIndex: 9999, pointerEvents: "none" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    color: "#0f172a",
                  }}
                  itemStyle={{ color: "#0f172a" }}
                  labelStyle={{ color: "#334155", fontWeight: 600 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {manualData.map((entry, index) => (
                    <Cell key={index} fill={MANUAL_COLORS[index % MANUAL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Labels */}
          <ul className="space-y-3 w-1/3">
            {manualData.map((entry, i) => (
              <li key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: MANUAL_COLORS[i % MANUAL_COLORS.length] }}></span>
                  <span className="font-medium text-gray-700 text-sm">{entry.name}</span>
                </div>
                <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-700 shadow-sm">{entry.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
        </div>
      </main>

      {/* Modals */}
      {showAdminsModal && (
        <ModalAdminUsers
          isOpen={showAdminsModal}
          onClose={() => setShowAdminsModal(false)}
          roleFilter={selectedAdminRole}
        />
      )}

      {showDepartmentsModal && (
        <ModalDepartments
          isOpen={showDepartmentsModal}
          onClose={() => setShowDepartmentsModal(false)}
          department={null}
        />
      )}

      <ModalEditDepartment
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDept(null);
        }}
        onSave={handleUpdateDepartment}
        department={editingDept}
      />

      <ModalConfirmDelete
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingDept(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
}

export default CoSuperAdminDashboard;
