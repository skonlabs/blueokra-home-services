import { motion } from "framer-motion";
import { Star, Clock, DollarSign, RotateCcw, AlertTriangle, QrCode, Download } from "lucide-react";
import { useState } from "react";

interface BookingHistoryProps {
  onPaymentFlow: () => void;
  onReview: (booking: Booking) => void;
  onDispute: () => void;
  onRebook: (serviceId: string) => void;
}

type BookingStatus = "upcoming" | "in_progress" | "completed" | "disputed";

interface Booking {
  id: string;
  service: string;
  icon: string;
  provider: string;
  date: string;
  price: string;
  status: BookingStatus;
  rating?: number;
}

const mockBookings: Booking[] = [
  { id: "1", service: "Lawn Mowing", icon: "🌿", provider: "Mike's Lawn Care", date: "Today, 2:00 PM", price: "$185", status: "in_progress" },
  { id: "2", service: "HVAC Tune-up", icon: "❄️", provider: "Cool Air Pros", date: "Mar 15, 10:00 AM", price: "$150", status: "completed", rating: 5 },
  { id: "3", service: "Pressure Wash", icon: "💧", provider: "SparkleClean", date: "Mar 8, 9:00 AM", price: "$320", status: "completed", rating: 4 },
  { id: "4", service: "Plumbing Repair", icon: "🔧", provider: "QuickFix Plumbing", date: "Feb 20, 11:00 AM", price: "$275", status: "completed", rating: 5 },
  { id: "5", service: "Gutter Cleaning", icon: "🏠", provider: "Roof Pros NW", date: "Feb 5, 8:00 AM", price: "$180", status: "completed" },
];

const statusColors: Record<BookingStatus, string> = {
  upcoming: "bg-blue-50 text-blue-500",
  in_progress: "bg-warm-50 text-warm-500",
  completed: "bg-okra-50 text-okra-600",
  disputed: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<BookingStatus, string> = {
  upcoming: "Upcoming",
  in_progress: "In Progress",
  completed: "Completed",
  disputed: "Disputed",
};

const BookingHistory = ({ onPaymentFlow, onReview, onDispute, onRebook }: BookingHistoryProps) => {
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">("all");
  const [activeBooking, setActiveBooking] = useState<string | null>(null);

  const filtered = activeTab === "all" ? mockBookings :
    activeTab === "upcoming" ? mockBookings.filter(b => b.status === "upcoming" || b.status === "in_progress") :
    mockBookings.filter(b => b.status === "completed");

  const handleDownloadReceipt = (booking: Booking) => {
    console.log(`Downloading receipt for booking ${booking.id}: ${booking.service}`);
    // Show a simple inline toast via state or just log for now
    alert("Receipt saved to device");
  };

  const handleReview = (booking: Booking) => {
    setActiveBooking(booking.id);
    onReview(booking);
  };

  const handleDispute = (booking: Booking) => {
    setActiveBooking(booking.id);
    onDispute();
  };

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {(["all", "upcoming", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings */}
      <div className="space-y-3">
        {filtered.map((booking, i) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{booking.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{booking.service}</p>
                  <p className="text-xs text-muted-foreground">{booking.provider}</p>
                </div>
              </div>
              <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusColors[booking.status]}`}>
                {statusLabels[booking.status]}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.date}</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{booking.price}</span>
            </div>

            {/* Rating */}
            {booking.rating && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= booking.rating! ? "fill-warm-500 text-warm-500" : "text-muted"}`} />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {booking.status === "in_progress" && (
                <button
                  onClick={onPaymentFlow}
                  className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                >
                  <QrCode className="w-3.5 h-3.5" /> Confirm &amp; Pay
                </button>
              )}
              {booking.status === "completed" && !booking.rating && (
                <button
                  onClick={() => handleReview(booking)}
                  className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                >
                  <Star className="w-3.5 h-3.5" /> Leave Review
                </button>
              )}
              {booking.status === "completed" && (
                <>
                  <button
                    onClick={() => onRebook(booking.id)}
                    className="flex-1 bg-muted text-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Rebook
                  </button>
                  <button
                    onClick={() => handleDispute(booking)}
                    className="w-10 bg-muted text-muted-foreground rounded-xl flex items-center justify-center active:scale-[0.97] transition-transform"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Download Receipt (completed bookings only) */}
            {booking.status === "completed" && (
              <button
                onClick={() => handleDownloadReceipt(booking)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-3 h-3" />
                Download Receipt
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BookingHistory;
