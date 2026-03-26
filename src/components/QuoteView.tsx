import { motion } from "framer-motion";
import { Shield, Clock, ChevronRight, Info } from "lucide-react";

interface QuoteViewProps {
  onBook: () => void;
  onBack: () => void;
}

const QuoteView = ({ onBook, onBack }: QuoteViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-6 space-y-5"
    >
      {/* Confidence */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 bg-okra-50 text-okra-600 px-3 py-1 rounded-full text-xs font-medium mb-3">
          <Shield className="w-3 h-3" />
          92% Confidence
        </div>
        <h2 className="font-display text-3xl font-bold text-foreground">$185 – $240</h2>
        <p className="text-sm text-muted-foreground mt-1">Lawn mowing + edge trimming</p>
      </div>

      {/* Breakdown */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Price Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base service</span>
            <span className="text-foreground font-medium">$150</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Edge trimming</span>
            <span className="text-foreground font-medium">$25</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Complexity factor</span>
            <span className="text-foreground font-medium">$10–$55</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Travel</span>
            <span className="text-foreground font-medium">Free</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Estimated total</span>
            <span>$185–$240</span>
          </div>
        </div>
      </div>

      {/* What could change */}
      <div className="bg-warm-50 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-warm-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">What could change the price?</p>
            <p className="text-xs text-muted-foreground mt-1">Actual yard size, grass height, obstacles, slope steepness</p>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Earliest Available</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["Today 2pm", "Tomorrow 9am", "Tomorrow 1pm", "Sat 10am", "Sat 2pm", "Sun 11am"].map((slot, i) => (
            <button
              key={slot}
              className={`text-xs py-2 px-2 rounded-xl border transition-all ${
                i === 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Select multiple preferred times</p>
      </div>

      {/* Pay after service badge */}
      <div className="flex items-center gap-2 bg-okra-50 rounded-xl p-3">
        <Shield className="w-5 h-5 text-secondary" />
        <div>
          <p className="text-sm font-medium text-foreground">Pay after service</p>
          <p className="text-xs text-muted-foreground">You're only charged after the job is done</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onBook}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
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
