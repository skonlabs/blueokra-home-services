import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Camera, Mic, Image as ImageIcon, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  images?: string[];
}

interface AIIntakeProps {
  serviceId?: string;
  onQuoteReady: () => void;
}

const aiResponses: Record<string, string[]> = {
  default: [
    "Got it! Can you tell me roughly how large the area is?",
    "Thanks! Is this urgent, or can it wait a few days?",
    "Perfect. Let me generate a quote for you...",
  ],
};

const AIIntakeChat = ({ serviceId, onQuoteReady }: AIIntakeProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      text: serviceId
        ? `Tell me about your ${serviceId} needs. You can describe the problem, upload photos, or both.`
        : "What do you need help with? Describe the issue or upload a photo.",
    },
  ]);
  const [input, setInput] = useState("");
  const [aiStep, setAiStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = () => {
    if (!input.trim() && images.length === 0) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      images: images.length > 0 ? [...images] : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setImages([]);

    const responses = aiResponses.default;
    setTimeout(() => {
      if (aiStep < responses.length - 1) {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "ai", text: responses[aiStep] },
        ]);
        setAiStep((s) => s + 1);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "ai", text: "Your quote is ready! 🎉" },
        ]);
        setTimeout(onQuoteReady, 800);
      }
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 1000);
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
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {msg.images && (
                  <div className="flex gap-2 mb-2">
                    {msg.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                {msg.text}
              </div>
            </motion.div>
          ))}
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
          <div className="flex gap-1">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
          </div>
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Describe your issue..."
              className="w-full bg-muted rounded-full px-4 py-2.5 text-sm pr-10 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>
          <button
            onClick={sendMessage}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIIntakeChat;
