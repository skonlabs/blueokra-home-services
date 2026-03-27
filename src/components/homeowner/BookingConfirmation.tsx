import { motion } from "framer-motion";
import { Check, Calendar, MapPin, DollarSign, Clock, Shield } from "lucide-react";
import type { QuoteData } from "./AIIntakeChat";

interface BookingConfirmationProps {
  quote: QuoteData;
  serviceAddress?: string;
  onViewBookings: () => void;
  onHome: () => void;
}

const BookingConfirmation = ({ quote, serviceAddress, onViewBookings, onHome }: BookingConfirmationProps) => {
  // Generate a stable booking reference (in a real app this would come from the backend)
  const bookingRef = `BK${Date.now().toString(36).toUpperCase()}`;

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
        className="w-16 h-16 bg-success text-success-foreground rounded-full flex items-center justify-center mx-auto"
      >
        <Check className="w-8 h-8" />
      </motion.div>

      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Booked!</h2>
        <p className="text-sm text-muted-foreground mt-1">Your provider will confirm shortly</p>
      </div>

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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-okra-50 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-okra-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{quote.slots[0]}</p>
            <p className="text-xs text-muted-foreground">Estimated 1–2 hours</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{serviceAddress || "Service address on file"}</p>
          </div>
        </div>
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

      <div className="bg-muted rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            You'll get a notification when your provider is on their way
          </p>
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
