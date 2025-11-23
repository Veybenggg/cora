import { useEffect, useRef, useState } from "react";
import ModalManageDocumentType from "./ModalManageDocumentType";
import { fetchDocumentInfo,deleteDocInfo} from "../api/api";
import { FileUp, Info, Tag, X, Loader2, ChevronDown, Trash2 } from "lucide-react";
import { useDocumentStore } from "../stores/useDocumentStore";
import toast from "react-hot-toast";

export default function ModalUploadDocument({ isOpen, onClose, onUpload }) {
  const [typeOfInfo, setTypeOfInfo] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [files, setFiles] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const { refreshTrigger } = useDocumentStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addPdfFiles = (fileList) => {
    if (!fileList) return;
    const arr = Array.from(fileList).filter((f) => f.type === "application/pdf");
    if (arr.length === 0) return;
    setFiles((prev) => [...prev, ...arr]);
  };

  const handleFileInputChange = (e) => {
    addPdfFiles(e.target.files);
    if (e.target) e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addPdfFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectType = (typeId) => {
    setTypeOfInfo(typeId);
    setIsDropdownOpen(false);
  };

  const handleDeleteType = async (e, typeId) => {
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this document type?")) {
      try {
        await deleteDocInfo(typeId)
        setDocumentTypes((prev) => prev.filter((t) => t.id !== typeId));
        if (typeOfInfo === typeId) setTypeOfInfo("");
        alert("Deleted Successfully")
      } catch (err) {
        console.error("Failed to delete document type:", err);
        alert(err.message)
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!typeOfInfo || files.length === 0 || keywords.length === 0) {
      setShowError(true);
      return;
    }
    const formData = new FormData();
    formData.append("title_id", typeOfInfo);
    formData.append("keywords", keywords.join(","));
    formData.append("file", files[0]);
    try {
      setIsSubmitting(true);
      await onUpload(formData);
      onClose();
      setTypeOfInfo("");
      setKeywords([]);
      setFiles([]);
      setShowError(false);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const res = await fetchDocumentInfo();
          setDocumentTypes(res || []);
        } catch (err) {
          console.error("Failed to fetch document types:", err);
        }
      })();
    }
  }, [isOpen, refreshTrigger]);

  if (!isOpen) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const selectedType = documentTypes.find((t) => t.id === typeOfInfo);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        aria-describedby="upload-desc"
        onMouseDown={handleBackdrop}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        <div
          className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl border border-gray-200 max-h-[calc(100vh-2rem)] overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-200">
                <FileUp className="h-5 w-5 text-gray-700" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 id="upload-title" className="text-xl font-semibold text-gray-900">
                  Upload PDF Document
                </h2>
                <p id="upload-desc" className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                  <Info className="h-4 w-4" aria-hidden="true" />
                  Only PDF files are supported.
                </p>
              </div>
              <X
                onClick={onClose}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClose(); }}
                role="button"
                tabIndex={0}
                aria-label="Close dialog"
                className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
                title="Close"
              />
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type of Information - Custom Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Type of Information <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-full" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className=" w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl text-gray-900 !bg-white shadow-sm outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-200"
                    >
                      <span className={selectedType ? "text-gray-900" : "text-gray-500"}>
                        {selectedType ? selectedType.name : "Select type"}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                        {documentTypes.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">No types available</div>
                        ) : (
                          documentTypes.map((type) => (
                            <div
                              key={type.id}
                              className={`flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer group ${
                                typeOfInfo === type.id ? "bg-gray-100" : ""
                              }`}
                              onClick={() => handleSelectType(type.id)}
                            >
                              <span className="text-sm text-gray-900">{type.name}</span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteType(e, type.id)}
                                className="p-1 rounded-lg !bg-white text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete type"
                                aria-label={`Delete ${type.name}`}
                              >
                                X
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTypeModal(true)}
                    className="flex items-center justify-center w-10 h-10 text-lg font-bold !bg-white border !border-gray-300 rounded-xl text-gray-700 hover:!bg-gray-100 transition"
                    title="Manage Types"
                    aria-label="Manage Types"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Keywords <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="keywords"
                    type="text"
                    className={`w-full pl-9 pr-3 py-3 border rounded-xl text-gray-900 placeholder-gray-400 shadow-sm outline-none transition ${
                      showError && keywords.length === 0
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-gray-400 focus:ring-4 focus:ring-gray-200"
                    }`}
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && keywordInput.trim()) {
                        e.preventDefault();
                        const val = keywordInput.trim();
                        if (!keywords.includes(val)) setKeywords([...keywords, val]);
                        setKeywordInput("");
                        setShowError(false);
                      }
                    }}
                    placeholder="Press Enter to add keyword"
                  />
                </div>
                {showError && keywords.length === 0 && (
                  <p className="mt-1 text-sm text-red-500">Please add at least one keyword.</p>
                )}
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {tag}
                        <span
                          onClick={() => setKeywords(keywords.filter((_, i) => i !== idx))}
                          role="button"
                          tabIndex={0}
                          className="text-gray-500 hover:text-red-500 cursor-pointer select-none"
                        >
                          ×
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Choose PDF File <span className="text-red-500">*</span>
                </label>
                <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileInputChange} />
                <div
                  onClick={() => inputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
                  className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50 transition p-6 text-center cursor-pointer"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileUp className="w-8 h-8 text-gray-500" />
                    <p className="text-gray-700 font-medium">Click to choose a PDF</p>
                    <p className="text-xs text-gray-500">or drag & drop here</p>
                    <p className="text-[11px] text-gray-400 mt-1">Only .pdf files are accepted</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex justify-between items-center px-3 py-2 border border-gray-300 rounded-xl">
                      <span className="truncate text-sm text-gray-800">{file.name}</span>
                      <X
                        onClick={() => handleRemoveFile(index)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Remove ${file.name}`}
                        title="Remove"
                        className="h-4 w-4 text-gray-500 cursor-pointer hover:text-red-600"
                      />
                    </li>
                  ))}
                </ul>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-white !bg-red-500 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl !bg-green-500 text-white text-sm font-semibold shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    "Proceed"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ModalManageDocumentType isOpen={showTypeModal} onClose={() => setShowTypeModal(false)} />
    </>
  );
}