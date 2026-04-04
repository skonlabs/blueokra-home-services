import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, Shield, Calendar, RotateCcw, Leaf, Snowflake, Sun, Wind, Droplets, Camera, AlertCircle, CalendarClock } from "lucide-react";
import ServiceGrid from "./ServiceGrid";
import ServiceIcon from "@/components/shared/ServiceIcon";
import { useBookings } from "@/hooks/useBookings";
import { useHomeownerAppointments } from "@/hooks/useHomeownerAppointments";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface HomeScreenProps {
  onServiceSelect: (serviceId: string, rebookData?: any) => void;
  onOpenIntake: (context?: string) => void;
  onViewBookings: () => void;
  onViewProperty: () => void;
  onViewProfile: () => void;
  onBookAgain: () => void;
  onRebook: (serviceId: string, customizations?: any) => void;
  onViewSchedule?: () => void;
}

// Dynamic seasonal picks based on current month
function getSeasonalRecs() {
  const month = new Date().getMonth(); // 0–11

  if (month >= 2 && month <= 4) {
    return [
      { title: "Spring Lawn Care", description: "First mow of the season — get your yard looking great", serviceId: "lawn", icon: Leaf, color: "text-secondary" },
      { title: "Gutter Cleaning", description: "Clear winter debris before spring rains", serviceId: "gutter", icon: Droplets, color: "text-primary" },
      { title: "Pressure Washing", description: "Refresh driveways, siding & decks", serviceId: "pressure", icon: Sun, color: "text-accent" },
    ];
  } else if (month >= 5 && month <= 7) {
    return [
      { title: "Lawn Maintenance", description: "Keep your lawn healthy through the summer heat", serviceId: "lawn", icon: Leaf, color: "text-secondary" },
      { title: "Duct Cleaning", description: "Improve AC efficiency and air quality", serviceId: "duct", icon: Wind, color: "text-primary" },
      { title: "Fence Installation", description: "Perfect weather for outdoor projects", serviceId: "fence", icon: Sun, color: "text-accent" },
    ];
  } else if (month >= 8 && month <= 10) {
    return [
      { title: "Gutter Cleaning", description: "Clear fallen leaves before winter clogs", serviceId: "gutter", icon: Leaf, color: "text-secondary" },
      { title: "Roof Cleaning", description: "Remove moss & debris before rainy season", serviceId: "roof", icon: Sun, color: "text-accent" },
      { title: "Duct Cleaning", description: "Prepare your heating system for winter", serviceId: "duct", icon: Snowflake, color: "text-primary" },
    ];
  } else {
    return [
      { title: "Backwater Testing", description: "Prevent flooding and comply with local codes", serviceId: "backwater", icon: Snowflake, color: "text-primary" },
      { title: "Duct Cleaning", description: "Keep heating system clean and efficient", serviceId: "duct", icon: Wind, color: "text-accent" },
      { title: "House Cleaning", description: "Deep clean and refresh your home", serviceId: "house_cleaning", icon: Sun, color: "text-secondary" },
    ];
  }
}

