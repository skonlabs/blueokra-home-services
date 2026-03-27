import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Camera, X } from "lucide-react";
import { getServiceById } from "./ServiceGrid";
import { supabase } from "@/integrations/supabase/client";
import ServiceIntakeForm from "./ServiceIntakeForm";
import { calculateQuote, type IntakeFormData } from "@/lib/quoteCalculator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  images?: string[];
  isForm?: boolean;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SERVICE_NAMES: Record<string, string> = {
  lawn: "Lawn & Garden",
  house_cleaning: "House Cleaning",
  gutter: "Gutter Cleaning",
  roof: "Roof Cleaning",
  pressure: "Pressure Washing",
  electrical: "Electrical",
  duct: "Duct Cleaning",
  backwater: "Backwater Testing",
  fence: "Fence Installation",
};

function getIntroMessage(serviceId: string): string {
  const name = SERVICE_NAMES[serviceId] ?? serviceId;
  return `Got it — **${name}**! Fill in the details below and I'll calculate your quote instantly. No back-and-forth needed.`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Phase = "describe" | "form" | "done";

const AIIntakeChat = ({ serviceId: initialServiceId, onQuoteReady }: AIIntakeProps) => {
  const resolvedService = initialServiceId ? getServiceById(initialServiceId) : null;

  const [phase, setPhase] = useState<Phase>(initialServiceId ? "form" : "describe");
  const [detectedServiceId, setDetectedServiceId] = useState<string | null>(initialServiceId ?? null);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialServiceId) {
      return [
        {
          id: "1",
          role: "ai",
          text: getIntroMessage(initialServiceId),
          isForm: true,
        },
      ];
    }
    return [
      {
        id: "1",
        role: "ai",
        text: "What do you need help with today? Describe it briefly — or just tell me the service.",
      },
    ];
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const addAIMessage = (text: string, opts: Partial<Message> = {}, delay = 600) => {
    setIsTyping(true);
    scrollToBottom();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "ai", text, ...opts },
        ]);
        scrollToBottom();
        resolve();
      }, delay);
    });
  };

  const addUserMessage = (text: string, imgs?: string[]) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text, images: imgs?.length ? imgs : undefined },
    ]);
  };

  // Single AI call — only for free-text service detection
  const detectService = async (userText: string, hadImages: boolean) => {
    setIsTyping(true);
    scrollToBottom();

    try {
      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: { message: userText, hasImages: hadImages },
      });

      if (error) throw error;

      const { serviceId, reply } = data as { serviceId: string; reply: string };
      const sid = serviceId ?? "lawn";
      setDetectedServiceId(sid);
      setIsTyping(false);

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "ai", text: reply },
      ]);
      scrollToBottom();

      // Brief pause then show the form
      await addAIMessage(getIntroMessage(sid), { isForm: true }, 700);
      setPhase("form");
    } catch {
      setIsTyping(false);
      await addAIMessage("I couldn't connect right now. Please try again.", {}, 200);
    }
  };

  const sendMessage = () => {
    if (phase !== "describe") return;
    if (!input.trim() && images.length === 0) return;

    const sentText = input.trim();
    const sentImages = [...images];
    addUserMessage(sentText || "(photos shared)", sentImages);
    setInput("");
    setImages([]);
    detectService(sentText, sentImages.length > 0);
  };

  const handleFormSubmit = (formData: IntakeFormData) => {
    const quote = calculateQuote(formData);
    setPhase("done");
    addAIMessage("Your quote is ready!", {}, 300).then(() => {
      setTimeout(() => onQuoteReady(quote), 600);
    });
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
              <div className="max-w-[92%] space-y-2 w-full">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md inline-block max-w-[85%] ml-auto"
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

                {/* Inline form rendered below the AI intro message */}
                {msg.isForm && msg.role === "ai" && phase === "form" && (
                  <ServiceIntakeForm
                    serviceId={detectedServiceId ?? "lawn"}
                    onSubmit={handleFormSubmit}
                  />
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

      {/* Input bar — only shown during describe phase */}
      {phase === "describe" && (
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
                placeholder="Describe what you need…"
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
      )}
    </div>
  );
};

export default AIIntakeChat;
