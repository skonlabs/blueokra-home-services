import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Shield, Star, ChevronRight, ChevronLeft, Building2, CreditCard } from "lucide-react";
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

type Step = "qr_confirm" | "method" | "entry" | "done";
type PaymentMethod = "direct_debit" | "credit_card" | null;

const inputCls = "w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/30";

const PaymentFlow = ({ onComplete, booking }: PaymentFlowProps) => {
  const [step, setStep] = useState<Step>("qr_confirm");
  const [rating, setRating] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>(null);

  // Credit card fields
  const [cardNumber,  setCardNumber]  = useState("");
  const [cardExpiry,  setCardExpiry]  = useState("");
  const [cardCvv,     setCardCvv]     = useState("");

  // Direct debit fields
  const [routingNum,  setRoutingNum]  = useState("");
  const [accountNum,  setAccountNum]  = useState("");

  const b = booking ?? DEFAULT_BOOKING;
  const bookingId = b.id;
  const aboveRange = b.amount > b.quoteRange.high;

  const creditCardFee = method === "credit_card" ? Math.round(b.amount * 0.0275 * 100) / 100 : 0;
  const finalAmount = b.amount + creditCardFee;

  // ── QR Confirm ──────────────────────────────────────────────────────────────
  if (step === "qr_confirm") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-8 text-center space-y-6 pb-24">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Service Complete?</h2>
          <p className="text-sm text-muted-foreground mt-1">Show this code to your provider to confirm</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`blueokra-confirm-${bookingId}`)}&bgcolor=FFFFFF&color=000000`}
            className="w-48 h-48 rounded-2xl border border-border"
            alt="Service confirmation QR code"
          />
          <p className="text-sm font-medium text-foreground">Provider scans to confirm completion</p>
          <p className="text-xs text-muted-foreground">Or tap below to confirm manually</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setStep("method")}
            className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            Provider confirmed — proceed to payment
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStep("method")}
            className="w-full bg-muted text-muted-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform border border-border"
          >
            Confirm manually
          </button>
        </div>

        <div className="flex items-center gap-2 bg-okra-50 rounded-xl p-3 border border-okra-100">
          <Shield className="w-4 h-4 text-secondary shrink-0" />
          <p className="text-xs text-muted-foreground">Protected by BlueOkra guarantee. Payment processed only after confirmation.</p>
        </div>
      </motion.div>
    );
  }

  // ── Payment Method Selection ─────────────────────────────────────────────────
  if (step === "method") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
        <div className="flex items-center gap-2">
          <button onClick={() => setStep("qr_confirm")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">How would you like to pay?</h2>
            <p className="text-sm text-muted-foreground">Service by {b.provider}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Amount due</p>
          <p className="font-display text-3xl font-bold text-foreground">${b.amount.toFixed(2)}</p>
          {aboveRange && (
            <p className="text-xs text-orange-600 font-medium mt-1">⚠️ Above quoted range — requires your approval</p>
          )}
        </div>

        <div className="space-y-3">

          {/* Direct Debit */}
          <button
            onClick={() => { setMethod("direct_debit"); setStep("entry"); }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Direct Debit</p>
              <p className="text-xs text-muted-foreground">Bank transfer — free, 1–2 business days</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Credit / Debit Card */}
          <button
            onClick={() => { setMethod("credit_card"); setStep("entry"); }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Credit / Debit Card</p>
              <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex — +2.75% processing fee</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
          <Shield className="w-4 h-4 text-secondary shrink-0" />
          <p className="text-xs text-muted-foreground">Payments processed securely via Stripe. Your details are never stored on our servers.</p>
        </div>
      </motion.div>
    );
  }

  // ── Payment Entry ────────────────────────────────────────────────────────────
  if (step === "entry") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-5 pb-24">
        <div className="flex items-center gap-2">
          <button onClick={() => setStep("method")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-display text-xl font-bold text-foreground">
            {method === "direct_debit" ? "Direct Debit" : "Card Payment"}
          </h2>
        </div>

        {/* Quick rating */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-center">
          <p className="text-sm font-medium text-foreground">Rate your experience first</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className="p-1">
                <Star className={`w-8 h-8 transition-colors ${s <= rating ? "fill-warm-500 text-warm-500" : "text-muted"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Amount summary */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-sm">
          {b.breakdown.map((line) => (
            <div key={line.label} className="flex justify-between">
              <span className="text-muted-foreground">{line.label}</span>
              <span className="font-medium">${line.amount.toFixed(2)}</span>
            </div>
          ))}
          {creditCardFee > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Card processing fee (2.75%)</span>
              <span className="font-medium">+${creditCardFee.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>${finalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Direct Debit */}
        {method === "direct_debit" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Routing number</label>
              <input
                className={inputCls}
                placeholder="9-digit routing number"
                value={routingNum}
                onChange={(e) => setRoutingNum(e.target.value.replace(/\D/g, "").slice(0, 9))}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Account number</label>
              <input
                className={inputCls}
                placeholder="Account number"
                value={accountNum}
                onChange={(e) => setAccountNum(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
              />
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
              <Shield className="w-4 h-4 text-secondary shrink-0" />
              <p className="text-[11px] text-muted-foreground">Bank details are encrypted and processed by Stripe. BlueOkra never stores your account information.</p>
            </div>
          </div>
        )}

        {/* Credit Card */}
        {method === "credit_card" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Card number</label>
              <input
                className={inputCls}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
                }}
                inputMode="numeric"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Expiry (MM/YY)</label>
                <input
                  className={inputCls}
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                  }}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">CVV</label>
                <input
                  className={inputCls}
                  placeholder="CVV"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-orange-50 rounded-xl p-3 border border-orange-100">
              <p className="text-[11px] text-orange-700">+2.75% processing fee applied. Total: <span className="font-bold">${finalAmount.toFixed(2)}</span></p>
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
              <Shield className="w-4 h-4 text-secondary shrink-0" />
              <p className="text-[11px] text-muted-foreground">Secured by Stripe. Your card details are encrypted and never stored.</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setStep("done")}
          disabled={rating === 0}
          className="w-full bg-success text-success-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          {method === "direct_debit" ? `Confirm & Pay $${finalAmount.toFixed(2)}` : `Confirm & Pay $${finalAmount.toFixed(2)}`}
        </button>
        {rating === 0 && (
          <p className="text-xs text-center text-muted-foreground">Please rate your experience before confirming</p>
        )}
      </motion.div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
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
        <p className="text-sm text-muted-foreground mt-1">${finalAmount.toFixed(2)} paid to {b.provider}</p>
      </div>
      <div className="bg-card rounded-2xl border border-border p-4 text-left space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
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
};

export default PaymentFlow;
