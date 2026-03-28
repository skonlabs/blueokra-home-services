import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Wrench, Building2, User, ChevronRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import blueokraLogo from "@/assets/blueokra-logo.svg";

interface RegistrationFlowProps {
  onComplete: () => void;
}

const AVAILABLE_SERVICES = [
  "Lawn Care",
  "House Cleaning",
  "Gutter Cleaning",
  "Roof Cleaning",
  "Pressure Washing",
  "Duct Cleaning",
  "Backwater Testing",
  "Fence Installation",
];

const inputCls =
  "w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 border border-transparent";

const RegistrationFlow = forwardRef<HTMLDivElement, RegistrationFlowProps>(({ onComplete }, ref) => {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<"role" | "provider-details">("role");
  const [role, setRole] = useState<"homeowner" | "provider" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const toggleService = (s: string) => {
    setSelectedServices(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
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

      // Upsert profile (works even if profile row doesn't exist yet)
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      }, { onConflict: "user_id" });
      if (profileError) throw profileError;

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

      // Upsert profile with provider details (works even if row doesn't exist yet)
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        company_name: providerType === "company" ? businessName.trim() || null : null,
        display_name: providerType === "company"
          ? businessName.trim() || null
          : firstName.trim() ? `${firstName.trim()} ${lastName.trim()}`.trim() : null,
        address: businessAddress.trim() || null,
      }, { onConflict: "user_id" });
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
    <div ref={ref} className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="flex items-center gap-2.5 mb-8">
        <img src={blueokraLogo} alt="BlueOkra" className="w-8 h-8" />
        <h1 className="font-display text-2xl font-bold text-gradient-primary">BlueOkra<sup className="text-xs font-normal align-super text-primary">®</sup></h1>
      </div>

      <AnimatePresence mode="wait">

        {/* Step 1: Role selection */}
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
              <p className="text-sm text-muted-foreground mt-1">How will you be using the app?</p>
            </div>

            {/* Name fields (optional but helpful) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">First name</label>
                <input className={inputCls} placeholder="First" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Last name</label>
                <input className={inputCls} placeholder="Last" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Homeowner */}
              <button
                onClick={() => setRole("homeowner")}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  role === "homeowner"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Homeowner</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Book home services, track appointments, manage your property</p>
                </div>
                {role === "homeowner" && <Check className="w-5 h-5 text-primary ml-auto shrink-0" />}
              </button>

              {/* Provider */}
              <button
                onClick={() => setRole("provider")}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  role === "provider"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <Wrench className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Service Provider</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Offer services, manage your schedule, receive payments</p>
                </div>
                {role === "provider" && <Check className="w-5 h-5 text-primary ml-auto shrink-0" />}
              </button>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              disabled={!role || saving}
              onClick={() => {
                if (role === "homeowner") saveHomeowner();
                else if (role === "provider") setStep("provider-details");
              }}
              className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>Continue <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
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
              {[1, 2, 3].map(s => (
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
                      <div className="flex-1">
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
                      <div className="flex-1">
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
                    <input className={inputCls} placeholder="123 Main St, Seattle, WA 98101" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setStep("role")} className="px-5 bg-muted text-muted-foreground font-medium py-3 rounded-2xl text-sm">← Back</button>
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
                      const checked = selectedServices.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleService(s)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all ${
                            checked ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-foreground"
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
                    <div className="flex items-center justify-between bg-card rounded-xl border border-border px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">Licensed</p>
                        <p className="text-xs text-muted-foreground">Do you hold a state contractor's license?</p>
                      </div>
                      <button
                        onClick={() => setIsLicensed(!isLicensed)}
                        className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${isLicensed ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isLicensed ? "translate-x-5" : "translate-x-1"}`} />
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
                    <div className="flex items-center justify-between bg-card rounded-xl border border-border px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">Bonded</p>
                        <p className="text-xs text-muted-foreground">Do you carry a surety bond?</p>
                      </div>
                      <button
                        onClick={() => setIsBonded(!isBonded)}
                        className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${isBonded ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isBonded ? "translate-x-5" : "translate-x-1"}`} />
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
                      onClick={saveProvider}
                      disabled={saving}
                      className="flex-1 bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Launch My Profile 🎉"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
RegistrationFlow.displayName = "RegistrationFlow";

export default RegistrationFlow;
