import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Image as ImageIcon, X, Loader2, AlertTriangle } from "lucide-react";
import { useChatMessages, useSendMessage, useUploadChatImage, type ChatMessage } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ChatThreadProps {
  otherUserId: string;
  otherUserName: string;
  onBack: () => void;
}

function formatMsgTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday " + format(d, "h:mm a");
    return format(d, "MMM d, h:mm a");
  } catch {
    return "";
  }
}

const ChatThread = ({ otherUserId, otherUserName, onBack }: ChatThreadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: messages, isLoading } = useChatMessages(otherUserId);
  const { sendMessage, sending } = useSendMessage();
  const uploadImage = useUploadChatImage();

  const [text, setText] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!text.trim() && !previewImage) || sending) return;

    let imageUrl: string | null = null;

    // Upload preview image if there is one attached
    if (previewImage && previewImage.startsWith("data:")) {
      setUploading(true);
      try {
        const blob = await fetch(previewImage).then((r) => r.blob());
        const file = new File([blob], `chat-${Date.now()}.jpg`, { type: blob.type });
        imageUrl = await uploadImage(file);
      } catch {
        toast({ title: "Failed to upload image", variant: "destructive" });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const result = await sendMessage(otherUserId, text.trim(), imageUrl);

    if (result.blocked) {
      toast({ title: "Account Locked", description: result.warning, variant: "destructive" });
      return;
    }

    if (result.warning) {
      setWarning(result.warning);
      setTimeout(() => setWarning(null), 8000);
    }

    setText("");
    setPreviewImage(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

   return (
    <div className="flex flex-col h-full pb-20" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary">
            {otherUserName?.[0]?.toUpperCase() || "?"}
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground truncate">{otherUserName}</p>
      </div>

      {/* Warning banner */}
      {warning && (
        <div className="mx-4 mt-2 bg-warm-50 border border-warm-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warm-500 shrink-0 mt-0.5" />
          <p className="text-xs text-warm-600">{warning}</p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {messages?.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 space-y-1 ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {msg.image_url && (
                  <button onClick={() => setFullscreenImage(msg.image_url)} className="block">
                    <img
                      src={msg.image_url}
                      alt="Shared image"
                      className="w-full max-w-[200px] rounded-lg object-cover"
                      loading="lazy"
                    />
                  </button>
                )}
                {msg.message && (
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                )}
                <p
                  className={`text-[10px] ${
                    isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                  }`}
                >
                  {formatMsgTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image preview */}
      {previewImage && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border">
          <div className="relative inline-block">
            <img src={previewImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-foreground/70 text-background rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input - fixed above bottom nav */}
      <div className="fixed bottom-[72px] left-0 right-0 max-w-md mx-auto px-4 py-3 border-t border-border bg-card flex items-end gap-2 z-50">
        <input type="file" accept="image/*" ref={fileRef} hidden onChange={handleFileSelect} />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full bg-muted rounded-2xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-24"
            style={{ minHeight: 40 }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !previewImage) || sending || uploading}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground disabled:opacity-40 active:scale-95 transition-transform"
        >
          {sending || uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Fullscreen image viewer */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            className="absolute top-12 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            onClick={() => setFullscreenImage(null)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={fullscreenImage}
            alt="Full size"
            className="max-w-full max-h-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ChatThread;
