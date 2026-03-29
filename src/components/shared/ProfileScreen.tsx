import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bell, HelpCircle, Lock, FileText, ChevronRight, ChevronDown, Loader2, Check, Wrench, Smartphone, CheckCircle2, Camera, Home } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileScreenProps {
  isProvider?: boolean;
  onNavigateProperty?: () => void;
}

type Section = "account" | "venmo" | "notifications" | "help" | "privacy" | "terms" | "properties" | null;

const ProfileScreen = ({ isProvider, onNavigateProperty }: ProfileScreenProps) => {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<Section>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  // Account Settings
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [venmoPhone, setVenmoPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Notification prefs (stored in localStorage)
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);


  // Load venmo_phone and profile photo from DB
  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("venmo_phone, profile_photo_url").eq("user_id", user.id).single().then(({ data }) => {
        if (data?.venmo_phone) setVenmoPhone(data.venmo_phone);
        if (data?.profile_photo_url) setProfilePhotoUrl(data.profile_photo_url);
      });
    }
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("profile-pictures").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("profile-pictures").getPublicUrl(path);
      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").upsert({ user_id: user.id, profile_photo_url: photoUrl } as any, { onConflict: "user_id" });
      setProfilePhotoUrl(photoUrl);
      await refreshProfile();
      toast({ title: "Profile photo updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Provider Venmo phone
  const providerVenmoPhone = venmoPhone || profile?.phone || user?.phone || "";

  // Extract phone from fake email if profile.phone is not set
  const extractedPhone = (() => {
    if (profile?.phone) return profile.phone;
    const email = user?.email;
    if (email?.endsWith("@blueokra.local")) {
      const digits = email.replace("@blueokra.local", "");
      if (digits.length === 11 && digits.startsWith("1")) {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      return digits;
    }
    return user?.phone || "";
  })();

  const shownName = profile?.display_name
    || (profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : null)
    || extractedPhone
    || "User";

  const toggle = (s: Section) => setActiveSection(prev => prev === s ? null : s);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    setProfileError("");
    try {
      const upsertData: Record<string, string | null> = {
        user_id: user.id,
        display_name: displayName.trim() || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      };
      if (isProvider && venmoPhone.trim()) {
        upsertData.venmo_phone = venmoPhone.trim();
      }
      const { error } = await supabase.from("profiles").upsert(upsertData as any, { onConflict: "user_id" });
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

  const menuItems: { key: Section; label: string; icon: React.ComponentType<{ className?: string }>; badge?: React.ReactNode }[] = [
    { key: "account", label: "Account Settings", icon: User },
    ...(isProvider ? [{
      key: "venmo" as Section,
      label: "Venmo Payouts",
      icon: Smartphone,
      badge: venmoPhone
        ? <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
        : <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />,
    }] : []),
    ...(!isProvider ? [{ key: "properties" as Section, label: "My Properties", icon: Home }] : []),
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "help", label: "Help & Support", icon: HelpCircle },
    { key: "privacy", label: "Privacy Policy", icon: Lock },
    { key: "terms", label: "Terms of Service", icon: FileText },
  ];

  return (
    <div className="px-4 py-6 pb-24 space-y-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : isProvider ? (
              <Wrench className="w-7 h-7 text-primary" />
            ) : (
              <User className="w-7 h-7 text-primary" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">{shownName}</h2>
          <p className="text-sm text-muted-foreground">{extractedPhone}</p>
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
                {item.badge && <span className="shrink-0">{item.badge}</span>}
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
                            <label className="block text-xs text-muted-foreground mb-1.5">Phone (sign-up)</label>
                            <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={extractedPhone} readOnly />
                          </div>
                          {isProvider && (
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1.5">Venmo phone (receives payment)</label>
                              <input
                                className={inputCls}
                                value={venmoPhone}
                                onChange={e => setVenmoPhone(e.target.value)}
                                placeholder="Phone number linked to your Venmo"
                                inputMode="tel"
                              />
                              <p className="text-[11px] text-muted-foreground mt-1">BlueOkra will send your earnings to this Venmo number</p>
                            </div>
                          )}
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

                      {/* VENMO PAYOUTS (Provider only) */}
                      {item.key === "venmo" && (
                        <div className="space-y-3">
                          {venmoPhone ? (
                            <div className="flex items-center gap-2 bg-secondary/10 rounded-xl p-3">
                              <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground">Venmo payouts enabled</p>
                                <p className="text-xs text-muted-foreground">Earnings will be sent to <span className="font-semibold">{venmoPhone}</span></p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-destructive/10 rounded-xl p-3">
                              <Smartphone className="w-5 h-5 text-destructive shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground">Venmo phone not set</p>
                                <p className="text-xs text-muted-foreground">Go to Account Settings to add your Venmo phone number.</p>
                              </div>
                            </div>
                          )}
                          <div className="bg-muted rounded-xl p-3 space-y-1.5 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground text-sm">How payouts work</p>
                            <p>1. Customer pays BlueOkra directly (card, debit, etc.)</p>
                            <p>2. After service is confirmed complete, admin releases payment</p>
                            <p>3. BlueOkra sends your earnings to your Venmo</p>
                          </div>
                        </div>
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
                              <Switch checked={value} onCheckedChange={set} />
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

                      {/* MY PROPERTIES (Homeowner only) */}
                      {item.key === "properties" && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Manage your properties, appliances and warranties.</p>
                          <button
                            onClick={() => onNavigateProperty?.()}
                            className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                          >
                            <Home className="w-4 h-4" /> View My Properties
                          </button>
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
