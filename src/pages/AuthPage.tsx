import { useState } from "react";
import { Shield, Mail, Lock, User, Home, Wrench, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import blueokraLogo from "@/assets/blueokra-logo.svg";
import { useToast } from "@/hooks/use-toast";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

type AuthMode = "login" | "signup";
type Role = "homeowner" | "provider";

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("homeowner");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("homeowner");
    setShowPassword(false);
  }

  async function handleForgotPassword() {
    toast({
      title: "Check your email",
      description: "If that address is registered, a reset link is on its way.",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        onAuthSuccess();
      } else {
        if (!fullName.trim()) {
          setError("Please enter your full name.");
          return;
        }

        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role,
            },
          },
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        onAuthSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-okra-50 flex flex-col items-center justify-center px-4 py-10">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <img src={blueokraLogo} alt="BlueOkra" className="w-10 h-10" />
          <h1 className="font-display text-4xl font-bold text-gradient-primary">
            BlueOkra<sup className="text-sm font-normal align-super text-primary">®</sup>
          </h1>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">beta</span>
        </div>
        <p className="text-muted-foreground text-sm">Home services, simplified</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Tab pills */}
        <div className="flex gap-1 p-1.5 bg-muted m-4 rounded-2xl">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              mode === "login"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              mode === "signup"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-4 pb-4 flex flex-col gap-3">
          {/* Full name — signup only */}
          {mode === "signup" && (
            <div className="relative">
              <User
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="w-full bg-muted rounded-2xl px-4 py-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-muted rounded-2xl px-4 py-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition placeholder:text-muted-foreground"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full bg-muted rounded-2xl px-4 py-3 pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Role selector — signup only */}
          {mode === "signup" && (
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setRole("homeowner")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
                  role === "homeowner"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Home size={15} />
                Homeowner
              </button>
              <button
                type="button"
                onClick={() => setRole("provider")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
                  role === "provider"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wrench size={15} />
                Provider
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-xs px-1 -mt-1">{error}</p>
          )}

          {/* Forgot password — login only */}
          {mode === "login" && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-primary hover:underline text-right -mt-1 self-end"
            >
              Forgot password?
            </button>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-semibold mt-1 flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Trust badge */}
        <div className="mx-4 mb-4 flex items-center justify-center gap-1.5 bg-okra-50 rounded-xl py-2.5 px-3">
          <Shield size={14} className="text-okra-600 shrink-0" />
          <span className="text-xs text-okra-600 font-medium">Pay after service guarantee</span>
        </div>
      </div>
    </div>
  );
}
