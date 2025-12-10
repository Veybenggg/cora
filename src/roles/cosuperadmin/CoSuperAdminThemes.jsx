import { useEffect, useMemo, useState } from "react";
import SidebarCoSuperAdmin from "../../components/SidebarCoSuperAdmin";
import { useAppSettingsStore } from "../../stores/useSettingsStore";
import ChangeNameModal from "../../components/ChangeNameModal";
import { ImageUp, Type, Palette, Save, RotateCcw, Menu, Loader2 } from "lucide-react";
import toast from "react-hot-toast"; // ✅ Toast import

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function CoSuperAdminThemes() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isApplying, setIsApplying] = useState(false); // ✅ For loading state

  // Settings store
  const changeLogo = useAppSettingsStore((s) => s.changeLogo);
  const logoPath = useAppSettingsStore((s) => s.logo_path);
  const changeName = useAppSettingsStore((s) => s.changeName);
  const name = useAppSettingsStore((s) => s.name);
  const primaryColor = useAppSettingsStore((s) => s.primary_color) || "#3b82f6";
  const secondaryColor = useAppSettingsStore((s) => s.secondary_color) || "#64748b";
  const changeColor = useAppSettingsStore((s) => s.changeColor);

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [selectedPrimary, setSelectedPrimary] = useState(primaryColor);
  const [selectedSecondary, setSelectedSecondary] = useState(secondaryColor);
  const [hexPrimary, setHexPrimary] = useState(primaryColor);
  const [hexSecondary, setHexSecondary] = useState(secondaryColor);

  // Responsive
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767.98px)");
    const handler = (e) => setIsMobile(e.matches);
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Disable scroll when mobile sidebar open
  useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = sidebarOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isMobile, sidebarOpen]);

  // Sidebar offset
  const sidebarOffset = useMemo(
    () => (isMobile ? "0" : sidebarOpen ? "17rem" : "5rem"),
    [isMobile, sidebarOpen]
  );

  // Hex validation
  const isValidHex = (v) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);

  // Color presets
  const presets = [
    { name: "Ocean", p: "#2563eb", s: "#0ea5e9" },
    { name: "Emerald", p: "#10b981", s: "#059669" },
    { name: "Sunset", p: "#f97316", s: "#ea580c" },
    { name: "Plum", p: "#7c3aed", s: "#a855f7" },
    { name: "Slate", p: "#0f172a", s: "#475569" },
    { name: "Rose", p: "#e11d48", s: "#fb7185" },
  ];

  // Helpers
  const applyHexPrimary = () => {
    if (isValidHex(hexPrimary)) setSelectedPrimary(hexPrimary);
  };
  const applyHexSecondary = () => {
    if (isValidHex(hexSecondary)) setSelectedSecondary(hexSecondary);
  };

  const resetToCurrent = () => {
    setSelectedPrimary(primaryColor);
    setSelectedSecondary(secondaryColor);
    setHexPrimary(primaryColor);
    setHexSecondary(secondaryColor);
    toast("🎨 Theme reset to current colors", { icon: "↩️" });
  };

  const handleApplyTheme = async () => {
    try {
      setIsApplying(true);
      await changeColor(selectedPrimary, selectedSecondary);
      toast.success("✅ Theme updated successfully!");
    } catch (error) {
      toast.error("❌ Failed to apply theme: " + error.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleLogoChange = async (file) => {
    try {
      await changeLogo(file);
      toast.success("🖼️ Logo updated successfully!");
    } catch (error) {
      toast.error("❌ Failed to update logo: " + error.message);
    }
  };

  const handleChangeName = async (newName) => {
    try {
      await changeName(newName);
      toast.success("✅ Organization name updated!");
      setIsNameModalOpen(false);
    } catch (error) {
      toast.error("❌ Failed to change name: " + error.message);
    }
  };

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
        className={[
          "fixed top-0 left-0 h-screen z-50 transition-all duration-300",
          isMobile
            ? `w-64 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
            : `${sidebarOpen ? "w-64" : "w-16"}`,
        ].join(" ")}
      >
        <SidebarCoSuperAdmin
          isOpen={sidebarOpen}
          setOpen={setSidebarOpen}
          isMobile={isMobile}
        />
      </div>

      {/* Main */}
      <main
        className="transition-all duration-300 overflow-y-auto w-full"
        style={{ marginLeft: sidebarOffset }}
      >
        {/* Header */}
        <div
          className="px-6 pt-8 pb-6"
          style={{
            background:
              "radial-gradient(1200px 300px at 10% 0%, rgba(59,130,246,0.12), transparent 60%), radial-gradient(800px 200px at 90% 0%, rgba(14,165,233,0.12), transparent 60%)",
          }}
        >
          {/* Mobile Header */}
          <div className="md:hidden flex items-center gap-3 mb-3">
            <Menu
              onClick={() => setSidebarOpen(true)}
              className="h-6 w-6 cursor-pointer"
              style={{ color: primaryColor }}
            />
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: primaryColor }}>
                Themes
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Modernize your brand: logo, name, and color system with live preview.
              </p>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: primaryColor }}>
                Themes
              </h1>
              <p className="text-gray-600">
                Modernize your brand: logo, name, and color system with live preview.
              </p>
            </div>

            {/* Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={handleApplyTheme}
                disabled={isApplying}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transform transition-all duration-200 ${
                  isApplying
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                }`}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Apply Theme
                  </>
                )}
              </button>

              <button
                onClick={resetToCurrent}
                disabled={isApplying}
                className="inline-flex items-center gap-2 border  border-gray-300 bg-white text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Logo & Name */}
            <div className="space-y-6">
              {/* Logo */}
              <div className="bg-white/80 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                  <ImageUp className="w-5 h-5 text-gray-700" />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Brand Logo</h3>
                    <p className="text-sm text-gray-500">
                      Upload a crisp, square logo for best results.
                    </p>
                  </div>
                </div>
                <div className="px-6 py-6 flex flex-col items-center gap-5">
                  <img
                    src={logoPath ? `${API_BASE_URL}${logoPath}` : "/school-logo.png"}
                    alt="Brand Logo"
                    className="w-24 h-24 object-contain rounded-xl ring-1 ring-gray-200 bg-white"
                  />
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoChange(file);
                    }}
                  />
                  <button
                    onClick={() => document.getElementById("logoUpload")?.click()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all"
                  >
                    Change Logo
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="bg-white/80 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                  <Type className="w-5 h-5 text-gray-700" />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Display Name</h3>
                    <p className="text-sm text-gray-500">Shown across admin experiences.</p>
                  </div>
                </div>
                <div className="px-6 py-6 flex flex-col items-center gap-5">
                  <div
                    className="text-2xl font-bold uppercase"
                    style={{ color: selectedPrimary }}
                  >
                    {name}
                  </div>
                  <button
                    onClick={() => setIsNameModalOpen(true)}
                    className="!bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-800 transition"
                  >
                    Change Name
                  </button>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-6">
              <div className="bg-white/80 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-gray-700" />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Theme Colors</h3>
                    <p className="text-sm text-gray-500">
                      Pick accessible, brand-consistent colors.
                    </p>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-5">
                  {/* Primary */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-semibold text-gray-700">Primary</label>
                      <p className="text-xs text-gray-500">Buttons, highlights</p>
                    </div>
                    <div className="sm:col-span-3 flex items-center gap-3">
                      <div className="relative">
                        <button
                          onClick={() =>
                            document.getElementById("primaryColorPicker")?.click()
                          }
                          className="px-4 py-2 rounded-lg text-white shadow-sm"
                          style={{ backgroundColor: selectedPrimary }}
                          type="button"
                        >
                          Pick
                        </button>
                        <input
                          id="primaryColorPicker"
                          type="color"
                          value={selectedPrimary}
                          className="absolute top-0 left-0 opacity-0 w-full h-full cursor-pointer"
                          onChange={(e) => {
                            setSelectedPrimary(e.target.value);
                            setHexPrimary(e.target.value);
                          }}
                        />
                      </div>
                      <input
                        value={hexPrimary}
                        onChange={(e) => setHexPrimary(e.target.value)}
                        onBlur={applyHexPrimary}
                        placeholder="#2563EB"
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition ${
                          isValidHex(hexPrimary)
                            ? "border-gray-300 focus:ring-4 focus:ring-gray-200"
                            : "border-red-300 ring-2 ring-red-100"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Secondary */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-semibold text-white">Secondary</label>
                      <p className="text-xs text-gray-500">Text, accents</p>
                    </div>
                    <div className="sm:col-span-3 flex items-center gap-3">
                      <div className="relative">
                        <button
                          onClick={() =>
                            document.getElementById("secondaryColorPicker")?.click()
                          }
                          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white shadow-sm"
                          type="button"
                        >
                          Pick
                        </button>
                        <input
                          id="secondaryColorPicker"
                          type="color"
                          value={selectedSecondary}
                          className="absolute top-0 left-0 opacity-0 w-full h-full cursor-pointer"
                          onChange={(e) => {
                            setSelectedSecondary(e.target.value);
                            setHexSecondary(e.target.value);
                          }}
                        />
                      </div>
                      <input
                        value={hexSecondary}
                        onChange={(e) => setHexSecondary(e.target.value)}
                        onBlur={applyHexSecondary}
                        placeholder="#64748B"
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition ${
                          isValidHex(hexSecondary)
                            ? "border-gray-300 focus:ring-4 focus:ring-gray-200"
                            : "border-red-300 ring-2 ring-red-100"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="mt-2">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Presets</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {presets.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            setSelectedPrimary(p.p);
                            setSelectedSecondary(p.s);
                            setHexPrimary(p.p);
                            setHexSecondary(p.s);
                            toast(`🎨 ${p.name} theme applied`, {
                              icon: "🌈",
                              style: {
                                fontSize: "15px",
                                borderRadius: "10px",
                                background: "#22c55e",
                              },
                            });
                          }}
                          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition p-3"
                        >
                          <span
                            className="h-6 w-6 rounded-md ring-1 ring-gray-200"
                            style={{ backgroundColor: p.p }}
                          />
                          <span
                            className="h-6 w-6 rounded-md ring-1 ring-gray-200"
                            style={{ backgroundColor: p.s }}
                          />
                          <span className="text-xs font-medium text-gray-700 ml-auto">
                            {p.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <div className="bg-white/80 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">Live Preview</h3>
                  <p className="text-sm text-gray-500">
                    See how your theme feels in UI elements.
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div
                    className="rounded-xl p-3 text-white flex items-center justify-between"
                    style={{
                      background: `linear-gradient(135deg, ${selectedPrimary}, ${selectedPrimary}cc)`,
                    }}
                  >
                    <div className="font-medium">{name || "Your Organization"}</div>
                    <div className="flex gap-2">
                      <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                        Dashboard
                      </span>
                      <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                        Settings
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-5">
                    <div
                      className="text-sm font-semibold uppercase tracking-wide mb-1"
                      style={{ color: selectedSecondary }}
                    >
                      Component
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Buttons & Tags
                    </h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="px-4 py-2 rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: selectedPrimary }}
                      >
                        Primary Action
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg border text-white"
                        style={{
                          borderColor: selectedSecondary,
                          color: selectedSecondary,
                        }}
                      >
                        Secondary
                      </button>
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${selectedPrimary}1A`,
                          color: selectedPrimary,
                          border: `1px solid ${selectedPrimary}33`,
                        }}
                      >
                        Tag
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${selectedSecondary}1A`,
                          color: selectedSecondary,
                          border: `1px solid ${selectedSecondary}33`,
                        }}
                      >
                        Accent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Name Modal */}
      <ChangeNameModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        onSave={handleChangeName}
      />
    </div>
  );
}

export default CoSuperAdminThemes;
