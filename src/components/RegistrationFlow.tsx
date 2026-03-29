import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Wrench, Building2, User, ChevronRight, Check, Loader2, MapPin, PartyPopper, Smartphone, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import blueokraLogo from "@/assets/blueokra-logo.svg";
import AddressInput, { type AddressParts } from "@/components/homeowner/AddressInput";

interface RegistrationFlowProps {
  onComplete: () => void;
}

const AVAILABLE_SERVICES = [
  { name: "Lawn Care", description: "Mowing, trimming, edging, fertilizing, and seasonal yard clean-ups" },
  { name: "House Cleaning", description: "Deep cleaning, recurring maintenance, move-in/move-out cleans" },
  { name: "Gutter Cleaning", description: "Debris removal, downspout flushing, gutter guard installation" },
  { name: "Roof Cleaning", description: "Moss & algae treatment, debris removal, soft washing" },
  { name: "Pressure Washing", description: "Driveways, siding, decks, patios, and concrete surfaces" },
  { name: "Duct Cleaning", description: "HVAC duct cleaning, dryer vent cleaning, air quality improvement" },
  { name: "Backwater Testing", description: "Valve testing, certification, repair & compliance inspections" },
  { name: "Fence Installation", description: "Wood, vinyl & chain-link fencing, repairs, staining & sealing" },
];

const inputCls =
  "w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 border border-transparent";

type Step = "role" | "homeowner-address" | "provider-details";

