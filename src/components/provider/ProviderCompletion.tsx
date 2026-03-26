import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Check, QrCode, DollarSign, ChevronRight } from "lucide-react";

interface ProviderCompletionProps {
  onDone: () => void;
}

const ProviderCompletion = ({ onDone }: ProviderCompletionProps) => {
  const [step, setStep] = useState<"photos" | "adjust" | "qr" | "done">("photos");
  const [photos, setPhotos] = useState<string[]>([]);
  const [adjustedPrice, setAdjustedPrice] = useState("195");

  if (step === "done") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4 py-12 text-center space-y-6 pb-24">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-success text-success-foreground rounded-full flex items-center justify-center mx-auto"
        >
          <Check className="w-10 h-10" />
        </motion.div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Payment Received!</h2>
          <p className="text-sm text-muted-foreground mt-1">${adjustedPrice} from Sarah M.</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service total</span>
            <span className="font-medium">${adjustedPrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee (12%)</span>
            <span className="font-medium">-${(parseFloat(adjustedPrice) * 0.12).toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Your earnings</span>
            <span>${(parseFloat(adjustedPrice) * 0.88).toFixed(2)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Payout will arrive within 1–2 business days</p>
        <button
          onClick={onDone}
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform"
        >
          Back to Jobs
        </button>
      </motion.div>
    );
  }

  if (step === "qr") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-8 text-center space-y-6 pb-24">
        <h2 className="font-display text-xl font-bold text-foreground">Show QR to Customer</h2>
        <p className="text-sm text-muted-foreground">Customer scans to confirm & pay</p>

        <div className="w-56 h-56 bg-foreground rounded-3xl mx-auto flex items-center justify-center">
          <div className="w-48 h-48 bg-background rounded-2xl flex items-center justify-center">
            <QrCode className="w-24 h-24 text-foreground" />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Amount</p>
          <p className="font-display text-2xl font-bold text-foreground">${adjustedPrice}</p>
          <p className="text-xs text-muted-foreground mt-1">Lawn Mowing · Sarah M.</p>
        </div>

        <button
          onClick={() => setStep("done")}
          className="w-full bg-muted text-foreground font-medium py-3 rounded-2xl text-sm"
        >
          Customer confirmed manually
        </button>
      </motion.div>
    );
  }

  if (step === "adjust") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Adjust Final Price</h2>
          <p className="text-sm text-muted-foreground">Quoted range: $185–$240</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-xs text-muted-foreground mb-2">Final amount</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-foreground">$</span>
            <input
              type="number"
              value={adjustedPrice}
              onChange={(e) => setAdjustedPrice(e.target.value)}
              className="text-3xl font-bold font-display text-foreground bg-transparent outline-none w-24 text-center"
            />
          </div>
          {parseFloat(adjustedPrice) > 240 && (
            <p className="text-xs text-accent mt-2">⚠️ Above quoted range — customer approval required</p>
          )}
          {parseFloat(adjustedPrice) <= 240 && parseFloat(adjustedPrice) >= 185 && (
            <p className="text-xs text-secondary mt-2">✓ Within quoted range — auto-approved</p>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-sm">
          <h3 className="font-semibold text-sm mb-2">Reason for adjustment</h3>
          {["Standard completion", "Larger area than estimated", "Extra complexity", "Less work than estimated"].map((reason) => (
            <button key={reason} className="w-full text-left bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors">
              {reason}
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep("qr")}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          Show QR Code <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  // Photos step
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Complete Job</h2>
        <p className="text-sm text-muted-foreground">Lawn Mowing · Sarah M. · 123 Main St</p>
      </div>

      {/* Checklist */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Completion Checklist</h3>
        {["Mowing completed", "Edges trimmed", "Clippings cleaned up", "Area inspected"].map((item, i) => (
          <label key={item} className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked={i < 2} className="w-4 h-4 rounded border-border accent-primary" />
            <span className="text-sm text-foreground">{item}</span>
          </label>
        ))}
      </div>

      {/* Photo upload */}
      <div>
        <h3 className="font-semibold text-sm text-foreground mb-2">Upload completion photos (optional)</h3>
        <div className="flex gap-2">
          <button className="w-20 h-20 bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <Camera className="w-5 h-5" />
            <span className="text-[10px]">Add</span>
          </button>
        </div>
      </div>

      <button
        onClick={() => setStep("adjust")}
        className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        Next: Adjust Price <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default ProviderCompletion;
