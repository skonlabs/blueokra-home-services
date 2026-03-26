import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";

interface ReviewModalProps {
  booking: { id: string; service: string; provider: string; icon: string } | null;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

const quickFeedbackOptions = [
  "Great communication",
  "On time",
  "Quality work",
  "Would rebook",
];

const ReviewModal = ({ booking, onClose, onSubmit }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  if (!booking) return null;

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    const fullComment = [
      ...selectedChips,
      ...(comment.trim() ? [comment.trim()] : []),
    ].join(". ");
    onSubmit(rating, fullComment);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        onClick={onClose}
      >
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal card */}
        <motion.div
          className="relative z-10 w-full max-w-sm bg-card rounded-3xl p-6 shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{booking.icon}</span>
              <div>
                <p className="font-semibold text-sm text-foreground">{booking.service}</p>
                <p className="text-xs text-muted-foreground">{booking.provider}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Star rating */}
          <div className="mb-5">
            <p className="text-sm font-medium text-foreground mb-3 text-center">How did it go?</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileTap={{ scale: 0.8 }}
                  whileHover={{ scale: 1.15 }}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-colors"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hovered || rating)
                        ? "fill-warm-500 text-warm-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quick feedback chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quickFeedbackOptions.map((chip) => (
              <button
                key={chip}
                onClick={() => toggleChip(chip)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedChips.includes(chip)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Text area */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more (optional)"
            className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground min-h-24 resize-none outline-none mb-5 border-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all ${
              rating > 0
                ? "bg-primary text-primary-foreground active:scale-[0.98]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Submit Review
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;
