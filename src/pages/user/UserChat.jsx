// src/pages/user/UserChat.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { Mic, Image as ImageIcon, Menu, Loader2 } from "lucide-react";
import SidebarUser from "../../components/SidebarUser";
import { useAuthStore } from "../../stores/userStores";
import { useAppSettingsStore } from "../../stores/useSettingsStore";
import {
  generateAnswer,
  createConversation,
  fetchConversationById,
  addMessage,
} from "../../api/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";

export default function UserChat() {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  const name = useAppSettingsStore((state) => state.name);
  const primaryColor = useAppSettingsStore((state) => state.primary_color);
  const currentUser = useAuthStore((s) => s.currentUser);

  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const messageId = Date.now();
  const [isSpeaking, setIsSpeaking] = useState(false);
  


  // === Responsive: track mobile breakpoint (md < 768px) ===
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767.98px)");
    const handler = (e) => setIsMobile(e.matches);
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Tiny helpers for tints/opacity based on hex strings
  const tint20 = useMemo(
    () => (primaryColor?.startsWith?.("#") ? `${primaryColor}20` : primaryColor),
    [primaryColor]
  );
  const tint15 = useMemo(
    () => (primaryColor?.startsWith?.("#") ? `${primaryColor}15` : primaryColor),
    [primaryColor]
  );

  // Keep content offset in sync with SidebarUser width
  // Desktop: 17rem/5rem; Mobile: overlay -> 0 offset
  const sidebarOffset = useMemo(
    () => (isMobile ? "0" : sidebarOpen ? "17rem" : "5rem"),
    [isMobile, sidebarOpen]
  );

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = sidebarOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isMobile, sidebarOpen]);

  // --- Text to Speech (TTS) ---
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

  // --- Web Speech API ---
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => {
        setListening(false);
        if (query.trim()) handleSubmit(new Event("submit"));
      };
      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setQuery(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, [query]);

  const handleMicClick = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setVoiceMode(true);
    }
  };

  // --- Paste Handler ---
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

  // --- Submit ---
  const handleSubmit = async (e) => {
  e.preventDefault();
  const trimmed = query.trim();
  if ((!trimmed && selectedImages.length === 0) || isTyping) return;

  let convId = currentConversationId;
  if (!convId) {
    try {
      const newConv = await createConversation(trimmed?.slice(0, 50) || "New Chat");
      convId = newConv.id;
      setCurrentConversationId(convId);
      setSidebarRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to create conversation:", err);
      toast.error("Unable to create a conversation.");
      return;
    }
  }

  const userMsgId = Date.now();
  appendMessage({
    id: userMsgId,
    role: "user",
    text: trimmed,
    images: selectedImages.map((file) => URL.createObjectURL(file)),
  });

  const assistantMsgId = userMsgId + 1;
  setChatHistory((prev) => [...prev, { id: assistantMsgId, role: "assistant", text: "" }]);

  setQuery("");
  setSelectedImages([]);
  setSubmitted(true);

  let streamedAnswer = "";

  try {
    setIsTyping(true);

    // --- Store user message in backend ---
    await addMessage(convId, { role: "user", content: trimmed });

    // --- Stream assistant answer ---
    await generateAnswer(
      trimmed,
      (chunk) => {
        streamedAnswer += chunk;
        setChatHistory((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1 && msg.role === "assistant"
              ? { ...msg, text: streamedAnswer }
              : msg
          )
        );
      },
      selectedImages || []
    );

    // --- ✅ Store assistant message in backend ---
    if (streamedAnswer.trim()) {
      await addMessage(convId, { role: "assistant", content: streamedAnswer });
    }

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
      { role: "assistant", text: "Sorry, something went wrong while generating a response." },
    ]);
    console.error("Streaming error:", err);
    toast.error("Something went wrong while generating a response.");
  } finally {
    setIsTyping(false);
  }
};

  // --- Helpers ---
  const appendMessage = (msg) => setChatHistory((prev) => [...prev, msg]);

  const handleNewChat = async () => {
    setQuery("");
    setChatHistory([]);
    setSubmitted(false);
    setIsTyping(false);
    setSelectedImages([]);
    setCurrentConversationId(null);
    inputRef.current?.focus();
  };

  const handleSelectChat = async (convId) => {
  setQuery("");
  setSubmitted(true);
  setIsTyping(false);
  setSelectedImages([]);
  setCurrentConversationId(convId);

  try {
    const convData = await fetchConversationById(convId);

    if (convData.messages && convData.messages.length > 0) {
      const messages = convData.messages.map((msg) => ({
        id: msg.id,             // Use backend id for uniqueness
        role: msg.role,
        text: msg.content,
        images: msg.images || [], // optional if backend returns images
      }));
      setChatHistory(messages);
    } else {
      setChatHistory([]);
    }
  } catch (error) {
    console.error("Failed to load conversation:", error);
    setChatHistory([
      { id: Date.now(), role: "assistant", text: "Sorry, failed to load this conversation." },
    ]);
  }
};

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages((prev) => [...prev, ...files]);
  };

  const removeImage = (idx) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") setQuery("");
  };

  // --- Scroll & Focus ---
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory, isTyping]);

  // --- UI ---
  return (
    <div className="flex h-screen w-screen bg-white text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <SidebarUser
        isOpen={sidebarOpen}
        setOpen={setSidebarOpen}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentConversationId={currentConversationId}
        sidebarRefreshKey={sidebarRefreshKey}
        isMobile={isMobile}
      />

      {/* Desktop fixed logo (hidden on mobile) */}
      <div
        className="hidden md:block fixed top-4 z-50 transition-all duration-300 font-bold text-xl select-none"
        style={{
          left: sidebarOffset,
          pointerEvents: "none",
          color: primaryColor,
        }}
      >
        {name.toUpperCase()}
      </div>

      {/* Content wrapper shifts with sidebar (0 on mobile) */}
      <div
        className="flex-1 flex flex-col"
        style={{
          marginLeft: sidebarOffset,
          transition: "margin-left 300ms ease",
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          {/* Mobile: burger + logo inline */}
          <div className="md:hidden flex items-center gap-3">
            <Menu
              onClick={() => setSidebarOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="Open menu"
              className="h-5 w-5 cursor-pointer"
              style={{ color: primaryColor }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSidebarOpen(true);
              }}
              aria-pressed={sidebarOpen}
            />
            <span
              className="font-bold text-lg select-none"
              style={{ color: primaryColor }}
            >
              {name.toUpperCase()}
            </span>
          </div>

          {currentUser && (
            <div className="flex items-center gap-3 ml-auto md:ml-0">
              <div className="text-right leading-tight">
                <div className="text-sm font-semibold" style={{ color: primaryColor }}>
                  {currentUser.name || currentUser.email || "User"}
                </div>
                {currentUser.email && (
                  <div className="text-xs" style={{ color: primaryColor, opacity: 0.7 }}>
                    {currentUser.email}
                  </div>
                )}
              </div>
              <div
                className="h-8 w-8 rounded-full text-white flex items-center justify-center text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {(currentUser.name || currentUser.email || "U").charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </header>

        {/* Chat Area */}
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
                    {chat.images?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {chat.images.map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt="uploaded"
                            className="w-24 h-24 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input Box */}
<form
  onSubmit={handleSubmit}
  className="
    sticky bottom-0    /* stay visible above content */
    w-full
    px-3 md:px-4 py-2
    bg-white/80 backdrop-blur
  "
  style={{
    borderColor: primaryColor,
    // iOS/Android safe area: keeps the composer above home indicator
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)",
  }}
>
  <div
    className="
      mx-auto
      w-full
      max-w-full
      sm:max-w-xl
      md:max-w-2xl
      lg:max-w-2xl
      rounded-xl
      bg-gray-100
      border
      flex flex-col gap-2
      p-2 md:p-3
    "
    style={{ borderColor: primaryColor, color: primaryColor }}
  >
    {/* Image Preview (wraps on small screens, scrolls if many) */}
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
              className="absolute -top-2 -right-2 rounded-full flex items-center justify-center w-5 h-5 md:w-4 md:h-4 text-white text-xs"
              style={{ backgroundColor: primaryColor }}
              aria-label="Remove image"
              title="Remove image"
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
        className="
          shrink-0
          rounded-lg
          p-2 md:p-2
          bg-gray-100 hover:bg-gray-200
          transition
        "
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = tint20)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
        role="button"
        tabIndex={0}
        aria-label="Attach images"
        title="Attach images"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
      >
        <ImageIcon
          size={20}
          className="md:h-[18px] md:w-[18px]"
          style={{ color: primaryColor }}
        />
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        hidden
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Text input: grows, wraps long text nicely */}
      <input
        ref={inputRef}
        className="
          min-w-0 flex-grow
          bg-transparent outline-none disabled:opacity-60
          text-sm md:text-base
          placeholder:text-xs md:placeholder:text-sm
          py-2
        "
        placeholder="Ask Cora"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
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
        onMouseEnter={(e) => {
          if (!listening) e.currentTarget.style.backgroundColor = tint20;
        }}
        onMouseLeave={(e) => {
          if (!listening) e.currentTarget.style.backgroundColor = "#f3f4f6";
        }}
        onClick={handleMicClick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleMicClick()}
        role="button"
        tabIndex={0}
        aria-pressed={listening}
        aria-label="Voice input"
        title="Voice input"
      >
        <Mic
          size={20}
          className="md:h-[18px] md:w-[18px]"
          style={{ color: listening ? undefined : primaryColor }}
        />
      </div>

      {/* Submit (icon-only on mobile, keep form submit behavior) */}
<button
  type="submit"
  className="
    hidden sm:inline-flex
    items-center justify-center
    rounded-full
    px-5 py-2
    text-sm font-medium
    text-white
    transition
    gap-2
  "
  style={{ backgroundColor: primaryColor }}
  disabled={isTyping || (!query.trim() && selectedImages.length === 0)}
>
  {isTyping ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      Sending...
    </>
  ) : (
    "Send"
  )}
</button>
    </div>
  </div>
</form>
      </div>
    </div>
  );
}
