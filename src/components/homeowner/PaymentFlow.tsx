import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Shield, Star, ChevronRight, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  service: "Lawn Care",
  provider: "Mike's Lawn Care",
  amount: 195,
  quoteRange: { low: 185, high: 240 },
  breakdown: [
    { label: "Base mowing", amount: 120 },
    { label: "Edge trimming", amount: 35 },
    { label: "Clippings cleanup", amount: 15 },
    { label: "Weed surcharge", amount: 25 },
  ],
};

type Step = "review" | "paying" | "done";

const PaymentFlow = ({ onComplete, booking }: PaymentFlowProps) => {
  const [step, setStep] = useState<Step>("review");
  const [rating, setRating] = useState(0);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const b = booking ?? DEFAULT_BOOKING;
  const aboveRange = b.amount > b.quoteRange.high;

  const handleStripeCheckout = async () => {
    setPayLoading(true);
    setPayError(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          amount: b.amount,
          service_id: b.id,
          description: `${b.service} — ${b.provider}`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        // After redirect, show done state
        setStep("done");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setPayError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setPayLoading(false);
    }
  };

  if (step === "done") {
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
          <h2 className="font-display text-2xl font-bold text-foreground">Payment Submitted!</h2>
          <p className="text-sm text-muted-foreground mt-1">${b.amount.toFixed(2)} for {b.provider}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-left space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-secondary">✓</span>
            <span className="text-foreground font-medium">Receipt saved</span>
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
  }

  // ── Review & Pay ────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Review & Pay</h2>
        <p className="text-sm text-muted-foreground">Service by {b.provider}</p>
      </div>

      {/* Amount summary */}
      <div className="bg-card rounded-2xl border border-border p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Amount due</p>
        <p className="font-display text-3xl font-bold text-foreground">${b.amount.toFixed(2)}</p>
        {aboveRange && (
          <p className="text-xs text-destructive font-medium mt-1">⚠️ Above quoted range — requires your approval</p>
        )}
      </div>

      {/* Breakdown */}
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

      {/* Quick rating */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-center">
        <p className="text-sm font-medium text-foreground">Rate your experience</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} className="p-1">
              <Star className={`w-8 h-8 transition-colors ${s <= rating ? "fill-primary text-primary" : "text-muted"}`} />
            </button>
          ))}
        </div>
      </div>

      {payError && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-3 text-xs">
          {payError}
        </div>
      )}

      {/* Pay with Stripe button */}
      <button
        onClick={handleStripeCheckout}
        disabled={rating === 0 || payLoading}
        className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {payLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4" />
        )}
        {payLoading ? "Opening Stripe..." : `Pay $${b.amount.toFixed(2)} with Stripe`}
        {!payLoading && <ChevronRight className="w-4 h-4" />}
      </button>
      {rating === 0 && (
        <p className="text-xs text-center text-muted-foreground">Please rate your experience before paying</p>
      )}

      <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
        <Shield className="w-4 h-4 text-secondary shrink-0" />
        <p className="text-xs text-muted-foreground">Payments processed securely via Stripe. Accepts cards, bank transfers, and more.</p>
      </div>
    </motion.div>
  );
};

export default PaymentFlow;
