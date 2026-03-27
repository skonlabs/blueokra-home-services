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
import NotificationsDrawer from "@/components/homeowner/NotificationsDrawer";
import ReviewModal from "@/components/homeowner/ReviewModal";
import ProviderJobs from "@/components/provider/ProviderJobs";
import ProviderCompletion from "@/components/provider/ProviderCompletion";
import ProviderEarnings from "@/components/provider/ProviderEarnings";
import ProviderSchedule from "@/components/provider/ProviderSchedule";
import ProfileScreen from "@/components/shared/ProfileScreen";
import type { QuoteData } from "@/components/homeowner/AIIntakeChat";
import { SERVICE_NAMES } from "@/components/homeowner/AIIntakeChat";
import type { IntakeFormData } from "@/lib/quoteCalculator";
import type { Job } from "@/components/provider/ProviderJobs";

type Screen =
  | "home" | "intake" | "quote" | "booked" | "bookings" | "payment" | "dispute" | "property" | "profile"
  | "provider-home" | "provider-completion" | "provider-schedule" | "provider-earnings" | "provider-profile" | "provider-onboarding";

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const Index = () => {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [prevScreen, setPrevScreen] = useState<Screen>("home");
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [currentQuote, setCurrentQuote] = useState<QuoteData | null>(null);
  const [lastIntakeData, setLastIntakeData] = useState<IntakeFormData | null>(null);
  const [mode, setMode] = useState<"homeowner" | "provider">("homeowner");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<Job | null>(null);

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
    setLastIntakeData(null);
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
      case "provider-onboarding":
        return { title: "Get Started", subtitle: "Set up your provider profile", onBack: () => { setMode("homeowner"); navigate("home"); } };
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
              <p className="text-primary-foreground/70 text-sm">{getGreeting()}</p>
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
                
                onOpenNotifications={() => setNotificationsOpen(true)}
                onEmergency={() => { setSelectedService("emergency"); navigate("intake"); }}
                onBookAgain={() => navigate("bookings")}
                onOpenProfile={() => navigate("profile")}
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
              <QuoteView quote={currentQuote} onBook={() => navigate("booked")} onBack={() => navigate("intake")} />
            </motion.div>
          )}

          {screen === "booked" && currentQuote && (
            <motion.div key="booked" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <BookingConfirmation
                quote={currentQuote}
                serviceAddress={lastIntakeData?.serviceAddress}
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
              <ProfileScreen onSwitchMode={() => { setMode("provider"); navigate("provider-home"); }} />
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
              <ProfileScreen onSwitchMode={() => { setMode("homeowner"); navigate("home"); }} isProvider />
            </motion.div>
          )}

          {screen === "provider-onboarding" && (
            <motion.div key="provider-onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProviderOnboarding onComplete={() => { setMode("provider"); navigate("provider-home"); }} />
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
          onSubmit={(rating, comment) => {
            console.log("Review submitted:", rating, comment);
            setReviewBooking(null);
          }}
        />
      )}
    </div>
  );
};

// ─── Provider Onboarding ───────────────────────────────────────────────────────

const ALL_SERVICES = [
  "Lawn Care",
  "House Cleaning",
  "Gutter Cleaning",
  "Roof Cleaning",
  "Pressure Washing",
  "Duct Cleaning",
  "Backwater Testing",
  "Fence Installation",
];

const ProviderOnboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [zipCode, setZipCode] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const inputCls =
    "w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 border border-transparent";

  return (
    <div className="px-4 py-6 pb-24 space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">What services do you offer?</h2>
              <p className="text-sm text-muted-foreground mt-1">Select all that apply</p>
            </div>
            <div className="space-y-2">
              {ALL_SERVICES.map((s) => {
                const checked = selectedServices.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleService(s)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all active:scale-[0.98] ${
                      checked
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border text-foreground"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${checked ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                      {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    {s}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={selectedServices.length === 0}
              className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              Continue →
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">What's your service area?</h2>
              <p className="text-sm text-muted-foreground mt-1">We'll match you with nearby jobs</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Primary Zip Code</label>
                <input
                  className={inputCls}
                  placeholder="e.g. 98101"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={5}
                  type="number"
                />
              </div>
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground">We'll show you jobs within <span className="font-medium text-foreground">25 miles</span> of your zip code by default. You can adjust this later.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-5 bg-muted text-muted-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={zipCode.length < 5}
                className="flex-1 bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                Continue →
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Tell customers about yourself</h2>
              <p className="text-sm text-muted-foreground mt-1">A great bio gets more bookings</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Bio</label>
                <textarea
                  className={`${inputCls} resize-none h-28`}
                  placeholder="e.g. Experienced contractor with 10+ years in residential services. Fully licensed and insured."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Starting hourly rate ($)</label>
                <input
                  className={inputCls}
                  placeholder="e.g. 65"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="px-5 bg-muted text-muted-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform"
              >
                ← Back
              </button>
              <button
                onClick={onComplete}
                disabled={!bio.trim() || !hourlyRate.trim()}
                className="flex-1 bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                Launch My Profile 🎉
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
