import { motion } from "framer-motion";
import { Star, Clock, DollarSign, RotateCcw, AlertTriangle, QrCode, Loader2, Download } from "lucide-react";
import { useState } from "react";
import { useBookings } from "@/hooks/useBookings";
import { format } from "date-fns";

interface BookingHistoryProps {
  onPaymentFlow: () => void;
  onReview: (booking: Booking) => void;
  onDispute: () => void;
  onRebook: (serviceId: string) => void;
}

type BookingStatus = "upcoming" | "in_progress" | "completed" | "disputed";

interface Booking {
  id: string;
  serviceType: string;
  service: string;
  icon: string;
  provider: string;
  provider_user_id?: string;
  date: string;
  price: string;
  status: BookingStatus;
  rating?: number;
}

const serviceIcons: Record<string, string> = {
  lawn: "🌿", hvac: "❄️", plumbing: "🔧", pressure: "💧",
  roof: "🏠", electrical: "⚡", handyman: "🛠️",
};

const mapStatus = (status: string): BookingStatus => {
  switch (status) {
    case "purchased": case "pending": case "scheduled": return "upcoming";
    case "in_progress": return "in_progress";
    case "completed": return "completed";
    case "disputed": return "disputed";
    default: return "upcoming";
  }
};

const statusColors: Record<BookingStatus, string> = {
  upcoming: "bg-blue-50 text-blue-500",
  in_progress: "bg-warm-50 text-warm-500",
  completed: "bg-okra-50 text-okra-600",
  disputed: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<BookingStatus, string> = {
  upcoming: "Upcoming", in_progress: "In Progress", completed: "Completed", disputed: "Disputed",
};

const BookingHistory = ({ onPaymentFlow, onReview, onDispute, onRebook }: BookingHistoryProps) => {
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">("all");
  const { data: rawBookings, isLoading, error: bookingsError } = useBookings();

  const bookings: Booking[] = (rawBookings || []).map((b) => ({
    id: b.id,
    serviceType: b.service_type,
    service: b.package_name || b.service_type,
    icon: serviceIcons[b.service_type] || "🔧",
    provider: "Assigned Provider",
    provider_user_id: b.booking_appointment?.[0]?.provider_user_id ?? undefined,
    date: b.booking_appointment?.[0]?.appointment_date
      ? format(new Date(b.booking_appointment[0].appointment_date), "MMM d, h:mm a")
      : format(new Date(b.created_at), "MMM d"),
    price: b.revenue ? `$${b.revenue}` : "TBD",
    status: mapStatus(b.booking_status),
  }));

  const filtered = activeTab === "all" ? bookings :
    activeTab === "upcoming" ? bookings.filter(b => b.status === "upcoming" || b.status === "in_progress") :
    bookings.filter(b => b.status === "completed");

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {(["all", "upcoming", "completed"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      {bookingsError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
          <p className="text-xs font-semibold text-destructive mb-1">Failed to load bookings — copy and send to support:</p>
          <p className="text-xs text-destructive font-mono break-all">{JSON.stringify(bookingsError)}</p>
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm text-muted-foreground">No bookings yet</p>
          <p className="text-xs text-muted-foreground mt-1">Book a service from the home screen to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, i) => (
            <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-4 space-y-3">
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
              {booking.rating && (
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= booking.rating! ? "fill-warm-500 text-warm-500" : "text-muted"}`} />)}
                </div>
              )}
              <div className="flex gap-2">
                {booking.status === "in_progress" && (
                  <button onClick={onPaymentFlow} className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
                    <QrCode className="w-3.5 h-3.5" /> Confirm &amp; Pay
                  </button>
                )}
                {booking.status === "completed" && !booking.rating && (
                  <button onClick={() => onReview(booking)} className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
                    <Star className="w-3.5 h-3.5" /> Leave Review
                  </button>
                )}
                {booking.status === "completed" && (
                  <>
                    <button onClick={() => onRebook(booking.serviceType)} className="flex-1 bg-muted text-foreground text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
                      <RotateCcw className="w-3.5 h-3.5" /> Rebook
                    </button>
                    <button onClick={onDispute} className="w-10 bg-muted text-muted-foreground rounded-xl flex items-center justify-center active:scale-[0.97] transition-transform">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              {booking.status === "completed" && (
                <button onClick={() => alert("Receipt saved to device")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="w-3 h-3" /> Download Receipt
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
