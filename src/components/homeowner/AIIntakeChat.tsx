import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Camera, X, Video, AlertTriangle, RotateCcw, Calendar as CalIcon } from "lucide-react";
import { getServiceById } from "./ServiceGrid";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  images?: string[];
  options?: { label: string; value: string }[];
  type?: "text" | "urgency" | "recurring" | "photos-request" | "video-consult";
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

const serviceQuotes: Record<string, QuoteData> = {
  lawn: {
    serviceId: "lawn", serviceName: "Lawn Mowing + Edge Trimming",
    type: "range", low: 185, high: 240, confidence: 92,
    breakdown: [
      { label: "Base mowing", amount: "$120" },
      { label: "Edge trimming", amount: "$35" },
      { label: "Clippings cleanup", amount: "$15" },
      { label: "Complexity factor", amount: "$15–$70" },
    ],
    factors: ["Actual yard size", "Grass height", "Obstacles & slope", "Wet conditions"],
    slots: ["Today 2pm", "Tomorrow 9am", "Tomorrow 1pm", "Sat 10am", "Sat 2pm", "Sun 11am"],
  },
  hvac: {
    serviceId: "hvac", serviceName: "HVAC Diagnostic & Tune-up",
    type: "diagnostic", low: 89, high: 150, confidence: 78,
    breakdown: [
      { label: "Diagnostic fee", amount: "$89" },
      { label: "Tune-up (if needed)", amount: "$60–$120" },
      { label: "Parts", amount: "TBD" },
    ],
    factors: ["System age & condition", "Required parts", "Refrigerant levels", "Ductwork issues"],
    slots: ["Tomorrow 10am", "Tomorrow 2pm", "Wed 9am", "Thu 11am"],
  },
  plumbing: {
    serviceId: "plumbing", serviceName: "Plumbing Repair",
    type: "range", low: 150, high: 350, confidence: 75,
    breakdown: [
      { label: "Service call", amount: "$75" },
      { label: "Labor (1–2 hrs)", amount: "$75–$150" },
      { label: "Materials", amount: "Varies" },
    ],
    factors: ["Pipe accessibility", "Parts needed", "Code requirements", "Water damage extent"],
    slots: ["Today 4pm", "Tomorrow 8am", "Tomorrow 11am", "Wed 9am"],
  },
  pressure: {
    serviceId: "pressure", serviceName: "Pressure Washing",
    type: "range", low: 200, high: 450, confidence: 85,
    breakdown: [
      { label: "Base service", amount: "$150" },
      { label: "Area size factor", amount: "$50–$200" },
      { label: "Stain treatment", amount: "$0–$100" },
    ],
    factors: ["Surface area", "Stain severity", "Surface material", "Water access"],
    slots: ["Sat 9am", "Sat 1pm", "Sun 10am", "Mon 9am"],
  },
  roof: {
    serviceId: "roof", serviceName: "Roof Cleaning & Moss Treatment",
    type: "range", low: 350, high: 600, confidence: 80,
    breakdown: [
      { label: "Moss treatment", amount: "$200–$300" },
      { label: "Debris removal", amount: "$100–$150" },
      { label: "Gutter cleaning", amount: "$50–$100" },
      { label: "Safety equipment", amount: "Included" },
    ],
    factors: ["Roof size & pitch", "Moss severity", "Roof material", "Access difficulty"],
    slots: ["Mon 8am", "Tue 8am", "Wed 8am", "Thu 8am"],
  },
  electrical: {
    serviceId: "electrical", serviceName: "Electrical Service",
    type: "diagnostic", low: 95, high: 300, confidence: 70,
    breakdown: [
      { label: "Diagnostic/call fee", amount: "$95" },
      { label: "Labor", amount: "$75–$150/hr" },
      { label: "Materials", amount: "Varies" },
    ],
    factors: ["Issue complexity", "Panel condition", "Code compliance", "Permit requirements"],
    slots: ["Tomorrow 10am", "Wed 1pm", "Thu 9am", "Fri 10am"],
  },
  handyman: {
    serviceId: "handyman", serviceName: "Handyman Service",
    type: "range", low: 100, high: 250, confidence: 82,
    breakdown: [
      { label: "Minimum service", amount: "$75" },
      { label: "Labor (hourly)", amount: "$55–$75/hr" },
      { label: "Materials", amount: "Varies" },
    ],
    factors: ["Task complexity", "Materials needed", "Number of tasks", "Access issues"],
    slots: ["Today 3pm", "Tomorrow 9am", "Tomorrow 2pm", "Sat 10am"],
  },
};