const HomeScreen = forwardRef<HTMLDivElement, HomeScreenProps>(({
  onServiceSelect,
  onOpenIntake,
  onViewBookings,
  onViewProperty,
  onBookAgain,
  onRebook,
  onViewSchedule,
}, ref) => {
  const { profile } = useAuth();
  const { data: rawBookings } = useBookings();
  const { data: appointments } = useHomeownerAppointments();
  const seasonalRecs = getSeasonalRecs();

  const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  // Count appointments needing homeowner confirmation
  const pendingConfirmations = (appointments || []).filter(
    (a) => a.customer_status === "pending" && !["completed", "declined", "cancelled"].includes(a.appointment_status)
  );

  // Action needed items for homeowners
  const actionItems: { label: string; description: string; icon: React.ReactNode; action: () => void }[] = [];
  if (pendingConfirmations.length > 0) {
    actionItems.push({
      label: `${pendingConfirmations.length} appointment${pendingConfirmations.length > 1 ? "s" : ""} need${pendingConfirmations.length === 1 ? "s" : ""} your confirmation`,
      description: "A new date/time has been proposed — review and confirm",
      icon: <CalendarClock className="w-4 h-4 text-primary" />,
      action: () => onViewSchedule?.(),
    });
  }
  if (!profile?.profile_photo_url) {
    actionItems.push({ label: "Add profile photo", description: "Personalize your account", icon: <Camera className="w-4 h-4 text-primary" />, action: () => onViewProperty() });
  }

  // Show last 2 bookings from DB, fall back to empty
  const recentBookings = (rawBookings || []).slice(0, 2).map(b => {
    let dateStr = "N/A";
    try {
      const apptDate = b.booking_appointment?.[0]?.appointment_date;
      if (apptDate) {
        const d = new Date(apptDate.length === 10 ? apptDate + "T12:00:00" : apptDate);
        if (!isNaN(d.getTime())) dateStr = format(d, "MMM d");
      } else {
        const d = new Date(b.created_at);
        if (!isNaN(d.getTime())) dateStr = format(d, "MMM d");
      }
    } catch { /* keep "N/A" */ }

    return {
      id: b.id,
      serviceType: b.service_type,
      service: b.package_name || b.service_type,
      date: dateStr,
      price: b.revenue ? `$${b.revenue}` : "TBD",
      status: b.booking_status,
    };
  });

  return (
    <div ref={ref} className="px-4 pt-4 pb-24">
      {/* Greeting - compact inline */}
      <div className="mb-4 flex items-baseline gap-1.5">
        <h1 className="font-display text-lg font-bold text-foreground">Hi{userName ? ` ${userName.split(' ')[0]}` : ""} 👋</h1>
        <span className="text-sm text-muted-foreground">What can we help with?</span>
      </div>

      {/* Action Needed */}
      {actionItems.length > 0 && (
        <div className="mb-5">
          <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-accent" />
            Action Needed
          </h3>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full bg-accent/10 border border-accent/20 rounded-xl p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search / Quick input */}
      <button
        onClick={() => onOpenIntake()}
        className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 mb-5 active:scale-[0.99] transition-transform"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">What do you need help with?</span>
      </button>

      {/* Services — shown first below search */}
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">Services</h2>
        <ServiceGrid onSelect={onServiceSelect} />
      </div>

      {/* Trust badge */}
      <div className="flex items-center gap-2 bg-secondary/5 rounded-2xl p-3 mb-6 border border-secondary/20">
        <Shield className="w-5 h-5 text-secondary shrink-0" />
        <div>
          <p className="text-xs font-medium text-foreground">Pay-after-service guarantee</p>
          <p className="text-[11px] text-muted-foreground">You're only charged once the job is done right</p>
        </div>
      </div>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent</h2>
            <button onClick={onViewBookings} className="text-xs text-primary font-medium flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                <ServiceIcon serviceType={booking.serviceType} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{booking.service}</p>
                  <p className="text-xs text-muted-foreground">{booking.date} · {booking.price}</p>
                </div>
                <button
                  onClick={() => {
                    const raw = (rawBookings || []).find(b => b.id === booking.id);
                    onRebook(booking.serviceType, raw?.customizations || undefined);
                  }}
                  className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium active:scale-[0.97] transition-transform"
                >
                  Rebook
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal Picks */}
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">Seasonal Picks</h2>
        <div className="space-y-2">
          {seasonalRecs.map((rec, i) => (
            <motion.button
              key={rec.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              onClick={() => onServiceSelect(rec.serviceId)}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-3 text-left active:scale-[0.99] transition-transform"
            >
              <div className={`w-9 h-9 rounded-full bg-muted flex items-center justify-center ${rec.color}`}>
                <rec.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{rec.title}</p>
                <p className="text-xs text-muted-foreground">{rec.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
});

HomeScreen.displayName = "HomeScreen";

export default HomeScreen;
