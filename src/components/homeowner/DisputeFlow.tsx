import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, AlertTriangle, Check, ChevronRight, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DisputeFlowProps {
  onComplete: () => void;
}

const issues = [
  "Service not completed",
  "Quality not satisfactory",
  "Wrong service performed",
  "Provider didn't show up",
  "Damage to property",
  "Overcharged",
  "Other issue",
];

const DisputeFlow = ({ onComplete }: DisputeFlowProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"select" | "detail" | "submitted">("select");
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [caseRef] = useState(() =>
    Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(36).padStart(2, "0"))
      .join("")
      .slice(0, 6)
      .toUpperCase()
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) setPhotos((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const isDetailValid = detail.trim().length >= 10;

  const handleSubmitDispute = async () => {
    if (!isDetailValid) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const { error } = await supabase.from("admin_support_ticket").insert({
        subject: selectedIssue ?? "Dispute",
        content: detail.trim(),
        sender_email: user?.email ?? null,
        ticket_status: "open",
      });
      if (error) throw error;
      setStep("submitted");
    } catch (err) {
      const pgErr = err as { message?: string };
      setSubmitError(pgErr?.message ?? "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "submitted") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4 py-12 text-center space-y-6 pb-24">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto"
        >
          <Check className="w-8 h-8" />
        </motion.div>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Dispute Submitted</h2>
          <p className="text-sm text-muted-foreground mt-1">We'll review within 24 hours and get back to you</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Case reference</span>
            <span className="font-mono font-semibold text-foreground">#{caseRef}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Issue type</span>
            <span className="font-medium text-foreground text-right max-w-[60%]">{selectedIssue}</span>
          </div>
        </div>
        <div className="bg-muted rounded-2xl p-4 text-left text-xs text-muted-foreground space-y-1">
          <p>• AI is reviewing your case now</p>
          <p>• Most disputes resolve within 24 hours</p>
          <p>• You'll receive a notification with the outcome</p>
          <p>• Refund processed within 3–5 business days if approved</p>
        </div>
        <button onClick={onComplete} className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform">
          Done
        </button>
      </motion.div>
    );
  }

  if (step === "detail") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Tell us more</h2>
          <p className="text-sm text-muted-foreground mt-1">Issue: {selectedIssue}</p>
        </div>

        <div className="space-y-1">
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Describe what happened..."
            className="w-full bg-muted rounded-2xl p-4 text-sm min-h-[120px] resize-none outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className={`text-xs px-1 ${isDetailValid ? "text-muted-foreground" : "text-accent"}`}>
            {isDetailValid ? `${detail.trim().length} characters` : "Minimum 10 characters"}
          </p>
        </div>

        {/* Photo upload */}
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            hidden
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 text-sm text-muted-foreground w-full hover:bg-muted/80 transition-colors active:scale-[0.99]"
          >
            <Camera className="w-4 h-4" />
            Upload photo evidence (optional)
          </button>

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                  <img src={src} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-foreground/70 text-background rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {submitError && <p className="text-xs text-destructive">{submitError}</p>}
        <button
          onClick={handleSubmitDispute}
          disabled={!isDetailValid || submitting}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit Dispute <ChevronRight className="w-4 h-4" /></>}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-warm-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Report an Issue</h2>
          <p className="text-sm text-muted-foreground">Select the issue type below</p>
        </div>
      </div>
      <div className="space-y-2">
        {issues.map((issue) => (
          <button
            key={issue}
            onClick={() => { setSelectedIssue(issue); setStep("detail"); }}
            className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-3.5 text-sm text-foreground text-left active:scale-[0.99] transition-transform hover:border-primary/30"
          >
            {issue}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default DisputeFlow;
