import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Camera, X, Video } from "lucide-react";
import { getServiceById } from "./ServiceGrid";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  images?: string[];
  options?: { label: string; value: string }[];
  type?: "text" | "urgency" | "recurring" | "photos-request" | "video-consult" | "followup";
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

const serviceNames: Record<string, string> = {
  lawn: "Lawn & Garden",
  hvac: "HVAC",
  plumbing: "Plumbing",
  pressure: "Pressure Washing",
  roof: "Roof Cleaning",
  electrical: "Electrical",
  handyman: "Handyman",
};

const detectServiceFromText = (text: string): string | null => {
  const lower = text.toLowerCase();
  if (/lawn|grass|mow|yard/.test(lower)) return "lawn";
  if (/hvac|ac\b|heat|furnace|cool/.test(lower)) return "hvac";
  if (/plumb|pipe|leak|drain|toilet/.test(lower)) return "plumbing";
  if (/pressure|wash|driveway|patio/.test(lower)) return "pressure";
  if (/roof|moss|gutter|shingle/.test(lower)) return "roof";
  if (/electric|outlet|breaker|wiring/.test(lower)) return "electrical";
  if (/fix|repair|install|build|handyman/.test(lower)) return "handyman";
  return null;
};

const photoObservations: Record<string, string> = {
  lawn: "I can see the lawn area clearly. The grass appears overgrown in sections with some uneven edges along the borders.",
  hvac: "I can see the HVAC unit. There's visible dust buildup on the coils and the filter housing looks like it needs attention.",
  plumbing: "I can see the affected area. There are signs of moisture and potential pipe corrosion that will need assessment.",
  pressure: "I can see the surface clearly. There's significant buildup of grime, algae staining, and weathering across the area.",
  roof: "I can see the roof surface. There's notable moss growth concentrated near the ridge and debris accumulation in the valleys.",
  electrical: "I can see the panel/outlet area. There are signs of wear and the wiring configuration will need a closer look by a technician.",
  handyman: "I can see the area that needs work. The scope looks manageable and I can get a good estimate from what's visible.",
};

const followUpQuestions: Record<string, string> = {
  lawn: "Is this the front yard, backyard, or both? And approximately how large is the lawn?",
  hvac: "Is this for heating, cooling, or both? And what's the make/model of your system if you know it?",
  plumbing: "Where is the issue located — kitchen, bathroom, basement, or outside?",
  pressure: "What surfaces need washing? (driveway, patio, siding, deck)",
  roof: "Have you noticed any active leaks inside? And roughly how old is your roof?",
  electrical: "Is this an emergency situation (no power, sparks, burning smell)? Or a non-urgent issue?",
  handyman: "How many tasks need to be done, and what's the top priority item?",
};

const quoteReasonByService: Record<string, string> = {
  lawn: "yard size and grass condition vary until we're on-site",
  hvac: "parts and labor depend on what the diagnostic uncovers",
  plumbing: "pipe accessibility and materials won't be fully known until we open things up",
  pressure: "surface area and stain severity are assessed on arrival",
  roof: "pitch, moss coverage, and access complexity affect the final price",
  electrical: "the full scope of work can only be determined after a diagnostic",
  handyman: "materials and task complexity may vary from the initial description",
};

const getInitialMessage = (serviceId?: string): Message => {
  const service = serviceId ? getServiceById(serviceId) : null;
  return {
    id: "1", role: "ai",
    text: service
      ? `I'll help you with ${service.name.toLowerCase()}. Tell me about the issue — you can type, upload photos, or both.`
      : "What do you need help with? Describe the issue and I'll identify the right service for you.",
  };
};

// Steps:
// 0 = initial description (text or photos)
// 1 = photos request (if no photos at step 0)
// 2 = follow-up question (service-specific)
// 3 = urgency
// 4 = recurring

