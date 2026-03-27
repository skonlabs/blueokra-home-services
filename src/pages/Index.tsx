import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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
import type { QuoteData } from "@/components/homeowner/AIIntakeChat";
import type { Job } from "@/components/provider/ProviderJobs";

type Screen =
  | "home" | "intake" | "quote" | "booked" | "bookings" | "payment" | "dispute" | "property" | "profile"
  | "provider-home" | "provider-completion" | "provider-schedule" | "provider-earnings" | "provider-profile" | "provider-onboarding";

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [prevScreen, setPrevScreen] = useState<Screen>("home");
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [currentQuote, setCurrentQuote] = useState<QuoteData | null>(null);
  const [mode, setMode] = useState<"homeowner" | "provider">("homeowner");

  // New state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<any>(null);

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

  const isProvider = screen.startsWith("provider");

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
              <h1 className="font-display text-xl font-bold text-primary-foreground">Mike's Services</h1>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/70 text-xs">Today's earnings</p>
              <p className="text-primary-foreground font-bold text-lg">$505</p>
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

      {/* Header for non-home screens */}
      {headerConfig && <ScreenHeader {...headerConfig} />}

      {/* Content */}
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
              <PropertyProfile
                onScheduleService={(applianceName) => { setSelectedService("hvac"); navigate("intake"); }}
                onRebook={(serviceId) => { setSelectedService(serviceId); navigate("intake"); }}
              />
            </motion.div>
          )}

          {screen === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProfileScreen onSwitchMode={() => { setMode("provider"); navigate("provider-home"); }} />
            </motion.div>
          )}

          {/* Provider screens */}
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

      {/* Bottom Nav */}
      <BottomNav
        active={screen}
        onNavigate={handleNavigation}
        mode={mode}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onPaymentAction={() => { setNotificationsOpen(false); navigate("payment"); }}
      />

      {/* Review Modal */}
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

// ─── Profile Screen ────────────────────────────────────────────────────────────

type SettingsView =
  | "menu"
  | "account"
  | "payment"
  | "notifications"
  | "help"
  | "privacy"
  | "terms";

