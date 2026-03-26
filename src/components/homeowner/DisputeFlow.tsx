import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, AlertTriangle, Check, ChevronRight } from "lucide-react";

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
  const [step, setStep] = useState<"select" | "detail" | "submitted">("select");
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [detail, setDetail] = useState("");

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
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Describe what happened..."
          className="w-full bg-muted rounded-2xl p-4 text-sm min-h-[120px] resize-none outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 text-sm text-muted-foreground w-full">
          <Camera className="w-4 h-4" />
          Upload photo evidence (optional)
        </button>
        <button
          onClick={() => setStep("submitted")}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          Submit Dispute <ChevronRight className="w-4 h-4" />
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
