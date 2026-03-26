import { motion } from "framer-motion";
import { Check, Calendar, MapPin, DollarSign, Clock, CreditCard, Shield } from "lucide-react";
import type { QuoteData } from "./AIIntakeChat";

interface BookingConfirmationProps {
  quote: QuoteData;
  onViewBookings: () => void;
  onHome: () => void;
}

const BookingConfirmation = ({ quote, onViewBookings, onHome }: BookingConfirmationProps) => {
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
            <p className="text-sm font-medium text-foreground">123 Main Street</p>
            <p className="text-xs text-muted-foreground">Seattle, WA 98101</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-warm-50 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-warm-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              ${quote.low}{quote.type !== "fixed" && `–$${quote.high}`}
            </p>
            <p className="text-xs text-muted-foreground">{quote.serviceName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Visa •••• 4242</p>
            <p className="text-xs text-muted-foreground">Pre-authorized · Not charged yet</p>
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
              <li>✓ Full receipt & invoice stored</li>
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
