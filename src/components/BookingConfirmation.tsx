import { motion } from "framer-motion";
import { Check, Calendar, MapPin, DollarSign, Clock } from "lucide-react";

const BookingConfirmation = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-4 py-8 text-center space-y-6"
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
          <div className="w-8 h-8 rounded-full bg-okra-50 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-okra-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Today, 2:00 PM</p>
            <p className="text-xs text-muted-foreground">Estimated 1–2 hours</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">123 Main Street</p>
            <p className="text-xs text-muted-foreground">Your saved address</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-warm-50 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-warm-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">$185–$240</p>
            <p className="text-xs text-muted-foreground">Pay after service completion</p>
          </div>
        </div>
      </div>

      <div className="bg-muted rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            You'll receive a notification when your provider is on their way
          </p>
        </div>
      </div>

      <button className="w-full bg-muted text-foreground font-medium py-3 rounded-2xl text-sm hover:bg-muted/80 transition-colors">
        View My Bookings
      </button>
    </motion.div>
  );
};

export default BookingConfirmation;
