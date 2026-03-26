import { useState } from "react";
import { motion } from "framer-motion";
import { Check, DollarSign, Shield, Star } from "lucide-react";

interface PaymentFlowProps {
  onComplete: () => void;
}

const PaymentFlow = ({ onComplete }: PaymentFlowProps) => {
  const [step, setStep] = useState<"scan" | "confirm" | "done">("scan");
  const [rating, setRating] = useState(0);

  if (step === "scan") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-8 text-center space-y-6 pb-24">
        <div className="w-48 h-48 bg-muted rounded-3xl mx-auto flex items-center justify-center border-2 border-dashed border-border">
          <div className="text-center">
            <div className="text-4xl mb-2">📱</div>
            <p className="text-sm text-muted-foreground">Scan provider's QR code</p>
            <p className="text-xs text-muted-foreground mt-1">or tap below to confirm manually</p>
          </div>
        </div>

        <button
          onClick={() => setStep("confirm")}
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform"
        >
          Confirm Manually
        </button>
      </motion.div>
    );
  }

  if (step === "confirm") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-foreground">Confirm Payment</h2>
          <p className="text-sm text-muted-foreground mt-1">Service completed by Mike's Lawn Care</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Final Amount</p>
          <p className="font-display text-3xl font-bold text-foreground">$195</p>
          <p className="text-xs text-muted-foreground mt-1">Within quoted range ($185–$240)</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base mowing</span>
            <span className="font-medium">$120</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Edge trimming</span>
            <span className="font-medium">$35</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Clippings cleanup</span>
            <span className="font-medium">$15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Complexity adjustment</span>
            <span className="font-medium">$25</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>$195</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-okra-50 rounded-xl p-3 border border-okra-100">
          <Shield className="w-4 h-4 text-secondary shrink-0" />
          <p className="text-xs text-muted-foreground">Protected by BlueOkra guarantee. Dispute within 48 hours.</p>
        </div>

        {/* Quick rating */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">Rate your experience</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className="p-1">
                <Star className={`w-8 h-8 transition-colors ${s <= rating ? "fill-warm-500 text-warm-500" : "text-muted"}`} />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setStep("done")}
          className="w-full bg-success text-success-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" /> Confirm & Pay $195
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4 py-12 text-center space-y-6 pb-24">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-success text-success-foreground rounded-full flex items-center justify-center mx-auto"
      >
        <Check className="w-10 h-10" />
      </motion.div>
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Payment Complete!</h2>
        <p className="text-sm text-muted-foreground mt-1">$195 paid to Mike's Lawn Care</p>
      </div>
      <div className="bg-card rounded-2xl border border-border p-4 text-left space-y-2 text-sm">
        <p className="text-muted-foreground">Receipt saved to your account</p>
        <p className="text-muted-foreground">Service warranty: 7 days</p>
        <p className="text-muted-foreground">Loyalty points: +195 pts earned</p>
      </div>
      <button
        onClick={onComplete}
        className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform"
      >
        Done
      </button>
    </motion.div>
  );
};

export default PaymentFlow;
