import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Calendar, MapPin, DollarSign, Shield, Loader2, AlertCircle, Bell } from "lucide-react";
import type { QuoteData } from "./AIIntakeChat";
import type { ScheduleData } from "./QuoteView";
import type { IntakeFormData } from "@/lib/quoteCalculator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface BookingConfirmationProps {
  quote: QuoteData;
  serviceAddress?: string;
  scheduleData?: ScheduleData;
  intakeData?: IntakeFormData;
  onViewBookings: () => void;
  onHome: () => void;
}

const BookingConfirmation = ({ quote, serviceAddress, scheduleData, intakeData, onViewBookings, onHome }: BookingConfirmationProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dbBookingId, setDbBookingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setSaving(false); return; }

    const save = async () => {
      try {
        // Insert into booking_service
        const { data: bookingData, error: bookingError } = await supabase
          .from("booking_service")
          .insert({
            customer_user_id: user.id,
            service_type: quote.serviceId,
            package_name: quote.serviceName,
            booking_status: "pending",
            frequency: quote.frequency ?? "one-time",
            revenue: quote.low,
            notes: serviceAddress ?? null,
            home_id: intakeData?.homeId ?? null,
            customizations: intakeData as unknown as import("@/integrations/supabase/types").Json ?? null,
            images: (intakeData?.photos?.length ? intakeData.photos : null) as unknown as import("@/integrations/supabase/types").Json,
          })
          .select("id")
          .single();

        if (bookingError) throw bookingError;
        setDbBookingId(bookingData.id);

        // Build list of appointment dates to insert
        const appointmentDates: string[] = [];
        if (scheduleData?.selectedDates?.length) {
          appointmentDates.push(...scheduleData.selectedDates);
        } else if (scheduleData?.firstServiceDate) {
          appointmentDates.push(scheduleData.firstServiceDate);
        }

        // Batch-insert all appointment dates in a single DB round-trip
        if (appointmentDates.length > 0) {
          const { error: apptError } = await supabase
            .from("booking_appointment")
            .insert(
              appointmentDates.map(date => ({
                service_id: bookingData.id,
                appointment_date: date,
                appointment_status: "pending",
                customer_amount: quote.low,
                provider_amount: quote.providerPayout ?? null,
                platform_amount: quote.platformMargin ?? null,
              }))
            );
          if (apptError) throw apptError;
        }

        // Refresh the booking history cache so the new booking appears immediately
        queryClient.invalidateQueries({ queryKey: ["bookings", user.id] });

      } catch (err) {
        const pgErr = err as { message?: string; code?: string; details?: string; hint?: string };
        const code = pgErr?.code ? ` [${pgErr.code}]` : "";
        const hint = pgErr?.hint ? ` — ${pgErr.hint}` : "";
        const msg = `${pgErr?.message ?? (err instanceof Error ? err.message : "Booking save failed")}${code}${hint}`;
        setSaveError(msg);
        // intentionally not logging full error object to avoid leaking data to console in production
      } finally {
        setSaving(false);
      }
    };

    save();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Booking reference: use last 8 chars of DB id when available
  const bookingRef = dbBookingId
    ? `BK${dbBookingId.replace(/-/g, "").slice(-8).toUpperCase()}`
    : `BK${Date.now().toString(36).toUpperCase()}`;

  // Display dates
  const displayDates = scheduleData?.selectedDates?.length
    ? scheduleData.selectedDates
    : scheduleData?.firstServiceDate
    ? [scheduleData.firstServiceDate]
    : [];

  const displayTimes = scheduleData?.firstServiceTimeSlots?.length
    ? scheduleData.firstServiceTimeSlots
    : scheduleData?.selectedTimes ?? [];
  const hasPerDateSlots = !!(scheduleData?.dateTimeSlots && Object.keys(scheduleData.dateTimeSlots).length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-4 py-8 text-center space-y-6 pb-24"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className={`w-16 h-16 ${saveError ? "bg-destructive/10" : "bg-success"} text-success-foreground rounded-full flex items-center justify-center mx-auto`}
      >
        {saving ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        ) : saveError ? (
          <AlertCircle className="w-8 h-8 text-destructive" />
        ) : (
          <Check className="w-8 h-8" />
        )}
      </motion.div>

      {saveError ? (
        <div className="w-full">
          <h2 className="font-display text-xl font-bold text-destructive">Save Failed</h2>
          <div className="mt-2 mx-2 bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-left">
            <p className="text-xs font-semibold text-destructive mb-1">Database error — copy this and send to support:</p>
            <p className="text-xs text-destructive font-mono break-all">{saveError}</p>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Booked!</h2>
          <p className="text-sm text-muted-foreground mt-1">Your provider will confirm shortly</p>
        </div>
      )}

      {/* QR Code — customer shows to provider */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-semibold text-foreground">Show this QR code to your provider</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`blueokra-booking-${bookingRef}`)}&bgcolor=FFFFFF&color=000000`}
            className="w-44 h-44 rounded-xl border border-border"
            alt="Booking QR code"
          />
          <p className="text-[11px] text-muted-foreground">
            Provider scans this to confirm service — payment is collected after completion
          </p>
          <p className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">{bookingRef}</p>
        </div>
      </div>

      {/* Booking details */}
      <div className="bg-card rounded-2xl border border-border p-4 text-left space-y-3">
        {displayDates.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-okra-50 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-okra-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {displayDates.length === 1
                  ? format(new Date(displayDates[0] + "T12:00:00"), "EEE, MMM d, yyyy")
                  : `${displayDates.length} preferred dates`}
              </p>
              {displayDates.length > 1 && (
                <ul className="mt-0.5 space-y-0.5">
                  {displayDates.map(d => (
                    <li key={d} className="text-xs text-muted-foreground">
                      {format(new Date(d + "T12:00:00"), "EEE, MMM d")}
                    </li>
                  ))}
                </ul>
              )}
              {hasPerDateSlots ? (
                <ul className="mt-1 space-y-0.5">
                  {displayDates.map(d => {
                    const slots = scheduleData?.dateTimeSlots?.[d];
                    return slots?.length ? (
                      <li key={d} className="text-xs text-muted-foreground">
                        {new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: {slots.join(", ")}
                      </li>
                    ) : null;
                  })}
                </ul>
              ) : displayTimes.length > 0 ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preferred times: {displayTimes.join(", ")}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground mt-0.5">
                {quote.frequency ? `${quote.frequency} · recurring` : "One-time service"}
              </p>
            </div>
          </div>
        )}

        {serviceAddress && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{serviceAddress}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-warm-50 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-warm-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              ${quote.low}{quote.type !== "fixed" && `–$${quote.high}`}
              {quote.type === "fixed" && (
                <span className="ml-1.5 text-[10px] font-medium bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full">Fixed Price</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{quote.serviceName}</p>
          </div>
        </div>
      </div>

      <div className="bg-okra-50 rounded-2xl p-4 border border-okra-100 text-left">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Your protection</p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              <li>✓ Pay only after service is complete</li>
              <li>✓ Dispute protection included</li>
              <li>✓ Service warranty on file</li>
              <li>✓ Full receipt &amp; invoice stored</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">You'll hear back soon!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We'll notify you as soon as the provider confirms your date and time.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={onViewBookings}
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform"
        >
          View My Bookings
        </button>
        <button
          onClick={onHome}
          className="w-full text-muted-foreground text-sm py-2 hover:text-foreground transition-colors"
        >
          Back to Home
        </button>
      </div>
    </motion.div>
  );
};

export default BookingConfirmation;