const AIIntakeChat = ({ serviceId: initialServiceId, onQuoteReady }: AIIntakeProps) => {
  const [messages, setMessages] = useState<Message[]>([getInitialMessage(initialServiceId)]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [resolvedServiceId, setResolvedServiceId] = useState<string | null>(initialServiceId ?? null);
  const [urgencySelected, setUrgencySelected] = useState(false);
  const [recurringSelected, setRecurringSelected] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const addAIMessage = (
    text: string,
    extra?: Partial<Message>,
    delay: number = 800 + Math.random() * 600,
  ) => {
    setIsTyping(true);
    scrollToBottom();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "ai", text, ...extra },
        ]);
        scrollToBottom();
        resolve();
      }, delay);
    });
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

  const sendMessage = () => {
    if (!input.trim() && images.length === 0) return;

    const sentImages = [...images];
    const sentText = input;
    addUserMessage(sentText, sentImages);
    setInput("");
    setImages([]);

    const currentStep = step;
    setStep((s) => s + 1);

    // Step 0: initial description
    if (currentStep === 0) {
      let sid = resolvedServiceId;

      // Detect service from text if not provided
      if (!sid && sentText) {
        const detected = detectServiceFromText(sentText);
        if (detected) {
          sid = detected;
          setResolvedServiceId(detected);
          const name = serviceNames[detected];
          // Show detection message, then continue
          addAIMessage(
            `I can help with that! Let me connect you with a ${name} specialist.`,
            undefined,
            900,
          ).then(() => {
            if (sentImages.length > 0) {
              addAIMessage(
                `${photoObservations[sid!]} Let me ask a few more questions.`,
                undefined,
                1200,
              ).then(() => {
                setStep(3);
                addAIMessage(followUpQuestions[sid!], { type: "followup" }, 1000);
              });
            } else {
              addAIMessage(
                "Can you upload a photo of the area? It helps me give a more accurate quote.",
                { type: "photos-request" },
                1100,
              );
            }
          });
          return;
        }
      }

      if (sentImages.length > 0) {
        const obs = photoObservations[sid ?? "handyman"];
        addAIMessage(
          `${obs} Let me ask a few more questions.`,
          undefined,
          1400,
        ).then(() => {
          setStep(3);
          addAIMessage(followUpQuestions[sid ?? "handyman"], { type: "followup" }, 1000);
        });
      } else {
        // No photos — ask for them
        addAIMessage(
          "Can you upload a photo of the area? It helps me give a more accurate quote.",
          { type: "photos-request" },
        );
      }
      return;
    }

    // Step 1: user responded after photo request (may or may not have sent photos)
    if (currentStep === 1) {
      const sid = resolvedServiceId ?? "handyman";
      if (sentImages.length > 0) {
        const obs = photoObservations[sid];
        addAIMessage(
          `${obs} Let me ask a couple more questions.`,
          undefined,
          1400,
        ).then(() => {
          setStep(3);
          addAIMessage(followUpQuestions[sid], { type: "followup" }, 1000);
        });
      } else {
        // User skipped photos — move to follow-up question
        setStep(3);
        addAIMessage(followUpQuestions[sid], { type: "followup" });
      }
      return;
    }

    // Step 2: follow-up answer — ask urgency
    if (currentStep === 2 || currentStep === 3) {
      addAIMessage("How urgent is this?", { type: "urgency" });
      setStep(4);
      return;
    }
  };

  const handleUrgencySelect = (value: string) => {
    if (urgencySelected) return;
    setUrgencySelected(true);
    setUrgency(value);
    const labels: Record<string, string> = {
      emergency: "Emergency (same day)",
      soon: "This week",
      flexible: "Flexible (anytime)",
    };
    addUserMessage(labels[value] ?? value);
    addAIMessage("Would you like this as a one-time or recurring service?", { type: "recurring" });
  };

  const handleRecurringSelect = (value: string) => {
    if (recurringSelected) return;
    setRecurringSelected(true);

    const labels: Record<string, string> = {
      "one-time": "One-time",
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly",
      seasonal: "Seasonal",
    };
    addUserMessage(labels[value] ?? value);

    const sid = resolvedServiceId ?? "lawn";
    const quote = serviceQuotes[sid] ?? serviceQuotes.lawn;
    const reason = quoteReasonByService[sid] ?? "scope varies until on-site";

    const summaryText =
      quote.type === "diagnostic"
        ? `Your ${serviceNames[sid] ?? "service"} issue needs a diagnostic visit first. The **$${quote.low}** diagnostic fee applies, which goes toward the repair cost. I'm **${quote.confidence}%** confident in this estimate.`
        : `Based on your photos and description, I estimate **$${quote.low}–$${quote.high}** for this job. This is a price range because ${reason}. The provider will confirm the exact price on-site. I'm **${quote.confidence}%** confident in this estimate.`;

    setIsTyping(true);
    scrollToBottom();
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "ai", text: summaryText },
      ]);
      scrollToBottom();
      setTimeout(() => onQuoteReady(quote), 1500);
    }, 1400);
  };

  const handleVideoConsult = () => {
    addUserMessage("I'd like a video consultation");
    addAIMessage(
      "Video consultations are available for $25 (credited toward service). I'm connecting you with an available specialist...",
      undefined,
      800,
    ).then(() => {
      // Show typing for ~2s to simulate "connecting"
      setIsTyping(true);
      scrollToBottom();
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "ai",
            text: "Actually, let me give you an estimate first based on what you've described. If you still need a visual inspection afterward, we can schedule a video call.",
          },
        ]);
        scrollToBottom();
        // Continue the flow — ask follow-up question
        const sid = resolvedServiceId ?? "handyman";
        setTimeout(() => {
          setStep(4);
          addAIMessage(followUpQuestions[sid], { type: "followup" }, 900);
        }, 600);
      }, 2000);
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
    // Reset input so the same file can be re-selected
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
                {msg.type === "urgency" && msg.role === "ai" && !urgencySelected && (
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "🚨 Emergency (same day)", value: "emergency" },
                      { label: "⏰ This week", value: "soon" },
                      { label: "📅 Flexible (anytime)", value: "flexible" },
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
                {msg.type === "recurring" && msg.role === "ai" && !recurringSelected && (
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
                        onClick={() => handleRecurringSelect(opt.value)}
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
