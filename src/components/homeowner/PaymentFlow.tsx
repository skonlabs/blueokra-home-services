import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Shield, Star } from "lucide-react";

interface PaymentFlowProps {
  onComplete: () => void;
  booking?: {
    id: string;
    service: string;
    provider: string;
    amount: number;
    quoteRange: { low: number; high: number };
    breakdown: { label: string; amount: number }[];
  };
}

const DEFAULT_BOOKING = {
  id: "bk-default",
  service: "Lawn Mowing",
  provider: "Mike's Lawn Care",
  amount: 195,
  quoteRange: { low: 185, high: 240 },
  breakdown: [
    { label: "Base mowing", amount: 120 },
    { label: "Edge trimming", amount: 35 },
    { label: "Clippings cleanup", amount: 15 },
    { label: "Complexity adjustment", amount: 25 },
  ],
};

const PaymentFlow = ({ onComplete, booking }: PaymentFlowProps) => {
  const [step, setStep] = useState<"scan" | "confirm" | "done">("scan");
  const [rating, setRating] = useState(0);

  const b = booking ?? DEFAULT_BOOKING;
  const bookingId = b.id;
  const aboveRange = b.amount > b.quoteRange.high;

  if (step === "scan") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-8 text-center space-y-6 pb-24">
        <div className="flex flex-col items-center gap-3">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=blueokra-payment-${bookingId}&bgcolor=FFFFFF`}
            className="w-48 h-48 rounded-2xl"
            alt="Payment QR code"
          />
          <p className="text-sm font-medium text-foreground">Scan provider's QR code</p>
          <p className="text-xs text-muted-foreground">Point your camera at the provider's screen</p>
        </div>

        <button
          onClick={() => setStep("confirm")}
          className="w-full bg-muted text-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform border border-border"
        >
          Skip — Confirm Manually
        </button>
      </motion.div>
    );
  }

  if (step === "confirm") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-foreground">Confirm Payment</h2>
          <p className="text-sm text-muted-foreground mt-1">Service completed by {b.provider}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Final Amount</p>
          <p className="font-display text-3xl font-bold text-foreground">${b.amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Quoted range: ${b.quoteRange.low}–${b.quoteRange.high}
          </p>
        </div>

        {aboveRange ? (
          <div className="flex items-center gap-2 bg-orange-50 rounded-xl p-3 border border-orange-200">
            <span className="text-orange-500 text-base shrink-0">⚠️</span>
            <p className="text-xs text-orange-700 font-medium">Above quoted range — requires your approval</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3 border border-green-200">
            <span className="text-green-600 text-base shrink-0">✓</span>
            <p className="text-xs text-green-700 font-medium">Within quoted range</p>
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-sm">
          {b.breakdown.map((line) => (
            <div key={line.label} className="flex justify-between">
              <span className="text-muted-foreground">{line.label}</span>
              <span className="font-medium">${line.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>${b.amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-okra-50 rounded-xl p-3 border border-okra-100">
          <Shield className="w-4 h-4 text-secondary shrink-0" />
          <p className="text-xs text-muted-foreground">Protected by BlueOkra guarantee. Dispute within 48 hours.</p>
        </div>

        {/* Quick rating */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            Rate your experience <span className="text-accent">*</span>
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className="p-1">
                <Star className={`w-8 h-8 transition-colors ${s <= rating ? "fill-warm-500 text-warm-500" : "text-muted"}`} />
              </button>
            ))}
          </div>
          {rating === 0 && (
            <p className="text-xs text-muted-foreground">Please rate before confirming</p>
          )}
        </div>

        <button
          onClick={() => setStep("done")}
          disabled={rating === 0}
          className="w-full bg-success text-success-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" /> Confirm &amp; Pay ${b.amount.toFixed(2)}
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
        <p className="text-sm text-muted-foreground mt-1">${b.amount.toFixed(2)} paid to {b.provider}</p>
      </div>
      <div className="bg-card rounded-2xl border border-border p-4 text-left space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <span className="text-foreground font-medium">Receipt saved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary">★</span>
          <span className="text-muted-foreground">Loyalty points earned: <span className="text-foreground font-semibold">+{Math.round(b.amount)} pts</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-secondary shrink-0" />
          <span className="text-muted-foreground">7-day service warranty starts now</span>
        </div>
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
