import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Bell, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import NotificationsDrawer from "@/components/homeowner/NotificationsDrawer";
import ReviewModal from "@/components/homeowner/ReviewModal";
import ProviderHome from "@/components/provider/ProviderHome";
import ProviderJobs from "@/components/provider/ProviderJobs";
import ProviderCompletion from "@/components/provider/ProviderCompletion";
import ProviderEarnings from "@/components/provider/ProviderEarnings";
import ProviderSchedule from "@/components/provider/ProviderSchedule";
import ProfileScreen from "@/components/shared/ProfileScreen";
import RegistrationFlow from "@/components/RegistrationFlow";
import type { QuoteData } from "@/components/homeowner/AIIntakeChat";
import { SERVICE_NAMES } from "@/components/homeowner/AIIntakeChat";
import type { ScheduleData } from "@/components/homeowner/QuoteView";
import type { IntakeFormData } from "@/lib/quoteCalculator";
import type { Job } from "@/components/provider/ProviderJobs";

type Screen =
  | "home" | "intake" | "quote" | "booked" | "bookings" | "payment" | "dispute" | "property" | "profile"
  | "provider-home" | "provider-completion" | "provider-schedule" | "provider-earnings" | "provider-profile";

const Index = () => {
  const { user, loading, roles, refreshProfile } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [currentQuote, setCurrentQuote] = useState<QuoteData | null>(null);
  const [lastIntakeData, setLastIntakeData] = useState<IntakeFormData | null>(null);
  const [bookingSchedule, setBookingSchedule] = useState<ScheduleData | null>(null);
  const [mode, setMode] = useState<"homeowner" | "provider">("homeowner");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<Job | null>(null);

  // Set mode based on user role
  useEffect(() => {
    if (roles.length === 0) return; // still loading or onboarding
    if (roles.includes("provider") && !roles.includes("homeowner")) {
      setMode("provider");
      setScreen("provider-home");
    } else {
      setMode("homeowner");
      setScreen("home");
    }
  }, [roles]);

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

  // Show registration flow for new users (no role assigned yet)
  if (roles.length === 0) {
    return (
      <RegistrationFlow
        onComplete={async () => {
          await refreshProfile();
          // After refresh, the useEffect above will set the correct mode
        }}
      />
    );
  }

  const isProvider = roles.includes("provider");

  const navigate = (to: Screen) => {
    setScreen(to);
  };

  const goHome = () => {
    setSelectedService(undefined);
    setCurrentQuote(null);
    setLastIntakeData(null);
    setBookingSchedule(null);
    navigate(isProvider ? "provider-home" : "home");
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    navigate("intake");
  };

  const handleQuoteReady = (quote: QuoteData) => {
    setCurrentQuote(quote);
    setSelectedService(quote.serviceId);
    navigate("quote");
  };

  const handleBook = (schedule: ScheduleData) => {
    setBookingSchedule(schedule);
    navigate("booked");
  };

  const handleNavigation = (target: string) => {
    navigate(target as Screen);
  };

  const getHeaderConfig = (): { title: string; subtitle?: string; onBack?: () => void } | null => {
    switch (screen) {
      case "intake":
        return {
          title: selectedService ? (SERVICE_NAMES[selectedService] ?? selectedService) : "Describe Your Need",
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

  // Always-visible header right actions: bell + profile
  const headerRightActions = (
    <div className="flex gap-2">
      <button
        onClick={() => setNotificationsOpen(true)}
        className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground relative"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-background" />
      </button>
      <button
        onClick={() => navigate(isProvider ? "provider-profile" : "profile")}
        className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
      >
        <User className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background flex flex-col relative">
      <ScreenHeader
        title={headerConfig?.title}
        onBack={headerConfig?.onBack}
        rightActions={headerRightActions}
      />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {screen === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomeScreen
                onServiceSelect={handleServiceSelect}
                onOpenIntake={() => { setSelectedService(undefined); navigate("intake"); }}
                onViewBookings={() => navigate("bookings")}
                onViewProperty={() => navigate("property")}
                onBookAgain={() => navigate("bookings")}
                onRebook={(id) => { setSelectedService(id); navigate("intake"); }}
              />
            </motion.div>
          )}

          {screen === "intake" && (
            <motion.div key="intake" initial={{ x: "50%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "50%", opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 h-full flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
              <AIIntakeChat
                serviceId={selectedService}
                onQuoteReady={handleQuoteReady}
                initialFormData={lastIntakeData ?? undefined}
                onIntakeDataSaved={setLastIntakeData}
              />
            </motion.div>
          )}

          {screen === "quote" && currentQuote && (
            <motion.div key="quote" initial={{ x: "50%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "50%", opacity: 0 }} transition={{ duration: 0.2 }}>
              <QuoteView
                quote={currentQuote}
                serviceAddress={lastIntakeData?.serviceAddress}
                onBook={handleBook}
                onBack={() => navigate("intake")}
              />
            </motion.div>
          )}

          {screen === "booked" && currentQuote && (
            <motion.div key="booked" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <BookingConfirmation
                quote={currentQuote}
                serviceAddress={lastIntakeData?.serviceAddress}
                scheduleData={bookingSchedule ?? undefined}
                intakeData={lastIntakeData ?? undefined}
                onViewBookings={() => navigate("bookings")}
                onHome={goHome}
              />
            </motion.div>
          )}

          {screen === "bookings" && (
            <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BookingHistory
                onPaymentFlow={() => navigate("payment")}
                onReview={(booking) => { setReviewBooking(booking); }}
                onDispute={() => navigate("dispute")}
                onRebook={(serviceId) => { setSelectedService(serviceId); navigate("intake"); }}
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
              <ProfileScreen isProvider={isProvider} />
            </motion.div>
          )}

          {screen === "provider-home" && (
            <motion.div key="provider-home" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProviderJobs
                onCompleteJob={(job) => { setSelectedJobForCompletion(job); navigate("provider-completion"); }}
              />
            </motion.div>
          )}

          {screen === "provider-completion" && (
            <motion.div key="provider-completion" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProviderCompletion job={selectedJobForCompletion} onDone={() => { setSelectedJobForCompletion(null); navigate("provider-home"); }} />
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
              <ProfileScreen isProvider />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav active={screen} onNavigate={handleNavigation} mode={mode} />

      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onPaymentAction={() => { setNotificationsOpen(false); navigate("payment"); }}
      />

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmit={async (rating, comment) => {
            if (user && reviewBooking.provider_user_id) {
              const { error } = await supabase.from("reviews").insert({
                homeowner_id: user.id,
                provider_id: reviewBooking.provider_user_id,
                rating,
                comments: comment || null,
                reviewed_by: user.id,
              });
              if (error) {
                const { handleMutationError } = await import("@/lib/errorHandler");
                await handleMutationError(error, "submit_review", user.id);
              }
            }
            setReviewBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;
