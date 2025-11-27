// src/pages/LandingPage.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { Mic, Image as ImageIcon, Menu, Loader2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuthStore } from "../stores/userStores";
import { useAppSettingsStore } from "../stores/useSettingsStore";
import { useNavigate } from "react-router-dom";
import UserForgotPasswordModal from "../components/UserForgotPasswordModal";
import LoginModal from "../components/auth/LoginModal";
import { RegisterModal } from "../components/auth/RegisterModal";
import { generateAnswer } from "../api/api";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [modal, setModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const closeModal = () => setModal(null);
  const [activeMessageId, setActiveMessageId] = useState(null);

  const signup = useAuthStore((state) => state.signup);
  const signin = useAuthStore((state) => state.signin);
  const error = useAuthStore((state) => state.error);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const getSettings = useAppSettingsStore((state) => state.getSettings);
  const appendMessage = (msg) => setChatHistory((prev) => [...prev, msg]);

  const name = useAppSettingsStore((state) => state.name);
  const primaryColor = useAppSettingsStore((state) => state.primary_color);

  const navigate = useNavigate();

  const messageId = Date.now();
  // === Responsive: track mobile breakpoint ===
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767.98px)");
    const handler = (e) => setIsMobile(e.matches);
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Prevent background scroll on mobile when sidebar open
  useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = sidebarOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isMobile, sidebarOpen]);

  // Speech recognition setup
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery((prev) => prev + " " + transcript);
    };

    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  const sidebarOffset = useMemo(
    () => (isMobile ? "0" : sidebarOpen ? "17rem" : "5rem"),
    [isMobile, sidebarOpen]
  );

  const speak = (text, messageId) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    setIsSpeaking(true);
    setActiveMessageId(messageId);

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveMessageId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const tint20 = useMemo(
    () => (primaryColor?.startsWith?.("#") ? `${primaryColor}20` : primaryColor),
    [primaryColor]
  );
  const tint15 = useMemo(
    () => (primaryColor?.startsWith?.("#") ? `${primaryColor}15` : primaryColor),
    [primaryColor]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if ((!trimmed && selectedImages.length === 0) || isTyping) return;

    appendMessage({
      id: messageId,
      role: "user",
      text: trimmed,
      images: selectedImages.map((file) => URL.createObjectURL(file)),
    });

    setChatHistory((prev) => [
      ...prev,
      { id: messageId + 1, role: "assistant", text: "" },
    ]);

    setQuery("");
    setSelectedImages([]);
    setSubmitted(true);

    let streamedAnswer = "";

    try {
      setIsTyping(true);

      await generateAnswer(
        trimmed,

        (chunk) => {
          streamedAnswer += chunk;
          setChatHistory((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "assistant") last.text = streamedAnswer;
            return [...updated.slice(0, -1), last];
          });
        },
        selectedImages || []
      );

      if (voiceMode && streamedAnswer.trim()) {
        const assistantId = Date.now();
        setChatHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].id = assistantId;
          return updated;
        });
        speak(streamedAnswer, assistantId);
        setVoiceMode(false);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          text: "Sorry, something went wrong while generating a response.",
        },
      ]);
      console.error("Streaming error:", err);
      toast.error("Something went wrong while generating a response.");
    } finally {
      setIsTyping(false);
    }
  };

  const removeImage = (idx) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    const files = [];
    for (let item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      setSelectedImages((prev) => [...prev, ...files]);
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setVoiceMode(true);
    }
  };

  const handleNewChat = async () => {
    setQuery("");
    setChatHistory([]);
    setSubmitted(false);
    setIsTyping(false);
    setSelectedImages([]);
    inputRef.current?.focus();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages((prev) => [...prev, ...files]);
  };

  // === LOGIN ===
  const handleLogin = async (e) => {
    e.preventDefault();
    const userData = {
      name: firstName + " " + lastName,
      email,
      password,
    };

    try {
      setIsSubmitting(true);
      const login = await signin(userData);
      if (!login) {
        toast.error("Invalid credentials");
        return;
      }
      toast.success("Login successfully");
      switch (login.user.role) {
        case "user":
          navigate("/user/chat");
          break;
        default:
          toast.error("Unauthorized role or unknown user.");
      }
    } catch (error) {
      toast.error("Login failed, please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // === REGISTER ===
  const handleRegister = async (e) => {
    e.preventDefault();
    const userData = {
      name: `${firstName} ${lastName} ${middleInitial}`,
      email,
      password,
    };

    try {
      setIsRegistering(true);
      const response = await signup(userData);

      toast.success("Account created successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Registration error:", err);

      // err.message contains your Pydantic validation message
      toast.error(err.message || "Something went wrong, please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    const el = document.getElementById("chat-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatHistory]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        await getSettings();
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-white text-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-white text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} onNewChat={handleNewChat} isMobile={isMobile} />

      {/* Header */}
      
      <div
        className="hidden md:block fixed top-4 z-50 font-bold text-xl select-none transition-all duration-300"
        style={{ left: sidebarOffset, color: primaryColor }}
      >
        {name.toUpperCase()}
      </div>
      
      <div className="flex-1 relative flex flex-col" style={{ marginLeft: sidebarOffset, transition: "margin-left 300ms ease" }}>
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4">
          <div className="md:hidden flex items-center gap-3">
            <Menu
              onClick={() => setSidebarOpen(true)}
              className="h-5 w-5 cursor-pointer"
              style={{ color: primaryColor }}
            />
            <span className="font-bold text-lg select-none" style={{ color: primaryColor }}>
              {name.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-4 ml-auto">
            <button
              style={{ backgroundColor: primaryColor }}
              className="px-3 md:px-4 py-1 text-xs md:text-sm text-white rounded-full flex items-center justify-center gap-2"
              onClick={() => setModal("login")}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
            </button>
            <button
              className="px-3 md:px-4 py-1 text-xs md:text-sm rounded-full border flex items-center justify-center gap-2"
              style={{ borderColor: primaryColor, color: primaryColor, backgroundColor: "#fff" }}
              onClick={() => setModal("register")}
              disabled={isRegistering}
            >
              {isRegistering ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign up"}
            </button>
          </div>
        </header>

        {/* Chat */}
        <div ref={scrollRef} id="chat-scroll" className="flex-grow overflow-y-auto px-4 py-6">
          {!submitted && chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: primaryColor }}>
                Hello!
              </h1>
              <p className="text-sm mb-6" style={{ color: primaryColor }}>
                What can I help you with?
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-2xl mx-auto">
              {chatHistory.map((chat, idx) => {
                const isCoraTyping = chat.role === "assistant" && isTyping && chat.text === "";
                const isUser = chat.role === "user";
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm ${isCoraTyping ? "animate-pulse" : ""}`}
                    style={
                      isUser
                        ? { backgroundColor: "#f3f4f6", color: "#1f2937" }
                        : { backgroundColor: tint15, color: primaryColor }
                    }
                  >
                    <span className="font-semibold">{isUser ? "You" : "CORA"}:</span>{" "}
                    
                    {/* Display images if they exist */}
                    {chat.images && chat.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 my-2">
                        {chat.images.map((imgUrl, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={imgUrl}
                            alt={`uploaded-${imgIdx}`}
                            className="max-w-xs w-full sm:w-48 h-auto object-cover rounded-lg border"
                            style={{ borderColor: primaryColor }}
                          />
                        ))}
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap break-words">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {chat.text?.trim() || "Cora is generating"}
                      </ReactMarkdown>
                    </div>
                    
                    {!isUser && isSpeaking && activeMessageId === chat.id && (
                      <div className="mt-2 flex justify-start">
                        <button
                          onClick={() => {
                            window.speechSynthesis.cancel();
                            setIsSpeaking(false);
                            setActiveMessageId(null);
                            toast("Cora stopped talking.");
                          }}
                          className="p-2 rounded-full border hover:bg-gray-100 transition flex items-center justify-center"
                          style={{
                            borderColor: primaryColor,
                            color: primaryColor,
                            backgroundColor: "#fff",
                          }}
                          title="Stop Cora's voice"
                        >
                          🔇
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="sticky bottom-0 w-full px-3 md:px-4 py-2 bg-white/80 backdrop-blur">
          <div
            className="mx-auto w-full sm:max-w-xl md:max-w-2xl rounded-xl bg-gray-100 border flex flex-col gap-2 p-2 md:p-3"
            style={{ borderColor: primaryColor }}
          >
            {/* Image Preview */}
            {selectedImages.length > 0 && (
              <div className="flex flex-row flex-wrap gap-2 overflow-x-auto">
                {selectedImages.map((file, idx) => (
                  <div key={idx} className="relative shrink-0">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 rounded-full flex items-center justify-center w-5 h-5 text-white text-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-center gap-2">
              {/* Attach */}
              <div
                className="shrink-0 rounded-lg p-2 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={20} style={{ color: primaryColor }} />
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                ref={fileInputRef}
                onChange={(e) => setSelectedImages([...selectedImages, ...e.target.files])}
              />
              <input
                ref={inputRef}
                className="flex-grow bg-transparent outline-none text-sm md:text-base py-2"
                placeholder="Ask Cora"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onPaste={handlePaste}
                disabled={isTyping}
                style={{ color: primaryColor }}
              />
              {/* Mic */}
              <div
                className="shrink-0 rounded-lg p-2 bg-gray-100 transition cursor-pointer"
                style={{
                  backgroundColor: listening ? "#fee2e2" : "#f3f4f6",
                  color: listening ? "#dc2626" : undefined,
                }}
                onClick={handleMicClick}
              >
                <Mic size={20} style={{ color: listening ? undefined : primaryColor }} />
              </div>
              <button
                type="submit"
                disabled={isTyping || (!query.trim() && selectedImages.length === 0)}
                className="inline-flex items-center justify-center rounded-full 
                          px-3 py-2 text-white transition
                          sm:px-5 sm:py-2
                          text-sm sm:text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {/* Mobile icon */}
                <span className="sm:hidden flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12l12-8-4 8 4 8-12-8z"
                    />
                  </svg>
                </span>

                {/* Desktop text */}
                <span className="hidden sm:flex items-center gap-2">
                  {isTyping ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send"
                  )}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={modal === "login"}
        onClose={() => setModal(null)}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSubmit={handleLogin}
        onForgotPassword={() => setModal("user-forgot-password")}
        primaryColor={primaryColor}
      />

      <RegisterModal
        isOpen={modal === "register"}
        onClose={() => setModal(null)}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        middleInitial={middleInitial}
        setMiddleInitial={setMiddleInitial}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        onSubmit={handleRegister}
        primaryColor={primaryColor}
      />

      {modal === "user-forgot-password" && (
        <UserForgotPasswordModal onClose={() => setModal("login")} primaryColor={primaryColor} />
      )}
    </div>
  );
}