const RegistrationFlow = forwardRef<HTMLDivElement, RegistrationFlowProps>(({ onComplete }, ref) => {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<"homeowner" | "provider" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Shared fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Homeowner-specific fields
  const [homeAddress, setHomeAddress] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [homeState, setHomeState] = useState("");
  const [homeZip, setHomeZip] = useState("");

  // Provider-specific fields
  const [providerType, setProviderType] = useState<"individual" | "company" | null>(null);
  const [providerStep, setProviderStep] = useState(1); // 1=type, 2=services, 3=details
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isBonded, setIsBonded] = useState(false);
  const [bondNumber, setBondNumber] = useState("");
  const [isLicensed, setIsLicensed] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  // Venmo phone (step 4)
  const [venmoPhone, setVenmoPhone] = useState("");
  const [venmoOtpSent, setVenmoOtpSent] = useState(false);
  const [venmoOtp, setVenmoOtp] = useState("");
  const [venmoVerified, setVenmoVerified] = useState(false);
  const [venmoSending, setVenmoSending] = useState(false);
  const [venmoOwnershipAgreed, setVenmoOwnershipAgreed] = useState(false);

  const [expandedService, setExpandedService] = useState<string | null>(null);

  const toggleService = (s: string) => {
    setSelectedServices(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  // Venmo phone OTP — bypassed for testing
  const sendVenmoOtp = async () => {
    if (!venmoPhone.trim()) return;
    setVenmoSending(true);
    try {
      // In production, call supabase.rpc("send_otp", { _phone: venmoPhone.trim() })
      // Bypassed for testing: auto-mark as sent
      await new Promise(r => setTimeout(r, 500)); // simulate network
      setVenmoOtpSent(true);
      // Auto-verify bypass for testing
      setVenmoVerified(true);
    } catch {
      setError("Failed to send verification code");
    } finally {
      setVenmoSending(false);
    }
  };

  const verifyVenmoOtp = async () => {
    // Bypassed for testing: any code is accepted
    setVenmoVerified(true);
  };

  const saveHomeowner = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      // Insert homeowner role via RPC (bypasses RLS safely)
      const { error: roleError } = await supabase.rpc("add_user_role", {
        _user_id: user.id,
        _role: "homeowner",
      });
      if (roleError) throw roleError;

      // Extract phone from fake email for display purposes
      const signupPhone = user.email?.replace("@blueokra.local", "").replace(/^(\d{1})(\d{3})(\d{3})(\d{4})$/, "+$1 ($2) $3-$4") || null;

      // Upsert profile with address info
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        display_name: firstName.trim() ? `${firstName.trim()} ${lastName.trim()}`.trim() : null,
        phone: signupPhone,
        address: homeAddress.trim() || null,
        city: homeCity.trim() || null,
        state: homeState.trim() || null,
        zip_code: homeZip.trim() || null,
      }, { onConflict: "user_id" });
      if (profileError) throw profileError;

      // Also save home address if provided
      if (homeAddress.trim()) {
        await supabase.from("user_homes").insert({
          user_id: user.id,
          address: homeAddress.trim(),
          nickname: "My Home",
          city: homeCity.trim() || null,
          state: homeState.trim() || null,
          zip_code: homeZip.trim() || null,
          is_primary: true,
        });
      }

      await refreshProfile();
      onComplete();
    } catch (err) {
      const { handleMutationError } = await import("@/lib/errorHandler");
      const friendly = await handleMutationError(err, "register_homeowner", user.id);
      setError(friendly);
    } finally {
      setSaving(false);
    }
  };

  const saveProvider = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      // Insert provider role via RPC (bypasses RLS safely)
      const { error: roleError } = await supabase.rpc("add_user_role", {
        _user_id: user.id,
        _role: "provider",
      });
      if (roleError) throw roleError;

      // Extract phone from fake email for display purposes
      const signupPhone = user.email?.replace("@blueokra.local", "").replace(/^(\d{1})(\d{3})(\d{3})(\d{4})$/, "+$1 ($2) $3-$4") || null;

      // Upsert profile with provider details
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: signupPhone,
        company_name: providerType === "company" ? businessName.trim() || null : null,
        display_name: providerType === "company"
          ? businessName.trim() || null
          : firstName.trim() ? `${firstName.trim()} ${lastName.trim()}`.trim() : null,
        address: businessAddress.trim() || null,
        services_offered: selectedServices,
        venmo_phone: venmoPhone.trim() || null,
      } as any, { onConflict: "user_id" });
      if (profileError) throw profileError;

      await refreshProfile();
      onComplete();
    } catch (err) {
      const { handleMutationError } = await import("@/lib/errorHandler");
      const friendly = await handleMutationError(err, "register_provider", user.id);
      setError(friendly);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={ref} className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-md pb-24">
        <div className="flex items-center gap-2.5 mb-8">
          <img src={blueokraLogo} alt="BlueOkra" className="w-8 h-8" />
          <h1 className="font-display text-2xl font-bold text-gradient-primary">BlueOkra<sup className="text-xs font-normal align-super text-primary">®</sup></h1>
        </div>

        <AnimatePresence mode="wait">

          {/* Step 1: Name + Role selection */}
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Welcome to BlueOkra</h2>
                <p className="text-sm text-muted-foreground mt-1">Let's get you set up. How will you be using the app?</p>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">First name *</label>
                  <input className={inputCls} placeholder="First" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Last name *</label>
                  <input className={inputCls} placeholder="Last" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Homeowner */}
                <button
                  onClick={() => setRole("homeowner")}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                    role === "homeowner"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">Homeowner</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Book home services, track appointments, manage your property</p>
                  </div>
                  {role === "homeowner" && <Check className="w-5 h-5 text-primary ml-auto shrink-0" />}
                </button>

                {/* Provider */}
                <button
                  onClick={() => setRole("provider")}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                    role === "provider"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">Service Provider</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Offer services, manage your schedule, receive payments</p>
                  </div>
                  {role === "provider" && <Check className="w-5 h-5 text-primary ml-auto shrink-0" />}
                </button>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <button
                disabled={!role || !firstName.trim() || !lastName.trim() || saving}
                onClick={() => {
                  if (role === "homeowner") setStep("homeowner-address");
                  else if (role === "provider") setStep("provider-details");
                }}
                className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 2 (Homeowner): Address / Property */}
          {step === "homeowner-address" && (
            <motion.div
              key="homeowner-address"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              {/* Progress bar */}
              <div className="flex gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-primary" />
                <div className="flex-1 h-1.5 rounded-full bg-primary" />
              </div>

              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground">Where's your home?</h2>
                <p className="text-sm text-muted-foreground mt-1">We'll use this to find service providers in your area</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Home address</label>
                  <AddressInput
                    value={homeAddress}
                    onChange={(addr, _isWA, parts?: AddressParts) => {
                      setHomeAddress(addr);
                      if (parts) {
                        setHomeCity(parts.city ?? "");
                        setHomeState(parts.state ?? "");
                        setHomeZip(parts.zip ?? "");
                      }
                    }}
                    placeholder="Start typing your address…"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">City</label>
                    <input className={inputCls} placeholder="Seattle" value={homeCity} onChange={e => setHomeCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">State</label>
                    <input className={inputCls} placeholder="WA" value={homeState} onChange={e => setHomeState(e.target.value)} maxLength={2} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">ZIP</label>
                    <input className={inputCls} placeholder="98101" value={homeZip} onChange={e => setHomeZip(e.target.value)} maxLength={10} />
                  </div>
                </div>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("role")}
                  className="px-5 bg-muted text-muted-foreground font-medium py-3 rounded-2xl text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={saveHomeowner}
                  disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Get Started</span><PartyPopper className="w-4 h-4" /></>}
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                You can skip the address and add it later from your property page.
              </p>
            </motion.div>
          )}

          {/* Provider details flow */}
          {step === "provider-details" && (
            <motion.div
              key="provider"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              {/* Progress bar */}
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= providerStep ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* Provider step 1: Individual or Company */}
                {providerStep === 1 && (
                  <motion.div key="p1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">About your business</h2>
                      <p className="text-sm text-muted-foreground mt-1">Tell us how you operate</p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => setProviderType("individual")}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                          providerType === "individual" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">Individual / Sole Proprietor</p>
                          <p className="text-xs text-muted-foreground">I work independently</p>
                        </div>
                        {providerType === "individual" && <Check className="w-4 h-4 text-primary" />}
                      </button>

                      <button
                        onClick={() => setProviderType("company")}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                          providerType === "company" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">Company / Business</p>
                          <p className="text-xs text-muted-foreground">I have a registered business</p>
                        </div>
                        {providerType === "company" && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    </div>

                    {/* Business name (company) */}
                    {providerType === "company" && (
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Business name</label>
                        <input className={inputCls} placeholder="e.g. Pacific NW Services LLC" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                      </div>
                    )}

                    {/* Business address */}
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Business address</label>
                      <AddressInput
                        value={businessAddress}
                        onChange={(addr) => setBusinessAddress(addr)}
                        placeholder="Start typing your business address…"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => { setStep("role"); setProviderStep(1); }} className="px-5 bg-muted text-muted-foreground font-medium py-3 rounded-2xl text-sm">← Back</button>
                      <button
                        onClick={() => setProviderStep(2)}
                        disabled={!providerType}
                        className="flex-1 bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm disabled:opacity-50"
                      >
                        Continue →
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Provider step 2: Services */}
                {providerStep === 2 && (
                  <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">What services do you offer?</h2>
                      <p className="text-sm text-muted-foreground mt-1">Select all that apply</p>
                    </div>
                    <div className="space-y-2">
                      {AVAILABLE_SERVICES.map(s => {
                        const checked = selectedServices.includes(s.name);
                        const expanded = expandedService === s.name;
                        return (
                          <div key={s.name} className={`rounded-xl border transition-all ${checked ? "bg-primary/10 border-primary" : "bg-card border-border"}`}>
                            <div className="flex items-center gap-3 p-3.5">
                              <button
                                onClick={() => toggleService(s.name)}
                                className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0"
                                style={{ borderColor: checked ? "hsl(var(--primary))" : undefined, backgroundColor: checked ? "hsl(var(--primary))" : undefined }}
                              >
                                {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                              </button>
                              <button
                                onClick={() => setExpandedService(expanded ? null : s.name)}
                                className={`flex-1 text-left text-sm font-medium ${checked ? "text-primary" : "text-foreground"}`}
                              >
                                {s.name}
                              </button>
                              <button
                                onClick={() => setExpandedService(expanded ? null : s.name)}
                                className="text-muted-foreground shrink-0"
                              >
                                <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
                              </button>
                            </div>
                            {expanded && (
                              <div className="px-3.5 pb-3 pt-0">
                                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setProviderStep(1)} className="px-5 bg-muted text-muted-foreground font-medium py-3 rounded-2xl text-sm">← Back</button>
                      <button
                        onClick={() => setProviderStep(3)}
                        disabled={selectedServices.length === 0}
                        className="flex-1 bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm disabled:opacity-50"
                      >
                        Continue →
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Provider step 3: License & Bond */}
                {providerStep === 3 && (
                  <motion.div key="p3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">Credentials</h2>
                      <p className="text-sm text-muted-foreground mt-1">Verified credentials build customer trust</p>
                    </div>

                    {/* Licensed */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3 bg-card rounded-xl border border-border px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">Licensed</p>
                          <p className="text-xs text-muted-foreground">Do you hold a state contractor's license?</p>
                        </div>
                        <button
                          onClick={() => setIsLicensed(!isLicensed)}
                          className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${isLicensed ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform ${isLicensed ? "translate-x-5" : "translate-x-1"}`} />
                        </button>
                      </div>
                      {isLicensed && (
                        <input
                          className={inputCls}
                          placeholder="License number (e.g. BLUEO*123BC)"
                          value={licenseNumber}
                          onChange={e => setLicenseNumber(e.target.value)}
                        />
                      )}
                    </div>

                    {/* Bonded */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3 bg-card rounded-xl border border-border px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">Bonded</p>
                          <p className="text-xs text-muted-foreground">Do you carry a surety bond?</p>
                        </div>
                        <button
                          onClick={() => setIsBonded(!isBonded)}
                          className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${isBonded ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform ${isBonded ? "translate-x-5" : "translate-x-1"}`} />
                        </button>
                      </div>
                      {isBonded && (
                        <input
                          className={inputCls}
                          placeholder="Bond number"
                          value={bondNumber}
                          onChange={e => setBondNumber(e.target.value)}
                        />
                      )}
                    </div>

                    {/* Profile photo hint */}
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-xs font-medium text-foreground mb-1">Profile photo / logo</p>
                      <p className="text-[11px] text-muted-foreground">You can upload your photo or company logo from your profile settings after completing registration.</p>
                    </div>

                    {error && <p className="text-xs text-destructive">{error}</p>}

                    <div className="flex gap-2">
                      <button onClick={() => setProviderStep(2)} className="px-5 bg-muted text-muted-foreground font-medium py-3 rounded-2xl text-sm">← Back</button>
                      <button
                        onClick={() => setProviderStep(4)}
                        className="flex-1 bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm"
                      >
                        Continue →
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Provider step 4: Venmo Phone for Payouts */}
                {providerStep === 4 && (
                  <motion.div key="p4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
                        <Smartphone className="w-6 h-6 text-secondary" />
                      </div>
                      <h2 className="font-display text-xl font-bold text-foreground">Payment Setup</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter the phone number linked to your Venmo account. BlueOkra will send your earnings to this number.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Venmo phone number</label>
                      <div className="flex gap-2">
                        <input
                          className={`${inputCls} flex-1`}
                          value={venmoPhone}
                          onChange={e => { setVenmoPhone(e.target.value); setVenmoVerified(false); setVenmoOtpSent(false); }}
                          placeholder="(555) 123-4567"
                          inputMode="tel"
                          disabled={venmoVerified}
                        />
                        {!venmoVerified && (
                          <button
                            onClick={sendVenmoOtp}
                            disabled={!venmoPhone.trim() || venmoSending}
                            className="px-4 bg-primary text-primary-foreground font-medium rounded-xl text-sm disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                          >
                            {venmoSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : venmoOtpSent ? "Resend" : "Verify"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* OTP input — shown when sent but not yet verified (bypassed: auto-verified) */}
                    {venmoOtpSent && !venmoVerified && (
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Enter verification code</label>
                        <div className="flex gap-2">
                          <input
                            className={`${inputCls} flex-1`}
                            value={venmoOtp}
                            onChange={e => setVenmoOtp(e.target.value)}
                            placeholder="6-digit code"
                            maxLength={6}
                            inputMode="numeric"
                          />
                          <button
                            onClick={verifyVenmoOtp}
                            disabled={venmoOtp.length < 4}
                            className="px-4 bg-primary text-primary-foreground font-medium rounded-xl text-sm disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verified badge */}
                    {venmoVerified && (
                      <div className="flex items-center gap-2 bg-secondary/10 rounded-xl p-3">
                        <ShieldCheck className="w-5 h-5 text-secondary shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Phone verified</p>
                          <p className="text-xs text-muted-foreground">Earnings will be sent to <span className="font-semibold">{venmoPhone}</span> via Venmo</p>
                        </div>
                      </div>
                    )}

                    {/* Ownership agreement */}
                    <button
                      onClick={() => setVenmoOwnershipAgreed(!venmoOwnershipAgreed)}
                      className="flex items-start gap-3 w-full text-left"
                    >
                      <div
                        className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          venmoOwnershipAgreed ? "bg-primary border-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {venmoOwnershipAgreed && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        I confirm that the Venmo phone number provided above belongs to me and I authorize BlueOkra to send my service earnings to this Venmo account.
                      </p>
                    </button>

                    {/* How payouts work */}
                    <div className="bg-muted rounded-xl p-3 space-y-1.5 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground text-sm">How payouts work</p>
                      <p>1. Customer pays BlueOkra directly (card, debit, etc.)</p>
                      <p>2. After service is confirmed complete, admin releases payment</p>
                      <p>3. BlueOkra sends your earnings to your Venmo</p>
                    </div>

                    {error && <p className="text-xs text-destructive">{error}</p>}

                    <div className="flex gap-2">
                      <button onClick={() => setProviderStep(3)} className="px-5 bg-muted text-muted-foreground font-medium py-3 rounded-2xl text-sm">← Back</button>
                      <button
                        onClick={saveProvider}
                        disabled={saving || !venmoVerified || !venmoOwnershipAgreed}
                        className="flex-1 bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Launch My Profile</span><PartyPopper className="w-4 h-4" /></>}
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground text-center">
                      You can update your Venmo number later from Profile → Account Settings
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
RegistrationFlow.displayName = "RegistrationFlow";

export default RegistrationFlow;
