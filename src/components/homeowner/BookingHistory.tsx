import { motion, AnimatePresence } from "framer-motion";
import { Star, Clock, DollarSign, RotateCcw, AlertTriangle, QrCode, Loader2, Download, X, MapPin, Calendar, Hash, RefreshCw } from "lucide-react";
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
  house_cleaning: "🧹", gutter: "🏗️", backwater: "💦",
  duct: "🌀", fence: "🪵",
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: rawBookings, isLoading, error: bookingsError } = useBookings();

  const safeFmt = (raw: string | null | undefined, fmt: string): string => {
    if (!raw) return "N/A";
    try {
      const d = new Date(raw.length === 10 ? raw + "T12:00:00" : raw);
      return isNaN(d.getTime()) ? "N/A" : format(d, fmt);
    } catch { return "N/A"; }
  };

  const bookings: Booking[] = (rawBookings || []).map((b) => ({
    id: b.id,
    serviceType: b.service_type,
    service: b.package_name || b.service_type,
    icon: serviceIcons[b.service_type] || "🔧",
    provider: "Assigned Provider",
    provider_user_id: b.booking_appointment?.[0]?.provider_user_id ?? undefined,
    date: b.booking_appointment?.[0]?.appointment_date
      ? safeFmt(b.booking_appointment[0].appointment_date, "MMM d, h:mm a")
      : safeFmt(b.created_at, "MMM d"),
    price: b.revenue ? `$${b.revenue}` : "TBD",
    status: mapStatus(b.booking_status),
  }));

  const filtered = activeTab === "all" ? bookings :
    activeTab === "upcoming" ? bookings.filter(b => b.status === "upcoming" || b.status === "in_progress") :
    bookings.filter(b => b.status === "completed");

  const selectedRaw = selectedId ? (rawBookings || []).find(b => b.id === selectedId) : null;
  const selectedBooking = selectedId ? bookings.find(b => b.id === selectedId) : null;

  return (
    <div className="px-4 py-4 pb-24 space-y-4 relative">
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
          <p className="text-xs font-medium text-destructive">Unable to load bookings. Please try again later.</p>
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
              className="bg-card rounded-2xl border border-border p-4 space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => setSelectedId(booking.id)}>
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
            </motion.div>
          ))}
        </div>
      )}

      {/* Booking Detail Sheet */}
      <AnimatePresence>
        {selectedBooking && selectedRaw && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)} />
            <motion.div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-lg bg-card rounded-t-3xl z-50 max-h-[75vh] overflow-y-auto"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}>
              <div className="px-4 pt-3 pb-24 space-y-4">
                {/* Handle */}
                <div className="w-10 h-1 bg-muted rounded-full mx-auto shrink-0" />

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{selectedBooking.icon}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{selectedBooking.service}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium inline-block mt-0.5 ${statusColors[selectedBooking.status]}`}>
                        {statusLabels[selectedBooking.status]}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground text-xs">Booking ID</span>
                    <span className="ml-auto font-mono text-xs truncate max-w-[40%]">BK{selectedRaw.id.replace(/-/g, "").slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground text-xs">Price</span>
                    <span className="ml-auto font-semibold text-sm">{selectedBooking.price}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <RefreshCw className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground text-xs">Frequency</span>
                    <span className="ml-auto capitalize text-sm">{selectedRaw.frequency || "One-time"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground text-xs">Booked on</span>
                    <span className="ml-auto text-sm">{format(new Date(selectedRaw.created_at), "MMM d, yyyy")}</span>
                  </div>
                  {selectedRaw.notes && (
                    <div className="flex items-start gap-2.5 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-xs shrink-0">Address</span>
                      <span className="ml-auto text-right text-xs leading-snug max-w-[55%] break-words">{selectedRaw.notes}</span>
                    </div>
                  )}
                </div>

                {/* Appointments */}
                {selectedRaw.booking_appointment?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Appointments</p>
                    {selectedRaw.booking_appointment.map((appt: { id: string; appointment_date: string; appointment_status: string }) => (
                      <div key={appt.id} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
                        <span className="text-xs">{format(new Date(appt.appointment_date), "EEE, MMM d, yyyy")}</span>
                        <span className="text-[11px] text-muted-foreground capitalize">{appt.appointment_status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {selectedBooking.status === "in_progress" && (
                    <button onClick={() => { setSelectedId(null); onPaymentFlow(); }}
                      className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
                      <QrCode className="w-3.5 h-3.5" /> Confirm &amp; Pay
                    </button>
                  )}
                  {selectedBooking.status === "completed" && !selectedBooking.rating && (
                    <button onClick={() => { setSelectedId(null); onReview(selectedBooking); }}
                      className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
                      <Star className="w-3.5 h-3.5" /> Leave Review
                    </button>
                  )}
                  {selectedBooking.status === "completed" && (
                    <button onClick={() => { setSelectedId(null); onRebook(selectedBooking.serviceType); }}
                      className="flex-1 bg-muted text-foreground text-xs font-medium py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
                      <RotateCcw className="w-3.5 h-3.5" /> Rebook
                    </button>
                  )}
                  {selectedBooking.status === "completed" && (
                    <button onClick={() => { setSelectedId(null); onDispute(); }}
                      className="w-11 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center active:scale-[0.97] transition-transform py-3">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {selectedBooking.status === "completed" && (
                  <button onClick={() => alert("Receipt saved to device")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Download className="w-3 h-3" /> Download Receipt
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingHistory;
