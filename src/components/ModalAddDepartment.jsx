import { useEffect, useState } from "react";
import { X, Building2, Info, Save, Loader2 } from "lucide-react";
import { useAuthStore } from "../stores/userStores";
import toast from "react-hot-toast";

export default function ModalAddDepartment({ isOpen, onClose, onSave }) {
  const [newDepartment, setNewDepartment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addDepartment = useAuthStore((state) => state.addDepartment);
  const getDepartment = useAuthStore((state) => state.getDepartment);

  // Escape key + lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow || "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDepartment.trim()) {
      toast.error("❌ Department name is required.");
      return;
    }

    try {
      setIsSaving(true);
      await addDepartment({ department_name: newDepartment });
      await getDepartment();
      onSave(newDepartment);
      setNewDepartment("");
      onClose();
    } catch (err) {
      console.error("Failed to create department:", err);
      toast.error(`❌ ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-dept-title"
      aria-describedby="add-dept-desc"
      onMouseDown={handleBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl border border-gray-200 max-h-[calc(100vh-2rem)] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-200">
              <Building2 className="h-5 w-5 text-gray-700" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 id="add-dept-title" className="text-xl font-semibold text-gray-900">
                Add Department
              </h2>
              <p
                id="add-dept-desc"
                className="mt-1 flex items-center gap-1 text-sm text-gray-600"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
                Create a new department for assigning admins.
              </p>
            </div>
            <X
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onClose();
              }}
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
            <div>
              <label
                htmlFor="dept-name"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                id="dept-name"
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="Enter department name"
                required
                disabled={isSaving}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-gray-400 focus:ring-4 focus:ring-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setNewDepartment("");
                  onClose();
                }}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl border border-gray-300 !bg-red-500 text-sm font-medium text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl !bg-green-500 text-white text-sm font-semibold shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
