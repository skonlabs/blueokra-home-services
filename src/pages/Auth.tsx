import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const { signInWithPhone, verifyOtp } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const getRawPhone = () => {
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("1") ? `+${digits}` : `+1${digits}`;
  };

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 3) {
      toast({ title: "Enter a phone number", description: "Please enter any phone number to continue.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signInWithPhone(getRawPhone());
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setStep("otp");
      toast({ title: "Code sent!", description: "Check your phone for the verification code." });
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast({ title: "Invalid code", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await verifyOtp(getRawPhone(), otp);
    setLoading(false);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    }
    // On success, AuthContext will handle the session change
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl font-bold text-foreground">
            Blue<span className="text-primary">Okra</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Home services, simplified.
          </p>
        </div>

        {/* Trust badge */}
        <div className="flex items-center gap-2 bg-okra-50 rounded-2xl p-3 border border-okra-100">
          <Shield className="w-5 h-5 text-secondary shrink-0" />
          <p className="text-xs text-muted-foreground">
            Pay-after-service guarantee. You're only charged once the job is done right.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Phone number
                </label>
                <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">+1</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(555) 123-4567"
                    className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                    maxLength={14}
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading || phone.replace(/\D/g, "").length < 10}
                className="w-full bg-primary text-primary-foreground font-medium py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Verification code
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Sent to {getRawPhone()}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:ring-2 focus:ring-primary/30 transition-shadow text-foreground"
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full bg-primary text-primary-foreground font-medium py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify & Sign In"
                )}
              </button>

              <button
                onClick={() => { setStep("phone"); setOtp(""); }}
                className="w-full text-sm text-muted-foreground py-2"
              >
                ← Change phone number
              </button>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full text-sm text-primary font-medium py-2"
              >
                Resend code
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[11px] text-muted-foreground text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
