import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Camera, X, Video } from "lucide-react";
import { getServiceById } from "./ServiceGrid";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  images?: string[];
  type?: "text" | "urgency" | "recurring" | "photos-request" | "video-consult" | "followup";
  consumed?: boolean;
}

interface AIIntakeProps {
  serviceId?: string;
  onQuoteReady: (quoteData: QuoteData) => void;
}

export interface QuoteData {
  serviceId: string;
  serviceName: string;
  type: "fixed" | "range" | "diagnostic" | "inspection";
  low: number;
  high: number;
  confidence: number;
  breakdown: { label: string; amount: string }[];
  factors: string[];
  slots: string[];
}

const getInitialMessage = (serviceId?: string): Message => {
  const service = serviceId ? getServiceById(serviceId) : null;
  return {
    id: "1",
    role: "ai",
    text: service
      ? `I'll help you with ${service.name.toLowerCase()}. Tell me about your situation — you can type, upload photos, or both.`
      : "What do you need help with today? Describe the issue and I'll find the right service for you.",
  };
};

const AIIntakeChat = ({ serviceId: initialServiceId, onQuoteReady }: AIIntakeProps) => {
  const [messages, setMessages] = useState<Message[]>([getInitialMessage(initialServiceId)]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const addUserMessage = (text: string, imgs?: string[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        text,
        images: imgs && imgs.length > 0 ? imgs : undefined,
      },
    ]);
  };

  const callChatAI = async (userText: string, hadImages: boolean) => {
    const contextSuffix = hadImages ? " [User has shared photos]" : "";
    const fullContent = (userText || "(no text, photos shared)") + contextSuffix;

    const updatedHistory: { role: "user" | "assistant"; content: string }[] = [
      ...conversationHistory,
      { role: "user", content: fullContent },
    ];
    setConversationHistory(updatedHistory);
    setIsTyping(true);
    scrollToBottom();

    try {
      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: {
          messages: updatedHistory,
          serviceId: initialServiceId ?? undefined,
          hasImages: hadImages,
        },
      });

      if (error) throw error;

      const { reply, quoteData, uiHint } = data as {
        reply: string;
        quoteData?: QuoteData;
        uiHint?: "urgency" | "recurring";
      };

      setConversationHistory((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);

      const msgType =
        uiHint === "urgency" ? "urgency" :
        uiHint === "recurring" ? "recurring" :
        undefined;

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: reply,
          type: msgType,
        },
      ]);
      scrollToBottom();

      if (quoteData) {
        setTimeout(() => onQuoteReady(quoteData), 1200);
      }
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: "I'm having trouble connecting right now. Please try again.",
        },
      ]);
      scrollToBottom();
    }
  };

  const sendMessage = () => {
    if (!input.trim() && images.length === 0) return;

    const sentText = input.trim();
    const sentImages = [...images];
    addUserMessage(sentText, sentImages);
    setInput("");
    setImages([]);
    callChatAI(sentText, sentImages.length > 0);
  };

  const handleUrgencySelect = (msgId: string, value: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, consumed: true } : m)),
    );
    const labels: Record<string, string> = {
      emergency: "Emergency (same day)",
      soon: "This week",
      flexible: "Flexible (anytime)",
    };
    const labelText = labels[value] ?? value;
    addUserMessage(labelText);
    callChatAI(labelText, false);
  };

  const handleRecurringSelect = (msgId: string, value: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, consumed: true } : m)),
    );
    const labels: Record<string, string> = {
      "one-time": "One-time",
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly",
      seasonal: "Seasonal / quarterly",
    };
    const labelText = labels[value] ?? value;
    addUserMessage(labelText);
    callChatAI(labelText, false);
  };

  const handleVideoConsult = () => {
    addUserMessage("I'd like a video consultation");
    callChatAI("I'd like a video consultation instead of uploading photos", false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setImages((prev) => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[85%] space-y-2">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.images && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {msg.images.map((img, i) => (
                        <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                  {/* Render **bold** markdown inline */}
                  {msg.text.includes("**") ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: msg.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                      }}
                    />
                  ) : (
                    msg.text
                  )}
                </div>

                {/* Urgency options */}
                {msg.type === "urgency" && msg.role === "ai" && !msg.consumed && (
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "🚨 Emergency (same day)", value: "emergency" },
                      { label: "⏰ This week", value: "soon" },
                      { label: "📅 Flexible (anytime)", value: "flexible" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleUrgencySelect(msg.id, opt.value)}
                        className="bg-card border border-border rounded-full px-3 py-1.5 text-xs font-medium text-foreground active:scale-[0.97] transition-transform hover:border-primary/50"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Recurring options */}
                {msg.type === "recurring" && msg.role === "ai" && !msg.consumed && (
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "One-time", value: "one-time" },
                      { label: "Weekly", value: "weekly" },
                      { label: "Bi-weekly", value: "biweekly" },
                      { label: "Monthly", value: "monthly" },
                      { label: "Seasonal", value: "seasonal" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleRecurringSelect(msg.id, opt.value)}
                        className="bg-card border border-border rounded-full px-3 py-1.5 text-xs font-medium text-foreground active:scale-[0.97] transition-transform hover:border-primary/50"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Photo request options */}
                {msg.type === "photos-request" && msg.role === "ai" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 text-xs font-medium active:scale-[0.97] transition-transform flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" /> Upload Photo
                    </button>
                    <button
                      onClick={handleVideoConsult}
                      className="bg-card border border-border rounded-full px-3 py-1.5 text-xs font-medium text-foreground active:scale-[0.97] transition-transform flex items-center gap-1"
                    >
                      <Video className="w-3 h-3" /> Video Consult
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse-soft" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse-soft" style={{ animationDelay: "200ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse-soft" style={{ animationDelay: "400ms" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="px-4 pb-2 flex gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} alt="" className="w-14 h-14 rounded-lg object-cover border border-border" />
              <button
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
          <div className="flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Describe your issue..."
              className="w-full bg-muted rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() && images.length === 0}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIIntakeChat;
