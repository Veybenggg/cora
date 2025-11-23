// src/pages/adminapprover/AdminApproverDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import SidebarAdminApprover from "../../components/SidebarAdminApprover";
import DocumentModal from "../../components/DocumentModal";
import { useDocumentStore } from "../../stores/useDocumentStore";
import { FileText, ChevronRight, Eye, Menu } from "lucide-react";
import { useAppSettingsStore } from "../../stores/useSettingsStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  mostSearchData,
  fetchSatisfactionMetrics,
  fetchDocument,
} from "../../api/api";

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

function AdminApproverDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(max-width: 767.98px)");
    const handler = (e) => setIsMobile(!!e.matches);
    handler(mql);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
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

  const { documents, fetchDocuments } = useDocumentStore();

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [remarks, setRemarks] = useState("");

  const handleView = (doc) => {
    setSelectedDoc(doc);
    setRemarks(doc.remarks || "");
  };

  const handleClose = () => {
    setSelectedDoc(null);
    setRemarks("");
  };

  const handleApprove = async (id) => {
    handleClose();
  };

  const handleDisapprove = async (id, newRemarks) => {
    handleClose();
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const primaryColor = useAppSettingsStore((s) => s.primary_color) || "#3b82f6";

  const sidebarOffset = useMemo(
    () => (isMobile ? "0" : sidebarOpen ? "17rem" : "5rem"),
    [isMobile, sidebarOpen]
  );

  // ======================
  // Charts Data & States
  // ======================
  const [searchStartDate, setSearchStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [searchEndDate, setSearchEndDate] = useState(new Date());
  const [searchedDataClassification, setSearchedDataClassification] = useState([]);

  const [ratingStartDate, setRatingStartDate] = useState(null);
  const [ratingEndDate, setRatingEndDate] = useState(null);
  const [satisfactionChart, setSatisfactionChart] = useState([]);

  const [data, setData] = useState([]);
  const [manualData, setManualData] = useState([]);

  // Fetch: File Uploads
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await fetchDocument();
        const filteredDocs = docs.filter((doc) => {
          const status = doc.status?.toLowerCase() || "pending-approval" || "approved";
          return status !== "declined" && doc.filename;
        });
        const counts = {};
        filteredDocs.forEach((doc) => {
          const title = doc.status || "Unknown";
          counts[title] = (counts[title] || 0) + 1;
        });
        const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));
        setData(chartData);
      } catch (err) {
        console.error("Failed to load documents:", err);
      }
    };
    loadDocuments();
  }, []);

  // Fetch: Manual Entries
  useEffect(() => {
    const loadManualEntries = async () => {
      try {
        const docs = await fetchDocument();
        const manualDocs = docs.filter((doc) => !doc.filename);
        const counts = {};
        manualDocs.forEach((doc) => {
          const form = doc.status || "Unknown";
          counts[form] = (counts[form] || 0) + 1;
        });
        const chartData = Object.entries(counts).map(([name, count]) => ({ name, count }));
        setManualData(chartData);
      } catch (err) {
        console.error("Failed to load manual entries:", err);
      }
    };
    loadManualEntries();
  }, []);

  // Fetch: Most Searched Data
  useEffect(() => {
    const fetchMostSearch = async () => {
      try {
        if (!searchStartDate || !searchEndDate) return;
        const result = await mostSearchData(searchStartDate, searchEndDate, 10);
        const formatted = result.map((item) => ({
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

  // Fetch: Satisfaction Metrics
  useEffect(() => {
    const getMetrics = async () => {
      try {
        const start = ratingStartDate ? ratingStartDate.toISOString().split("T")[0] : undefined;
        const end = ratingEndDate ? ratingEndDate.toISOString().split("T")[0] : undefined;
        const data = await fetchSatisfactionMetrics({ start_date: start, end_date: end });
        setSatisfactionChart(data);
      } catch (error) {
        console.error("Failed to load satisfaction metrics:", error);
      }
    };
    getMetrics();
  }, [ratingStartDate, ratingEndDate]);

  const SEARCH_COLORS = ["#2D3748", "#4A5568", "#718096", "#A0AEC0", "#CBD5E0", "#E2E8F0"];
  const RATING_COLORS = ["#48BB78", "#68D391", "#FBD38D", "#FC8181", "#F56565"];
  const FILE_COLORS = ["#8B5CF6", "#06B6D4", "#F59E0B"];
  const MANUAL_COLORS = ["#EF4444", "#10B981", "#3B82F6"];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="approver-sidebar"
        className={[
          "fixed top-0 left-0 h-screen z-50 transition-all duration-300",
          isMobile
            ? `w-64 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
            : `${sidebarOpen ? "w-64" : "w-16"}`,
        ].join(" ")}
      >
        <SidebarAdminApprover isOpen={sidebarOpen} setOpen={setSidebarOpen} isMobile={isMobile} />
      </div>

      <main
        className="transition-all duration-300 p-6 overflow-y-auto bg-gray-50 w-full"
        style={{ marginLeft: sidebarOffset }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="md:hidden flex items-center gap-3 w-full">
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
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl sm:text-3xl font-bold leading-tight truncate"
                style={{ color: primaryColor }}
              >
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Approve or reject documents and track activity
              </p>
            </div>
          </div>

          <div className="hidden md:block">
            <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
              Dashboard
            </h1>
            <p className="text-gray-600">Approve or reject documents and track activity</p>
          </div>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link to="/adminapprover/documents" className="group">
            <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200 hover:-translate-y-1 overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-blue-200 transition-all duration-300">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: primaryColor }}>—</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Quick Access</div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Documents
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Review and approve pending submissions.
                </p>
                <div className="flex items-center text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors">
                  <span>Open Documents</span>
                  <ChevronRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>

       

        {/* ====== Charts Section (copied from AdminCreatorDashboard) ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Most Searched Data */}
          <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200 hover:-translate-y-1 overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1" style={{ color: primaryColor }}>
                      Most Searched Data
                    </h2>
                    <p className="text-sm text-gray-600">Classification analysis</p>
                  </div>
                </div>
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
                Period: {searchStartDate?.toLocaleDateString()} – {searchEndDate?.toLocaleDateString()}
              </p>
              <div className="flex items-center gap-6">
                <div className="w-2/3">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={searchedDataClassification}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} tick={{ fill: "#64748b" }} />
                      <YAxis tick={{ fill: "#64748b" }} />
                      <Tooltip
                        formatter={(value) => [`${value} searches`, "Count"]}
                        labelFormatter={(label) => `Category: ${label}`}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          color: "#0f172a",
                        }}
                        itemStyle={{ color: "#0f172a" }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {searchedDataClassification.map((entry, index) => (
                          <Cell key={index} fill={SEARCH_COLORS[index % SEARCH_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-3 w-1/3">
                  {searchedDataClassification.map((entry, index) => (
                    <li key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-lg shadow-sm"
                          style={{ backgroundColor: SEARCH_COLORS[index % SEARCH_COLORS.length] }}
                        ></span>
                        <span className="font-medium text-sm text-gray-900">{entry.name}</span>
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
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <p className="text-xs text-gray-500 text-center mb-6 bg-gray-50 rounded-lg py-2">
                Period: {ratingStartDate ? ratingStartDate.toLocaleDateString() : "-"} –{" "}
                {ratingEndDate ? ratingEndDate.toLocaleDateString() : "-"}
              </p>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-full md:w-2/3">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={satisfactionChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} tick={{ fill: "#64748b" }} />
                      <YAxis tick={{ fill: "#64748b" }} />
                      <Tooltip
                        formatter={(value) => [`${value} responses`, "Count"]}
                        labelFormatter={(label) => `Rating: ${label}`}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          color: "#0f172a",
                        }}
                        itemStyle={{ color: "#0f172a" }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {satisfactionChart.map((entry, index) => (
                          <Cell key={index} fill={RATING_COLORS[index % RATING_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - File Uploads & Manual Entries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* File Uploads */}
          <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-purple-200 hover:-translate-y-1 overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-purple-600">File Uploads</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Document uploads by department and category.
              </p>
              <div className="flex items-center gap-6">
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
                            key={index}
                            fill={FILE_COLORS[index % FILE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} files`, name]}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-3 w-1/3">
                  {data.map((entry, i) => (
                    <li key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: FILE_COLORS[i % FILE_COLORS.length] }}
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

          {/* Manual Entries */}
          <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-red-200 hover:-translate-y-1 overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                      clipRule="evenodd"
                    />
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
                <div className="w-2/3">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={manualData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                      <Tooltip
                        formatter={(value) => [`${value} entries`, "Count"]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          color: "#0f172a",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {manualData.map((entry, index) => (
                          <Cell key={index} fill={MANUAL_COLORS[index % MANUAL_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-3 w-1/3">
                  {manualData.map((entry, i) => (
                    <li key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-lg shadow-sm"
                          style={{ backgroundColor: MANUAL_COLORS[i % MANUAL_COLORS.length] }}
                        ></span>
                        <span className="font-medium text-gray-700 text-sm">{entry.name}</span>
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
      </main>

      <DocumentModal
        document={selectedDoc}
        onClose={handleClose}
        onConfirm={handleApprove}
        onDelete={handleDisapprove}
        remarks={remarks}
        setRemarks={setRemarks}
      />
    </div>
  );
}

export default AdminApproverDashboard;
