import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, User, Search, ChevronRight, Shield, Calendar, RotateCcw, Zap, Leaf, Snowflake, Sun } from "lucide-react";
import ServiceGrid from "./ServiceGrid";
import blueokraLogo from "@/assets/blueokra-logo.svg";

interface HomeScreenProps {
  onServiceSelect: (serviceId: string) => void;
  onOpenIntake: (context?: string) => void;
  onViewBookings: () => void;
  onViewProperty: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onEmergency: () => void;
  onBookAgain: () => void;
  onRebook: (id: string) => void;
}

const recentBookings = [
  { id: "1", service: "Lawn Mowing", date: "Mar 15", status: "completed", price: "$185", icon: "🌿" },
  { id: "2", service: "HVAC Tune-up", date: "Feb 28", status: "completed", price: "$150", icon: "❄️" },
];

const seasonalRecs = [
  { title: "Spring Lawn Care", description: "Time for your first mow of the season", icon: Leaf, color: "text-secondary" },
  { title: "AC Tune-up", description: "Get ready for summer heat", icon: Snowflake, color: "text-primary" },
  { title: "Gutter Cleaning", description: "Clear winter debris", icon: Sun, color: "text-accent" },
];

const HomeScreen = ({
  onServiceSelect,
  onOpenIntake,
  onViewBookings,
  onViewProperty,
  onOpenProfile,
  onOpenNotifications,
  onEmergency,
  onBookAgain,
  onRebook,
}: HomeScreenProps) => {
  return (
    <div className="px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back 👋</p>
          <div className="flex items-center gap-2">
            <img src={blueokraLogo} alt="BlueOkra" className="w-8 h-8" />
            <h1 className="font-display text-2xl font-bold text-gradient-primary">
              BlueOkra<sup className="text-xs font-normal align-super text-primary">®</sup>
            </h1>
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">beta</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-background" />
          </button>
          <button
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search / Quick input */}
      <button
        onClick={() => onOpenIntake()}
        className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 mb-5 active:scale-[0.99] transition-transform"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">What do you need help with?</span>
      </button>

      {/* Quick actions */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          onClick={onEmergency}
          className="shrink-0 bg-destructive/10 text-destructive border border-destructive/20 rounded-full px-4 py-2 text-xs font-medium active:scale-[0.97] transition-transform flex items-center gap-1.5"
        >
          <Zap className="w-3 h-3" /> Emergency
        </button>
        <button
          onClick={onBookAgain}
          className="shrink-0 bg-card border border-border rounded-full px-4 py-2 text-xs font-medium text-foreground active:scale-[0.97] transition-transform flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" /> Book Again
        </button>
        <button
          onClick={() => onOpenIntake("recurring")}
          className="shrink-0 bg-card border border-border rounded-full px-4 py-2 text-xs font-medium text-foreground active:scale-[0.97] transition-transform flex items-center gap-1.5"
        >
          <Calendar className="w-3 h-3" /> Recurring
        </button>
      </div>

      {/* Trust badge */}
      <div className="flex items-center gap-2 bg-okra-50 rounded-2xl p-3 mb-6 border border-okra-100">
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
                <span className="text-xl">{booking.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{booking.service}</p>
                  <p className="text-xs text-muted-foreground">{booking.date} · {booking.price}</p>
                </div>
                <button
                  onClick={() => onRebook(booking.id)}
                  className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium active:scale-[0.97] transition-transform"
                >
                  Rebook
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">Services</h2>
        <ServiceGrid onSelect={onServiceSelect} />
      </div>

      {/* Seasonal Recommendations */}
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">Seasonal Picks</h2>
        <div className="space-y-2">
          {seasonalRecs.map((rec, i) => (
            <motion.button
              key={rec.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              onClick={() => onOpenIntake()}
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
};

export default HomeScreen;
