import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Clock, ChevronRight, ChevronLeft, AlertTriangle, Check, MapPin } from "lucide-react";
import type { QuoteData } from "./AIIntakeChat";

// ---------------------------------------------------------------------------
// Scheduling data — exported so Index.tsx and BookingConfirmation can use it
// ---------------------------------------------------------------------------

export interface ScheduleData {
  // One-time: multiple preferred dates with per-date time slots
  selectedDates?: string[];
  selectedTimes?: string[];           // legacy / fallback
  dateTimeSlots?: Record<string, string[]>; // per-date time slots
  // Recurring
  firstServiceDate?: string;
  firstServiceTimeSlots?: string[];
  recurringEndMonth?: number;
  recurringEndYear?: number;
}

// ---------------------------------------------------------------------------
// Total-number-of-services helper
// ---------------------------------------------------------------------------

const FREQUENCY_INTERVAL_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 91,
};

export function calcTotalServices(
  frequency: string,
  startDate: string,
  endMonth: number,   // 1-based
  endYear: number,
): number {
  const intervalDays = FREQUENCY_INTERVAL_DAYS[frequency];
  if (!intervalDays || !startDate) return 1;

  const start = new Date(startDate + "T12:00:00");
  // End date = last day of the selected end month
  const end = new Date(endYear, endMonth, 0, 23, 59, 59); // day 0 of next month = last day

  if (end <= start) return 1;

  let count = 1; // first service
  let current = new Date(start);
  while (true) {
    current.setDate(current.getDate() + intervalDays);
    if (current > end) break;
    count++;
  }
  return count;
}

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

const TIME_SLOT_OPTIONS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuoteViewProps {
  quote: QuoteData;
  serviceAddress?: string;
  onBook: (schedule: ScheduleData) => void;
  onBack: () => void;
}

