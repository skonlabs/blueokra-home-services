import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Auth from "./Auth";
import BottomNav from "@/components/shared/BottomNav";
import ScreenHeader from "@/components/shared/ScreenHeader";
import HomeScreen from "@/components/homeowner/HomeScreen";
import AIIntakeChat from "@/components/homeowner/AIIntakeChat";
import QuoteView from "@/components/homeowner/QuoteView";
import BookingConfirmation from "@/components/homeowner/BookingConfirmation";
import BookingHistory from "@/components/homeowner/BookingHistory";
import PaymentFlow from "@/components/homeowner/PaymentFlow";
import DisputeFlow from "@/components/homeowner/DisputeFlow";
import PropertyProfile from "@/components/homeowner/PropertyProfile";
import ProviderJobs from "@/components/provider/ProviderJobs";
import ProviderCompletion from "@/components/provider/ProviderCompletion";
import ProviderEarnings from "@/components/provider/ProviderEarnings";
import ProviderSchedule from "@/components/provider/ProviderSchedule";
import ProfileScreen from "@/components/shared/ProfileScreen";
import type { QuoteData } from "@/components/homeowner/AIIntakeChat";

type Screen =
  | "home" | "intake" | "quote" | "booked" | "bookings" | "payment" | "review" | "dispute" | "property" | "profile"
  | "provider-home" | "provider-completion" | "provider-schedule" | "provider-earnings" | "provider-profile";

const Index = () => {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [prevScreen, setPrevScreen] = useState<Screen>("home");
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [currentQuote, setCurrentQuote] = useState<QuoteData | null>(null);
  const [mode, setMode] = useState<"homeowner" | "provider">("homeowner");

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show auth if not logged in
  if (!user) {
    return <Auth />;
  }

  const navigate = (to: Screen) => {
    setPrevScreen(screen);
    setScreen(to);
  };

  const goHome = () => {
    setSelectedService(undefined);
    setCurrentQuote(null);
    navigate(mode === "provider" ? "provider-home" : "home");
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    navigate("intake");
  };

  const handleQuoteReady = (quote: QuoteData) => {
    setCurrentQuote(quote);
    navigate("quote");
  };

  const handleNavigation = (target: string) => {
    if (target.startsWith("provider")) {
      setMode("provider");
    } else {
      setMode("homeowner");
    }
    navigate(target as Screen);
  };

  const getHeaderConfig = (): { title: string; subtitle?: string; onBack?: () => void } | null => {
    switch (screen) {
      case "intake":
        return {
          title: selectedService ? `${selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Service` : "Describe Your Need",
          subtitle: "AI-powered intake",
          onBack: goHome,
        };
      case "quote":
        return { title: "Your Quote", onBack: () => navigate("intake") };
      case "booked":
        return { title: "Confirmation", onBack: goHome };
      case "bookings":
        return { title: "My Bookings" };
      case "payment":
        return { title: "Payment", onBack: () => navigate("bookings") };
      case "dispute":
        return { title: "Report Issue", onBack: () => navigate("bookings") };
      case "property":
        return { title: "My Property" };
      case "profile":
        return { title: "Profile" };
      case "provider-completion":
        return { title: "Complete Job", onBack: () => navigate("provider-home") };
      case "provider-schedule":
        return { title: "Schedule" };
      case "provider-earnings":
        return { title: "Earnings" };
      case "provider-profile":
        return { title: "Profile" };
      default:
        return null;
    }
  };

  const headerConfig = getHeaderConfig();

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background flex flex-col relative">
      {/* Provider top bar */}
      {screen === "provider-home" && (
        <div className="bg-primary px-4 pt-12 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/70 text-sm">Good afternoon</p>
              <h1 className="font-display text-xl font-bold text-primary-foreground">
                {user.phone || "Provider"}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/70 text-xs">Today's earnings</p>
              <p className="text-primary-foreground font-bold text-lg">$0</p>
            </div>
          </div>
          <button
            onClick={() => { setMode("homeowner"); navigate("home"); }}
            className="mt-3 text-xs text-primary-foreground/60 underline"
          >
            Switch to Homeowner View
          </button>
        </div>
      )}

      {headerConfig && <ScreenHeader {...headerConfig} />}

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {screen === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomeScreen
                onServiceSelect={handleServiceSelect}
                onOpenIntake={() => { setSelectedService(undefined); navigate("intake"); }}
                onViewBookings={() => navigate("bookings")}
                onViewProperty={() => navigate("property")}
                onSwitchToProvider={() => { setMode("provider"); navigate("provider-home"); }}
              />
            </motion.div>
          )}

          {screen === "intake" && (
            <motion.div key="intake" initial={{ x: "50%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "50%", opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 h-full flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
              <AIIntakeChat serviceId={selectedService} onQuoteReady={handleQuoteReady} />
            </motion.div>
          )}

          {screen === "quote" && currentQuote && (
            <motion.div key="quote" initial={{ x: "50%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "50%", opacity: 0 }} transition={{ duration: 0.2 }}>
              <QuoteView quote={currentQuote} onBook={() => navigate("booked")} onBack={() => navigate("intake")} />
            </motion.div>
          )}

          {screen === "booked" && currentQuote && (
            <motion.div key="booked" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <BookingConfirmation quote={currentQuote} onViewBookings={() => navigate("bookings")} onHome={goHome} />
            </motion.div>
          )}

          {screen === "bookings" && (
            <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BookingHistory
                onPaymentFlow={() => navigate("payment")}
                onReview={() => navigate("bookings")}
                onDispute={() => navigate("dispute")}
              />
            </motion.div>
          )}

          {screen === "payment" && (
            <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PaymentFlow onComplete={() => navigate("bookings")} />
            </motion.div>
          )}

          {screen === "dispute" && (
            <motion.div key="dispute" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <DisputeFlow onComplete={() => navigate("bookings")} />
            </motion.div>
          )}

          {screen === "property" && (
            <motion.div key="property" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PropertyProfile />
            </motion.div>
          )}

          {screen === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProfileScreen onSwitchMode={() => { setMode("provider"); navigate("provider-home"); }} />
            </motion.div>
          )}

          {screen === "provider-home" && (
            <motion.div key="provider-home" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProviderJobs onCompleteJob={() => navigate("provider-completion")} />
            </motion.div>
          )}

          {screen === "provider-completion" && (
            <motion.div key="provider-completion" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProviderCompletion onDone={() => navigate("provider-home")} />
            </motion.div>
          )}

          {screen === "provider-schedule" && (
            <motion.div key="provider-schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProviderSchedule />
            </motion.div>
          )}

          {screen === "provider-earnings" && (
            <motion.div key="provider-earnings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProviderEarnings />
            </motion.div>
          )}

          {screen === "provider-profile" && (
            <motion.div key="provider-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProfileScreen onSwitchMode={() => { setMode("homeowner"); navigate("home"); }} isProvider />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav active={screen} onNavigate={handleNavigation} mode={mode} />
    </div>
  );
};

export default Index;
