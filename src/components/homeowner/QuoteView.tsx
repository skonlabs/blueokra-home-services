import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Clock, ChevronRight, ChevronLeft, Info, AlertTriangle, Check } from "lucide-react";
import type { QuoteData } from "./AIIntakeChat";

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuoteViewProps {
  quote: QuoteData;
  onBook: () => void;
  onBack: () => void;
}

const QuoteView = ({ quote, onBook, onBack }: QuoteViewProps) => {
  const [calMonth, setCalMonth] = useState<Date>(() =>
    quote.slots[0] ? new Date(quote.slots[0] + "T12:00:00") : new Date()
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const confidenceColor = quote.confidence >= 85 ? "text-secondary bg-okra-50" :
    quote.confidence >= 70 ? "text-primary bg-blue-50" : "text-accent bg-warm-50";

  const confidenceLabel = quote.confidence >= 85 ? "High Confidence" :
    quote.confidence >= 70 ? "Medium Confidence" : "Needs Assessment";

  // Calendar variables
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month); // 0 = Sunday
  const availableSet = new Set(quote.slots);

  // Monday-first offset: Sun=0→6, Mon=0, Tue=1, ..., Sat=6→5
  const offset = (firstDay + 6) % 7;
  const calCells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  const pad = (n: number) => String(n).padStart(2, "0");
  const firstOfMonth = `${year}-${pad(month + 1)}-01`;
  const firstOfNext = month === 11
    ? `${year + 1}-01-01`
    : `${year}-${pad(month + 2)}-01`;

  const prevHas = quote.slots.some(s => s < firstOfMonth);
  const nextHas = quote.slots.some(s => s >= firstOfNext);

  const monthName = calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const isRecurring = !!quote.frequency;
  const canBook = isRecurring || (!!selectedDate && !!selectedTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-5 space-y-4 pb-24"
    >
      {/* Main price */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-1.5 ${confidenceColor} px-3 py-1 rounded-full text-xs font-medium mb-3`}>
          <Shield className="w-3 h-3" />
          {quote.confidence}% — {confidenceLabel}
        </div>
        <div className="flex items-center justify-center gap-2">
          <h2 className="font-display text-3xl font-bold text-foreground">
            ${quote.low}{quote.type !== "fixed" && ` – $${quote.high}`}
          </h2>
          {quote.type === "fixed" && (
            <span className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
              Fixed Price
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{quote.serviceName}</p>
        {isRecurring && (
          <p className="text-xs text-primary font-medium mt-1 capitalize">
            {quote.frequency} · recurring
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Price Breakdown</h3>
        <div className="space-y-2 text-sm">
          {quote.breakdown.map((item, i) => (
            <div key={i} className={`flex justify-between ${item.amount === "—" || item.amount === "included" || item.amount === "n/a for repair" ? "opacity-60" : ""}`}>
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-foreground font-medium">{item.amount}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2">
            <div className="flex justify-between font-semibold items-center">
              <span>Estimated total</span>
              <div className="flex items-center gap-1.5">
                <span>${quote.low}{quote.type !== "fixed" && `–$${quote.high}`}</span>
                {quote.type === "fixed" && (
                  <span className="text-[10px] font-medium bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full">Fixed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What could change */}
      {quote.factors.length > 0 && (
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
      )}

      {/* Scheduling — calendar (one-time only) */}
      {!isRecurring && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Select Preferred Time</h3>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              disabled={!prevHas}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold">{monthName}</span>
            <button
              onClick={() => setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              disabled={!nextHas}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div key={d} className="text-[10px] text-muted-foreground text-center py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {calCells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
              const isAvail = availableSet.has(iso);
              const isSel = selectedDate === iso;
              return (
                <button
                  key={iso}
                  disabled={!isAvail}
                  onClick={() => { setSelectedDate(iso); setSelectedTime(null); }}
                  className={`
                    h-8 w-full flex items-center justify-center text-xs rounded-full transition-all
                    ${isSel
                      ? "bg-primary text-primary-foreground font-semibold"
                      : isAvail
                      ? "text-foreground hover:bg-primary/10 border border-primary/30"
                      : "text-muted-foreground/30 cursor-default"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time slots — shown after a date is selected */}
          {selectedDate ? (
            <div className="mt-4 border-t border-border pt-3 space-y-2">
              <p className="text-xs text-muted-foreground">Times on {formatDate(selectedDate)}</p>
              <div className="grid grid-cols-3 gap-2">
                {quote.timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`text-xs py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1 ${
                      selectedTime === time
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {selectedTime === time && <Check className="w-3 h-3" />}
                    {time}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-2">
              Tap a highlighted date to see available times
            </p>
          )}
        </div>
      )}

      {/* Recurring: scheduling already selected in form */}
      {isRecurring && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Recurring schedule set</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Your first service date and preferred times were selected in the previous step. Remaining visits will be auto-scheduled.
          </p>
        </div>
      )}

      {/* Pay after service badge */}
      <div className="flex items-center gap-2 bg-okra-50 rounded-xl p-3 border border-okra-100">
        <Shield className="w-5 h-5 text-secondary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Pay after service</p>
          <p className="text-[11px] text-muted-foreground">Payment collected after service is complete.</p>
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
          disabled={!canBook}
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