const QuoteView = ({ quote, serviceAddress, onBook, onBack }: QuoteViewProps) => {
  const currentYear = new Date().getFullYear();

  // One-time scheduling — multiple dates
  const [calMonth, setCalMonth] = useState<Date>(() =>
    quote.slots[0] ? new Date(quote.slots[0] + "T12:00:00") : new Date()
  );
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateTimeSlotsMap, setDateTimeSlotsMap] = useState<Record<string, string[]>>({});

  // Recurring scheduling
  const [firstServiceDate, setFirstServiceDate] = useState("");
  const [firstServiceTimeSlots, setFirstServiceTimeSlots] = useState<string[]>([]);
  const [recurringEndMonth, setRecurringEndMonth] = useState(new Date().getMonth() + 1);
  const [recurringEndYear, setRecurringEndYear] = useState(currentYear + 1);

  const toggleDate = (iso: string) => {
    setSelectedDates(prev =>
      prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso]
    );
  };

  const toggleDateTimeSlot = (date: string, slot: string) => {
    setDateTimeSlotsMap(prev => {
      const cur = prev[date] ?? [];
      const next = cur.includes(slot) ? cur.filter(s => s !== slot) : [...cur, slot];
      return { ...prev, [date]: next };
    });
  };

  const toggleRecurringTimeSlot = (slot: string) => {
    setFirstServiceTimeSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const confidenceColor = quote.confidence >= 85 ? "text-secondary bg-okra-50" :
    quote.confidence >= 70 ? "text-primary bg-blue-50" : "text-accent bg-warm-50";

  const confidenceLabel = quote.confidence >= 85 ? "High Confidence" :
    quote.confidence >= 70 ? "Medium Confidence" : "Needs Assessment";

  // Calendar variables
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const availableSet = new Set(quote.slots);

  // Monday-first offset
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
  const canBook = isRecurring
    ? !!firstServiceDate
    : selectedDates.length > 0;

  // TNS & total price for recurring services
  const tns = isRecurring && firstServiceDate && quote.frequency
    ? calcTotalServices(quote.frequency, firstServiceDate, recurringEndMonth, recurringEndYear)
    : 1;
  const recurringPerVisit = quote.recurringVisitPrice ?? quote.low;
  const totalContractPrice = isRecurring
    ? quote.low + (tns - 1) * recurringPerVisit
    : quote.low;

  const handleBook = () => {
    if (isRecurring) {
      onBook({ firstServiceDate, firstServiceTimeSlots, recurringEndMonth, recurringEndYear });
    } else {
      onBook({ selectedDates, dateTimeSlots: dateTimeSlotsMap });
    }
  };

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

        {/* First visit vs recurring price */}
        {quote.recurringVisitPrice !== undefined ? (
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">First visit</p>
              <h2 className="font-display text-3xl font-bold text-foreground">${quote.low}</h2>
            </div>
            <div className="text-muted-foreground/50 text-lg">→</div>
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">From 2nd visit</p>
              <h2 className="font-display text-2xl font-bold text-muted-foreground">${quote.recurringVisitPrice}</h2>
            </div>
          </div>
        ) : (
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
        )}

        <p className="text-sm text-muted-foreground mt-1">{quote.serviceName}</p>
        {isRecurring && (
          <p className="text-xs text-primary font-medium mt-1 capitalize">
            {quote.frequency} · recurring
          </p>
        )}

        {/* Service address */}
        {serviceAddress && (
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[240px]">{serviceAddress}</span>
          </div>
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
            {quote.recurringVisitPrice !== undefined && (
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>From 2nd visit</span>
                <span>${quote.recurringVisitPrice}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Why book now */}
      <div className="bg-secondary/5 rounded-2xl p-4 border border-secondary/20">
        <p className="text-sm font-semibold text-foreground mb-2.5">What's included</p>
        <ul className="space-y-2">
          {[
            "Background-checked, vetted provider",
            "Pay only after the job is done right",
            "Dispute protection — we've got your back",
            "Service satisfaction guarantee",
            "Full invoice & receipt on file",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-foreground">
              <Check className="w-3.5 h-3.5 text-secondary shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Scheduling — calendar (one-time) */}
      {!isRecurring && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Select Preferred Date(s)</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Select one or more dates — we'll match with provider availability and confirm.
          </p>

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

          {/* Day cells — multi-select */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {calCells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
              const isAvail = availableSet.has(iso);
              const isSel = selectedDates.includes(iso);
              return (
                <button
                  key={iso}
                  disabled={!isAvail}
                  onClick={() => toggleDate(iso)}
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

          {/* Per-date time slot selection */}
          {selectedDates.length > 0 && (
            <div className="mt-3 border-t border-border pt-3 space-y-4">
              <p className="text-xs font-medium text-muted-foreground">Select preferred time slots for each date</p>
              {selectedDates.sort().map(date => (
                <div key={date}>
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                    {formatDate(date)}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TIME_SLOT_OPTIONS.map((slot) => {
                      const isSelected = dateTimeSlotsMap[date]?.includes(slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => toggleDateTimeSlot(date, slot)}
                          className={`text-xs py-1.5 px-1 rounded-xl border transition-all flex items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:border-primary/50"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduling — recurring */}
      {isRecurring && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Schedule Your Recurring Service</h3>
          </div>

          {/* First service date */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">First service date <span className="text-destructive">*</span></p>
            <input
              type="date"
              value={firstServiceDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setFirstServiceDate(e.target.value)}
              className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent"
            />
          </div>

          {/* Preferred time slots */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Preferred time slots (select one or more)</p>
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_SLOT_OPTIONS.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleRecurringTimeSlot(slot)}
                  className={`text-xs py-1.5 px-1 rounded-lg border transition-all ${
                    firstServiceTimeSlots.includes(slot)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* End date */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Continue service until</p>
            <div className="flex gap-2">
              <select
                value={recurringEndMonth}
                onChange={(e) => setRecurringEndMonth(Number(e.target.value))}
                className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={recurringEndYear}
                onChange={(e) => setRecurringEndYear(Number(e.target.value))}
                className="w-24 bg-muted rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent"
              >
                {[currentYear, currentYear + 1, currentYear + 2, currentYear + 3].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Total contract summary */}
          {firstServiceDate && tns > 1 && (
            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Estimated Total</p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">First visit</span>
                <span className="font-medium">${quote.low}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{tns - 1} subsequent visit{tns - 1 !== 1 ? "s" : ""} × ${recurringPerVisit}</span>
                <span className="font-medium">${(tns - 1) * recurringPerVisit}</span>
              </div>
              <div className="border-t border-primary/20 pt-1.5 flex justify-between text-sm font-semibold">
                <span>Total ({tns} visits)</span>
                <span className="text-primary">${totalContractPrice}</span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Remaining visits auto-scheduled based on your selected frequency and end date.
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
          onClick={handleBook}
          disabled={!canBook}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
        >
          Book Now
          <ChevronRight className="w-4 h-4" />
        </button>
        {!canBook && (
          <p className="text-[11px] text-center text-muted-foreground">
            {isRecurring ? "Select a first service date to continue" : "Select at least one preferred date to continue"}
          </p>
        )}
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
