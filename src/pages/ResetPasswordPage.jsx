import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { changePassword,requestPasswordOtp } from "../api/api";
import { Save } from "lucide-react";


export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  // Step 1: Password form
  const handlePasswordSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");

  if (!password || !confirmPassword) {
    setError("Please fill in both fields.");
    return;
  }
  if (password !== confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  try {
    // 🔑 Call backend to send OTP to email
    await requestPasswordOtp(token, password);

    // Then show OTP modal
    setShowOtpModal(true);
  } catch (err) {
    setError(err.message || "Failed to send OTP.");
  }
};

  // Step 2: OTP submission
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await changePassword({ token, password, otp });
      setMessage(res.message);
      setShowOtpModal(false);
      setPassword("");
      setConfirmPassword("");
      setOtp("");
    } catch (err) {
      setError(err.message || "Invalid OTP or token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-100">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-lg mx-4 sm:mx-0">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Reset Your Password
        </h2>

        {message && <p className="text-green-600 mb-4 text-center">{message}</p>}
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

        {!message && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-200"
                placeholder="Enter new password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-200"
                placeholder="Confirm new password"
                required
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700"
              >
                <Save className="h-4 w-4" />
                Continue
              </button>
            </div>
          </form>
        )}
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-lg">
            <h3 className="text-lg font-semibold mb-4 !text-gray-800">
              Enter OTP
            </h3>
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter 6-digit OTP"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Submit OTP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