const ProfileScreen = ({
  onSwitchMode,
  isProvider,
}: {
  onSwitchMode: () => void;
  isProvider?: boolean;
}) => {
  const [settingsView, setSettingsView] = useState<SettingsView>("menu");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const back = () => setSettingsView("menu");

  // ── Account Settings ──────────────────────────────────────────────────────
  if (settingsView === "account") {
    return (
      <div className="px-4 py-6 pb-24 space-y-4">
        <button onClick={back} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          ← Account Settings
        </button>
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
            <input
              defaultValue={isProvider ? "Mike Johnson" : "Alex Thompson"}
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Email</label>
            <input
              defaultValue={isProvider ? "mike@example.com" : "alex@example.com"}
              type="email"
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Booking updates and receipts</p>
            </div>
            <button
              onClick={() => setPushEnabled((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative ${pushEnabled ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${pushEnabled ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
        <button className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform">
          Save Changes
        </button>
      </div>
    );
  }

  // ── Payment Methods ───────────────────────────────────────────────────────
  if (settingsView === "payment") {
    return (
      <div className="px-4 py-6 pb-24 space-y-4">
        <button onClick={back} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          ← Payment Methods
        </button>
        <div className="space-y-2">
          <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">VISA</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Visa ••4242</p>
              <p className="text-xs text-muted-foreground">Expires 08/27</p>
            </div>
            <span className="text-[11px] bg-okra-50 text-okra-600 px-2 py-0.5 rounded-full font-medium">Default</span>
          </div>
        </div>
        <button
          onClick={() => alert("Add card flow coming soon")}
          className="w-full border-2 border-dashed border-border rounded-2xl py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          + Add Card
        </button>
      </div>
    );
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  if (settingsView === "notifications") {
    return (
      <div className="px-4 py-6 pb-24 space-y-4">
        <button onClick={back} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          ← Notifications
        </button>
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          {[
            { label: "Push Notifications", desc: "Job updates and reminders" },
            { label: "SMS Alerts", desc: "Provider on the way" },
            { label: "Promotional Emails", desc: "Deals and seasonal tips" },
          ].map((item) => {
            const [on, setOn] = useState(true);
            return (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  onClick={() => setOn((v) => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Help & Support ────────────────────────────────────────────────────────
  if (settingsView === "help") {
    const faqs = [
      { q: "How do I cancel a booking?", a: "Go to My Bookings, tap the booking, then tap Cancel. Cancellations more than 24hrs before are free." },
      { q: "How do I contact my provider?", a: "Once booked, you'll see a message button on the booking card. Tap it to open the chat." },
      { q: "What if I'm not happy with the service?", a: "Tap 'Report Issue' on the completed booking to open a dispute. We'll resolve it within 48 hours." },
      { q: "How do I add a second property?", a: "Go to My Property and tap 'Add Another Property' to register a new address." },
    ];
    return (
      <div className="px-4 py-6 pb-24 space-y-4">
        <button onClick={back} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          ← Help & Support
        </button>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-foreground">{faq.q}</span>
                <span className="text-muted-foreground text-lg leading-none">{openFaq === i ? "−" : "+"}</span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="bg-muted rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Still need help?</p>
          <button className="mt-2 text-sm font-medium text-primary underline">Email support@blueokra.com</button>
        </div>
      </div>
    );
  }

  // ── Privacy Policy ────────────────────────────────────────────────────────
  if (settingsView === "privacy") {
    return (
      <div className="px-4 py-6 pb-24 space-y-4">
        <button onClick={back} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          ← Privacy Policy
        </button>
        <div className="bg-card rounded-2xl border border-border p-4 max-h-[60vh] overflow-y-auto space-y-3">
          <h3 className="font-semibold text-foreground">Privacy Policy</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">Last updated: January 1, 2026</p>
          <p className="text-sm text-foreground font-medium">1. Information We Collect</p>
          <p className="text-sm text-muted-foreground leading-relaxed">We collect information you provide directly to us when you create an account, book a service, or contact us for support. This includes your name, email address, phone number, home address, and payment information.</p>
          <p className="text-sm text-foreground font-medium">2. How We Use Your Information</p>
          <p className="text-sm text-muted-foreground leading-relaxed">We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.</p>
          <p className="text-sm text-foreground font-medium">3. Information Sharing</p>
          <p className="text-sm text-muted-foreground leading-relaxed">We share your information with service providers only as necessary to fulfill your bookings. We do not sell your personal data to third parties.</p>
          <p className="text-sm text-foreground font-medium">4. Data Security</p>
          <p className="text-sm text-muted-foreground leading-relaxed">We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          <p className="text-sm text-foreground font-medium">5. Contact Us</p>
          <p className="text-sm text-muted-foreground leading-relaxed">If you have questions about this Privacy Policy, please contact us at privacy@blueokra.com.</p>
        </div>
      </div>
    );
  }

  // ── Terms of Service ──────────────────────────────────────────────────────
  if (settingsView === "terms") {
    return (
      <div className="px-4 py-6 pb-24 space-y-4">
        <button onClick={back} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          ← Terms of Service
        </button>
        <div className="bg-card rounded-2xl border border-border p-4 max-h-[60vh] overflow-y-auto space-y-3">
          <h3 className="font-semibold text-foreground">Terms of Service</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">Last updated: January 1, 2026</p>
          <p className="text-sm text-foreground font-medium">1. Acceptance of Terms</p>
          <p className="text-sm text-muted-foreground leading-relaxed">By accessing or using BlueOkra, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          <p className="text-sm text-foreground font-medium">2. Use of Service</p>
          <p className="text-sm text-muted-foreground leading-relaxed">BlueOkra provides a platform connecting homeowners with service providers. We do not directly provide home services and are not responsible for the quality of services provided by third-party providers.</p>
          <p className="text-sm text-foreground font-medium">3. Payments and Refunds</p>
          <p className="text-sm text-muted-foreground leading-relaxed">Payments are processed securely through our platform. Refunds are handled on a case-by-case basis through our dispute resolution process.</p>
          <p className="text-sm text-foreground font-medium">4. Cancellation Policy</p>
          <p className="text-sm text-muted-foreground leading-relaxed">Cancellations made more than 24 hours before the scheduled service are free. Late cancellations may incur a fee of up to 50% of the booking value.</p>
          <p className="text-sm text-foreground font-medium">5. Limitation of Liability</p>
          <p className="text-sm text-muted-foreground leading-relaxed">BlueOkra shall not be liable for any indirect, incidental, or consequential damages arising from your use of our platform or services.</p>
        </div>
      </div>
    );
  }

  // ── Menu (default) ────────────────────────────────────────────────────────
  const menuItems: { label: string; view: SettingsView }[] = [
    { label: "Account Settings", view: "account" },
    { label: "Payment Methods", view: "payment" },
    { label: "Notifications", view: "notifications" },
    { label: "Help & Support", view: "help" },
    { label: "Privacy Policy", view: "privacy" },
    { label: "Terms of Service", view: "terms" },
  ];

  return (
    <div className="px-4 py-6 pb-24 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-2xl">{isProvider ? "👷" : "👤"}</span>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">{isProvider ? "Mike Johnson" : "Alex Thompson"}</h2>
          <p className="text-sm text-muted-foreground">{isProvider ? "Provider since 2022" : "Member since 2023"}</p>
        </div>
      </div>

      <div className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setSettingsView(item.view)}
            className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-3.5 text-sm text-foreground text-left active:scale-[0.98] transition-transform"
          >
            {item.label}
            <span className="text-muted-foreground">→</span>
          </button>
        ))}
      </div>

      <button
        onClick={onSwitchMode}
        className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform"
      >
        Switch to {isProvider ? "Homeowner" : "Provider"} Mode
      </button>

      <button onClick={handleSignOut} className="w-full text-destructive text-sm py-2">
        Sign Out
      </button>
    </div>
  );
};

// ─── Provider Onboarding ───────────────────────────────────────────────────────

const ALL_SERVICES = [
  "Lawn Mowing",
  "HVAC Maintenance",
  "Plumbing",
  "Electrical",
  "Pressure Washing",
  "Gutter Cleaning",
  "Painting",
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
