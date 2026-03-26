import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Clock, ChevronRight, Info, AlertTriangle, Check, Percent } from "lucide-react";
import type { QuoteData } from "./AIIntakeChat";

interface QuoteViewProps {
  quote: QuoteData;
  onBook: () => void;
  onBack: () => void;
}

const QuoteView = ({ quote, onBook, onBack }: QuoteViewProps) => {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([quote.slots[0]]);

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const confidenceColor = quote.confidence >= 85 ? "text-secondary bg-okra-50" :
    quote.confidence >= 70 ? "text-primary bg-blue-50" : "text-accent bg-warm-50";

  const confidenceLabel = quote.confidence >= 85 ? "High Confidence" :
    quote.confidence >= 70 ? "Medium Confidence" : "Needs Assessment";

  const typeLabel = quote.type === "fixed" ? "Fixed Price" :
    quote.type === "range" ? "Price Range" :
    quote.type === "diagnostic" ? "Diagnostic + Repair" : "Inspection Required";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-5 space-y-4 pb-24"
    >
      {/* Quote type badge */}
      <div className="text-center">
        <span className="text-xs font-medium bg-muted text-muted-foreground px-3 py-1 rounded-full">
          {typeLabel}
        </span>
      </div>

      {/* Main price */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-1.5 ${confidenceColor} px-3 py-1 rounded-full text-xs font-medium mb-3`}>
          <Shield className="w-3 h-3" />
          {quote.confidence}% — {confidenceLabel}
        </div>
        <h2 className="font-display text-3xl font-bold text-foreground">
          ${quote.low}{quote.type !== "fixed" && ` – $${quote.high}`}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{quote.serviceName}</p>
      </div>

      {/* Breakdown */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
          Price Breakdown
        </h3>
        <div className="space-y-2 text-sm">
          {quote.breakdown.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-foreground font-medium">{item.amount}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Estimated total</span>
            <span>${quote.low}{quote.type !== "fixed" && `–$${quote.high}`}</span>
          </div>
        </div>
      </div>

      {/* Bundle discount hint */}
      <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
        <Percent className="w-4 h-4 text-primary shrink-0" />
        <div>
          <p className="text-xs font-medium text-foreground">Bundle & save 15%</p>
          <p className="text-[11px] text-muted-foreground">Add another service to this booking for a discount</p>
        </div>
      </div>

      {/* What could change */}
      <div className="bg-warm-50 rounded-2xl p-4 border border-warm-100">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-warm-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">What could change the price?</p>
            <ul className="mt-1 space-y-0.5">
              {quote.factors.map((f, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Scheduling */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Select Preferred Times</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {quote.slots.map((slot) => (
            <button
              key={slot}
              onClick={() => toggleSlot(slot)}
              className={`text-xs py-2 px-2 rounded-xl border transition-all flex items-center justify-center gap-1 ${
                selectedSlots.includes(slot)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50"
              }`}
            >
              {selectedSlots.includes(slot) && <Check className="w-3 h-3" />}
              {slot}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Select multiple — provider picks the best match</p>
      </div>

      {/* Pay after service badge */}
      <div className="flex items-center gap-2 bg-okra-50 rounded-xl p-3 border border-okra-100">
        <Shield className="w-5 h-5 text-secondary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Pay after service</p>
          <p className="text-[11px] text-muted-foreground">Card pre-authorized only. Charged after completion.</p>
        </div>
      </div>

      {/* Warning for low confidence */}
      {quote.confidence < 75 && (
        <div className="flex items-center gap-2 bg-warm-50 rounded-xl p-3 border border-warm-100">
          <AlertTriangle className="w-4 h-4 text-accent shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground">A diagnostic visit may be needed</p>
            <p className="text-[11px] text-muted-foreground">Final price confirmed after on-site assessment</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <button
          onClick={onBook}
          disabled={selectedSlots.length === 0}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
        >
          Book Now
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onBack}
          className="w-full text-muted-foreground text-sm py-2 hover:text-foreground transition-colors"
        >
          Modify request
        </button>
      </div>
    </motion.div>
  );
};

export default QuoteView;