const getAIFlow = (serviceId?: string): Message[] => {
  const service = serviceId ? getServiceById(serviceId) : null;
  return [
    {
      id: "1", role: "ai",
      text: service
        ? `I'll help you with ${service.name.toLowerCase()}. Tell me about the issue — you can type, upload photos, or both. 📸`
        : "What do you need help with? Describe the issue and I'll identify the right service for you.",
    },
  ];
};

const AIIntakeChat = ({ serviceId, onQuoteReady }: AIIntakeProps) => {
  const [messages, setMessages] = useState<Message[]>(getAIFlow(serviceId));
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const addAIMessage = (text: string, extra?: Partial<Message>) => {
    setIsTyping(true);
    scrollToBottom();
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "ai", text, ...extra }]);
      scrollToBottom();
    }, 800 + Math.random() * 600);
  };

  const sendMessage = () => {
    if (!input.trim() && images.length === 0) return;
    const userMsg: Message = {
      id: Date.now().toString(), role: "user", text: input,
      images: images.length > 0 ? [...images] : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setImages([]);

    const currentStep = step;
    setStep((s) => s + 1);

    if (currentStep === 0) {
      if (images.length > 0) {
        addAIMessage("Great photos! I can see the area clearly. 📐 I'm analyzing the size and condition...");
        setTimeout(() => {
          addAIMessage("Got it! How urgent is this?", { type: "urgency" });
        }, 2000);
        setStep(2);
      } else {
        addAIMessage("Thanks! Can you upload a photo of the area? It helps me give a more accurate quote. 📸", { type: "photos-request" });
      }
    } else if (currentStep === 1) {
      addAIMessage("How urgent is this?", { type: "urgency" });
    }
  };

  const handleUrgencySelect = (value: string) => {
    setUrgency(value);
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text: `Urgency: ${value}` }]);
    addAIMessage("Would you like this as a one-time service or recurring?", { type: "recurring" });
  };

  const handleRecurringSelect = (value: string) => {
    setIsRecurring(value === "recurring");
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text: value === "recurring" ? "Recurring" : "One-time" }]);

    setIsTyping(true);
    scrollToBottom();
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(), role: "ai",
        text: "✨ Analyzing your request... I've estimated the scope, checked provider availability, and calculated pricing. Your quote is ready!"
      }]);
      scrollToBottom();
      const sid = serviceId || "lawn";
      setTimeout(() => onQuoteReady(serviceQuotes[sid] || serviceQuotes.lawn), 1200);
    }, 1500);
  };

  const handleVideoConsult = () => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", text: "I'd like a video consultation" }]);
    addAIMessage("Great choice! A video consultation costs $25 and will be credited toward your service. I'll connect you with an available provider. 📹");
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
                  {msg.text}
                </div>

                {/* Urgency options */}
                {msg.type === "urgency" && msg.role === "ai" && !urgency && (
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "🚨 Emergency", value: "emergency" },
                      { label: "⏰ This week", value: "soon" },
                      { label: "📅 Flexible", value: "flexible" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleUrgencySelect(opt.value)}
                        className="bg-card border border-border rounded-full px-3 py-1.5 text-xs font-medium text-foreground active:scale-[0.97] transition-transform hover:border-primary/50"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Recurring options */}
                {msg.type === "recurring" && msg.role === "ai" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRecurringSelect("one-time")}
                      className="bg-card border border-border rounded-full px-3 py-1.5 text-xs font-medium text-foreground active:scale-[0.97] transition-transform hover:border-primary/50"
                    >
                      One-time
                    </button>
                    <button
                      onClick={() => handleRecurringSelect("recurring")}
                      className="bg-card border border-border rounded-full px-3 py-1.5 text-xs font-medium text-foreground active:scale-[0.97] transition-transform hover:border-primary/50"
                    >
                      🔄 Recurring
                    </button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
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
