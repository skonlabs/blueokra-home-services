import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Bell, User, Home, Briefcase, History, Settings } from "lucide-react";
import ServiceGrid from "@/components/ServiceGrid";
import AIIntakeChat from "@/components/AIIntakeChat";
import QuoteView from "@/components/QuoteView";
import BookingConfirmation from "@/components/BookingConfirmation";
import ProviderDashboard from "@/components/ProviderDashboard";

type Screen = "home" | "intake" | "quote" | "booked" | "provider";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedService, setSelectedService] = useState<string | undefined>();

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setScreen("intake");
  };

  const goHome = () => {
    setScreen("home");
    setSelectedService(undefined);
  };

  if (screen === "provider") {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-background relative">
        <ProviderDashboard />
        <BottomNav active="provider" onNavigate={(s) => setScreen(s as Screen)} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background flex flex-col relative">
      {/* Status bar area */}
      <AnimatePresence mode="wait">
        {screen === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <div className="px-4 pt-12 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Welcome back 👋</p>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Blue<span className="text-primary">Okra</span>
                  </h1>
                </div>
                <div className="flex gap-2">
                  <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Bell className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <User className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search / Quick input */}
              <button
                onClick={() => {
                  setSelectedService(undefined);
                  setScreen("intake");
                }}
                className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 mb-6 active:scale-[0.99] transition-transform"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">What do you need help with?</span>
              </button>

              {/* Quick actions */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {["🚨 Emergency", "🔄 Book Again", "📅 Recurring"].map((label) => (
                  <button
                    key={label}
                    className="shrink-0 bg-card border border-border rounded-full px-4 py-2 text-xs font-medium text-foreground active:scale-[0.97] transition-transform"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Services */}
              <div className="mb-4">
                <h2 className="font-display text-lg font-semibold text-foreground mb-3">Services</h2>
                <ServiceGrid onSelect={handleServiceSelect} />
              </div>
            </div>
          </motion.div>
        )}

        {screen === "intake" && (
          <motion.div
            key="intake"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {/* Intake header */}
            <div className="px-4 pt-12 pb-3 flex items-center gap-3 border-b border-border">
              <button onClick={goHome} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  {selectedService ? `${selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Service` : "Describe Your Need"}
                </h2>
                <p className="text-xs text-muted-foreground">AI-powered intake</p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIIntakeChat serviceId={selectedService} onQuoteReady={() => setScreen("quote")} />
            </div>
          </motion.div>
        )}

        {screen === "quote" && (
          <motion.div
            key="quote"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="px-4 pt-12 pb-3 flex items-center gap-3">
              <button onClick={() => setScreen("intake")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
              <h2 className="font-display text-base font-semibold text-foreground">Your Quote</h2>
            </div>
            <QuoteView onBook={() => setScreen("booked")} onBack={() => setScreen("intake")} />
          </motion.div>
        )}

        {screen === "booked" && (
          <motion.div
            key="booked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="px-4 pt-12 pb-3 flex items-center gap-3">
              <button onClick={goHome} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
              <h2 className="font-display text-base font-semibold text-foreground">Confirmation</h2>
            </div>
            <BookingConfirmation />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      {screen !== "provider" && (
        <BottomNav active="home" onNavigate={(s) => setScreen(s as Screen)} />
      )}
    </div>
  );
};

const BottomNav = ({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (screen: string) => void;
}) => {
  const items = [
    { id: "home", icon: Home, label: "Home" },
    { id: "history", icon: History, label: "History" },
    { id: "provider", icon: Briefcase, label: "Provider" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="sticky bottom-0 bg-card border-t border-border px-2 pb-6 pt-2">
      <div className="flex justify-around">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              active === item.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Index;
