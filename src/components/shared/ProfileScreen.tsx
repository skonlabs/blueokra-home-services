import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, CreditCard, Bell, HelpCircle, Lock, FileText, ChevronRight, ChevronDown, Loader2, Check, Plus, Trash2, Wrench, Building2, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProfileScreenProps {
  isProvider?: boolean;
}

type Section = "account" | "payment" | "bank" | "notifications" | "help" | "privacy" | "terms" | null;

const ProfileScreen = ({ isProvider }: ProfileScreenProps) => {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>(null);

  // Account Settings
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Notification prefs (stored in localStorage)
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  // Payment methods (mock — for homeowners)
  const [paymentMethods] = useState([
    { id: "1", last4: "4242", brand: "Visa", exp: "12/26" },
  ]);
  const [showAddCard, setShowAddCard] = useState(false);

  // Stripe Connect state (for providers)
  const [connectStatus, setConnectStatus] = useState<"loading" | "not_created" | "pending" | "active">("loading");
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    if (isProvider && user) {
      checkConnectStatus();
    }
  }, [isProvider, user]);

  const checkConnectStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect", {
        body: { action: "check_status" },
      });
      if (error) throw error;
      setConnectStatus(data.status || "not_created");
    } catch {
      setConnectStatus("not_created");
    }
  };

  const handleStripeConnect = async () => {
    setConnectLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect", {
        body: { action: "create_account" },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Stripe Connect error:", err);
    } finally {
      setConnectLoading(false);
    }
  };

  const shownName = profile?.display_name
    || (profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : null)
    || user?.phone
    || "User";

  const toggle = (s: Section) => setActiveSection(prev => prev === s ? null : s);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    setProfileError("");
    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        display_name: displayName.trim() || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      }, { onConflict: "user_id" });
      if (error) throw error;
      await refreshProfile();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      const { handleMutationError } = await import("@/lib/errorHandler");
      const friendly = await handleMutationError(err, "save_profile", user.id);
      setProfileError(friendly);
    } finally {
      setSavingProfile(false);
    }
  };

  const inputCls = "w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent text-foreground";

  const menuItems: { key: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "account", label: "Account Settings", icon: User },
    { key: "payment", label: "Payment Methods", icon: CreditCard },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "help", label: "Help & Support", icon: HelpCircle },
    { key: "privacy", label: "Privacy Policy", icon: Lock },
    { key: "terms", label: "Terms of Service", icon: FileText },
  ];

  return (
    <div className="px-4 py-6 pb-24 space-y-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {isProvider ? <Wrench className="w-7 h-7 text-primary" /> : <User className="w-7 h-7 text-primary" />}
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">{shownName}</h2>
          <p className="text-sm text-muted-foreground">{user?.phone || ""}</p>
          {isProvider && (
            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Provider</span>
          )}
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2">
        {menuItems.map((item) => {
          const isOpen = activeSection === item.key;
          return (
            <div key={item.key} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => toggle(item.key)}
                className="w-full flex items-center gap-3 p-3.5 text-sm text-foreground text-left"
              >
                <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="flex-1 font-medium">{item.label}</span>
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                }
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">

                      {/* ACCOUNT SETTINGS */}
                      {item.key === "account" && (
                        <>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1.5">Display name</label>
                            <input className={inputCls} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How your name appears" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1.5">First name</label>
                              <input className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First" />
                            </div>
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1.5">Last name</label>
                              <input className={inputCls} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1.5">Phone</label>
                            <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={user?.phone || ""} readOnly />
                          </div>
                          {profileError && <p className="text-xs text-destructive">{profileError}</p>}
                          <button
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSaved ? <Check className="w-4 h-4" /> : null}
                            {profileSaved ? "Saved!" : "Save Changes"}
                          </button>
                        </>
                      )}

                      {/* PAYMENT METHODS */}
                      {item.key === "payment" && (
                        <>
                          <p className="text-xs text-muted-foreground">Your payment is collected only after service is complete.</p>
                          {paymentMethods.map(pm => (
                            <div key={pm.id} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2.5">
                              <div>
                                <p className="text-sm font-medium text-foreground">{pm.brand} •••• {pm.last4}</p>
                                <p className="text-xs text-muted-foreground">Expires {pm.exp}</p>
                              </div>
                              <button className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {showAddCard ? (
                            <div className="space-y-2">
                              <input className={inputCls} placeholder="Card number" maxLength={19} />
                              <div className="grid grid-cols-2 gap-2">
                                <input className={inputCls} placeholder="MM/YY" maxLength={5} />
                                <input className={inputCls} placeholder="CVV" maxLength={4} type="password" />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setShowAddCard(false)} className="flex-1 bg-muted text-foreground py-2 rounded-xl text-sm font-medium">Cancel</button>
                                <button
                                  onClick={() => setShowAddCard(false)}
                                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-xl text-sm font-medium"
                                >
                                  Add Card
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowAddCard(true)}
                              className="w-full flex items-center justify-center gap-2 bg-muted rounded-xl py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Plus className="w-4 h-4" /> Add Payment Method
                            </button>
                          )}
                        </>
                      )}

                      {/* NOTIFICATIONS */}
                      {item.key === "notifications" && (
                        <>
                          {[
                            { label: "Booking updates", sublabel: "Confirmations, status changes", value: notifBookings, set: setNotifBookings },
                            { label: "Reminders", sublabel: "Upcoming appointments", value: notifReminders, set: setNotifReminders },
                            { label: "Promotions", sublabel: "Deals and seasonal offers", value: notifPromos, set: setNotifPromos },
                          ].map(({ label, sublabel, value, set }) => (
                            <div key={label} className="flex items-center justify-between py-1">
                              <div>
                                <p className="text-sm font-medium text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground">{sublabel}</p>
                              </div>
                              <button
                                onClick={() => set(!value)}
                                className={`w-10 h-6 rounded-full transition-colors relative ${value ? "bg-primary" : "bg-muted"}`}
                              >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-1"}`} />
                              </button>
                            </div>
                          ))}
                        </>
                      )}

                      {/* HELP & SUPPORT */}
                      {item.key === "help" && (
                        <div className="space-y-3">
                          {[
                            { q: "How does pay-after-service work?", a: "You're only charged once your provider marks the job complete and you confirm satisfaction. No upfront payment required." },
                            { q: "How do I cancel a booking?", a: "Go to My Bookings, select the booking, and tap Cancel. Cancellations must be made at least 2 hours before the scheduled time." },
                            { q: "What if I'm not satisfied?", a: "Use the Dispute button on your completed booking. Our team reviews all disputes within 24 hours." },
                            { q: "How are providers vetted?", a: "All providers are background-checked, licensed (where required), and reviewed by previous customers before joining." },
                          ].map(({ q, a }) => (
                            <div key={q} className="bg-muted rounded-xl p-3">
                              <p className="text-xs font-semibold text-foreground mb-1">{q}</p>
                              <p className="text-xs text-muted-foreground">{a}</p>
                            </div>
                          ))}
                          <div className="bg-okra-50 rounded-xl p-3 border border-okra-100">
                            <p className="text-xs font-medium text-foreground mb-1">Still need help?</p>
                            <p className="text-xs text-muted-foreground">Email us at <span className="text-primary font-medium">support@blueokra.com</span></p>
                          </div>
                        </div>
                      )}

                      {/* PRIVACY POLICY */}
                      {item.key === "privacy" && (
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground text-sm">Privacy Policy</p>
                          <p>BlueOkra collects your phone number and service details to connect you with local providers. We never sell your data.</p>
                          <p><strong className="text-foreground">Data collected:</strong> Phone number, service addresses, booking history, payment method (last 4 digits only).</p>
                          <p><strong className="text-foreground">Data sharing:</strong> Your service address and name are shared only with your assigned provider. We do not sell personal data to third parties.</p>
                          <p><strong className="text-foreground">Data retention:</strong> Your data is retained for up to 3 years after account closure for tax and legal purposes.</p>
                          <p><strong className="text-foreground">Your rights:</strong> Request data deletion by emailing privacy@blueokra.com. We'll process requests within 30 days.</p>
                          <p className="text-[11px]">Last updated: January 2025</p>
                        </div>
                      )}

                      {/* TERMS OF SERVICE */}
                      {item.key === "terms" && (
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground text-sm">Terms of Service</p>
                          <p><strong className="text-foreground">Service:</strong> BlueOkra is a marketplace connecting homeowners with independent service providers. We are not responsible for the quality of services provided by third-party providers.</p>
                          <p><strong className="text-foreground">Payment:</strong> Payments are processed after service completion. BlueOkra charges a platform fee to providers. You will only be charged the quoted amount unless you authorize additional work.</p>
                          <p><strong className="text-foreground">Disputes:</strong> All disputes must be filed within 48 hours of service completion. BlueOkra's dispute decision is final.</p>
                          <p><strong className="text-foreground">Cancellations:</strong> Cancellations within 2 hours of scheduled service may incur a $25 cancellation fee.</p>
                          <p><strong className="text-foreground">Liability:</strong> BlueOkra's maximum liability is limited to the amount paid for the disputed service.</p>
                          <p className="text-[11px]">Last updated: January 2025</p>
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <button
        onClick={signOut}
        className="w-full text-destructive text-sm py-2"
      >
        Sign Out
      </button>
    </div>
  );
};

export default ProfileScreen;
