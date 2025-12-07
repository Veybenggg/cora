import { useState, useEffect, useMemo } from "react";
import SidebarAdminApprover from "../../components/SidebarAdminApprover";
import ModalUploadDocument from "../../components/ModalUploadDocument";
import ModalManualEntry from "../../components/ModalManualEntry";
import ModalScan from "../../components/ModalScan";
import { Upload, ScanLine, Pencil, Search, Menu } from "lucide-react";
import { useDocumentStore } from "../../stores/useDocumentStore";
import { submitManualEntry } from "../../api/api";
import { useAppSettingsStore } from "../../stores/useSettingsStore";
import toast from "react-hot-toast";
import { X } from "lucide-react";

function AdminApproverUploadDocuments() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  // ✅ For viewing manual-entry documents
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentModalData, setContentModalData] = useState({ title: "", content: "" });

  // ✅ Responsive breakpoint
  useEffect(() => {
  if (typeof window === "undefined") return;

  const mql = window.matchMedia("(max-width: 767.98px)");

  const handler = (e) => {
    setIsMobile(e.matches);
  };

  setIsMobile(mql.matches); // initial value
  mql.addEventListener("change", handler);

  return () => mql.removeEventListener("change", handler);
}, []);

  // ✅ Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = sidebarOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isMobile, sidebarOpen]);

  // ✅ Close drawer on Escape
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;
    const onKey = (e) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, sidebarOpen]);

  // ✅ Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

  const { documents, fetchDocuments } = useDocumentStore();
  const [filterStatus, setFilterStatus] = useState("pending-approval");
  const [search, setSearch] = useState("");

  const primaryColor = useAppSettingsStore((s) => s.primary_color) || "#3b82f6";

  // ✅ Sidebar offset calculation
  const sidebarOffset = useMemo(
    () => (isMobile ? "0" : sidebarOpen ? "17rem" : "5rem"),
    [isMobile, sidebarOpen]
  );

  // ✅ Toastified upload
  const handleUpload = async (formData) => {
    try {
      const file = formData.get("file");
      const title_id = formData.get("title_id");
      const keywords = formData.get("keywords");

      await useDocumentStore.getState().createDocument(file, title_id, keywords);
      toast.success("📄 Document uploaded successfully!");
      setShowUploadModal(false);
      fetchDocuments(filterStatus === "all" ? "" : filterStatus);
    } catch (error) {
      toast.error("❌ Upload failed: " + error.message);
    }
  };

  const handleManualSave = async (manualDoc) => {
    try {
      const payload = {
        title_id: manualDoc.title_id,
        content: manualDoc.content,
        keywords: manualDoc.keywords || [],
      };
      await submitManualEntry(payload);
      toast.success("📝 Manual entry saved successfully!");
      setShowManualModal(false);
      fetchDocuments(filterStatus === "all" ? "" : filterStatus);
    } catch (err) {
      toast.error("❌ Failed to submit manual document: " + err.message);
    }
  };

  function ContentModal({ isOpen, onClose, title, content }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-2xl border border-gray-200 max-h-[calc(100vh-2rem)] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-200">
              <Pencil className="h-5 w-5 text-gray-700" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {title || "Document"}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Preview of the manually created document.
              </p>
            </div>
            <X
              onClick={onClose}
              className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
              role="button"
              tabIndex={0}
              aria-label="Close preview"
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && onClose()
              }
            />
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
          <div className="prose max-w-none whitespace-pre-wrap text-gray-900">
            {content || "No content"}
          </div>
        </div>
      </div>
    </div>
  );
}

  // ✅ Toastified scan upload
  const handleScanUpload = async (scannedDoc) => {
    try {
      await useDocumentStore.getState().createDocument(
        scannedDoc.image,
        scannedDoc.title_id,
        scannedDoc.keywords
      );
      toast.success("📠 Scanned document uploaded successfully!");
      fetchDocuments(filterStatus === "all" ? "" : filterStatus);
    } catch (error) {
      toast.error("❌ Failed to upload scanned document: " + error.message);
    }
  };

  // ✅ Updated document filtering
  const filteredDocs = (documents || []).filter((doc) => {
    const matchesSearch =
      (doc.uploaded_by_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (doc.notes || "").toLowerCase().includes(search.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    return doc.status === filterStatus && matchesSearch;
  });

  // ✅ Fetch documents on filter change
  useEffect(() => {
    fetchDocuments(filterStatus === "all" ? "" : filterStatus);
  }, [filterStatus, fetchDocuments]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
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

      {/* Main */}
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
            />
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl sm:text-3xl font-bold leading-tight truncate"
                style={{ color: primaryColor }}
              >
                Documents
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Upload, scan, and manage documents for approval
              </p>
            </div>
          </div>

          <div className="hidden md:block">
            <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
              Documents
            </h1>
            <p className="text-gray-600">Upload, scan, and manage documents for approval</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Upload */}
          <div className="!bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 flex flex-col items-center text-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="!text-gray-900 text-xl font-semibold">Upload Documents</h3>
            <p className="!text-gray-600 text-sm max-w-xs">Add files directly from your device.</p>
            <button
              className="!bg-blue-600 hover:!bg-blue-700 !text-white px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowUploadModal(true)}
            >
              Upload
            </button>
          </div>

          {/* Scan */}
          <div className="!bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 flex flex-col items-center text-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <ScanLine className="w-8 h-8 text-white" />
            </div>
            <h3 className="!text-gray-900 text-xl font-semibold">Scan Documents</h3>
            <p className="!text-gray-600 text-sm max-w-xs">Upload scans and convert them to files.</p>
            <button
              onClick={() => setShowScanModal(true)}
              className="!bg-emerald-600 hover:!bg-emerald-700 !text-white px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Upload
            </button>
          </div>

          {/* Manual Entry */}
          <div className="!bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 flex flex-col items-center text-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl shadow-lg">
              <Pencil className="w-8 h-8 text-white" />
            </div>
            <h3 className="!text-gray-900 text-xl font-semibold">Manual Entry</h3>
            <p className="!text-gray-600 text-sm max-w-xs">
              Create text-only documents right in the app.
            </p>
            <button
              className="!bg-fuchsia-600 hover:!bg-fuchsia-700 !text-white px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowManualModal(true)}
            >
              Create
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="!bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: primaryColor }}
              />
              <input
                type="text"
                placeholder="Search by name or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none"
                style={{
                  border: `2px solid ${primaryColor}`,
                  backgroundColor: "#fff",
                }}
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  filterStatus === "all"
                    ? "!bg-blue-600 !text-white"
                    : "!bg-blue-100 !text-gray-700 hover:!bg-gray-200 !border !border-gray-300"
                }`}
              >
                All
              </button>

              <button
                onClick={() => setFilterStatus("pending-approval")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  filterStatus === "pending-approval"
                    ? "!bg-yellow-500 !text-white"
                    : "!bg-yellow-50 !text-yellow-700 hover:!bg-yellow-100 !border !border-yellow-200"
                }`}
              >
                Pending
              </button>

              <button
                onClick={() => setFilterStatus("approved")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  filterStatus === "approved"
                    ? "!bg-green-600 !text-white"
                    : "!bg-green-50 !text-green-700 hover:!bg-green-100 !border !border-green-200"
                }`}
              >
                Approved
              </button>

              <button
                onClick={() => setFilterStatus("declined")}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  filterStatus === "declined"
                    ? "!bg-red-600 !text-white"
                    : "!bg-red-50 !text-red-700 hover:!bg-red-100 !border !border-red-200"
                }`}
              >
                Declined
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="!bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredDocs.length} {filterStatus === "all" ? "" : filterStatus.replace("-", " ")}{" "}
              document{filteredDocs.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type of Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc, idx) => (
                    <tr
                      key={doc.id}
                      className={`hover:bg-gray-50 transition-colors duration-200 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-25"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={async () => {
                            try {
                              // Manual entry (text-based)
                              if (doc.content) {
                                setContentModalData({
                                  title: doc.title || "No title",
                                  content: doc.content || "No content",
                                });
                                setShowContentModal(true);
                                return;
                              }

                              // Uploaded or scanned file (binary/blob)
                              const blob = await useDocumentStore.getState().previewDocument(doc.id);
                              if (!blob) {
                                toast.error("⚠️ No file found for this document.");
                                return;
                              }
                              const url = window.URL.createObjectURL(blob);
                              const newTab = window.open(url);
                              if (!newTab) toast("🔒 Popup blocked! Please allow popups for this site.");
                            } catch {
                              toast.error("❌ Failed to preview document.");
                            }
                          }}
                          className="px-3 py-2 rounded-md text-sm font-medium !bg-blue-600 !text-white hover:!bg-blue-700 transition"
                        >
                          View
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.upload_timestamp
                          ? new Date(doc.upload_timestamp).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            doc.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : doc.status === "pending-approval"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-500">
                      No {filterStatus.replace("-", " ")} documents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ModalUploadDocument
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
      <ModalManualEntry
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSave={handleManualSave}
      />
      <ContentModal
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
        title={contentModalData.title}
        content={contentModalData.content}
      />
      {showScanModal && (
        <ModalScan
          isOpen={showScanModal}
          onClose={() => setShowScanModal(false)}
          onUpload={handleScanUpload}
        />
      )}
    </div>
  );
}

export default AdminApproverUploadDocuments;
