import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  company_name: string | null;
  profile_photo_url: string | null;
  phone_verified: boolean | null;
  approval_status: string | null;
  venmo_phone: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const hydrationRunRef = useRef(0);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    await supabase
      .from("profiles")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return (data as Profile) ?? null;
  };

  const fetchRoles = async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) throw error;
    return data?.map((r) => r.role) ?? [];
  };

  const hydrateSession = async (nextSession: Session | null) => {
    const runId = ++hydrationRunRef.current;

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setProfile(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setProfile(null);
    setRoles([]);

    try {
      const [nextProfile, nextRoles] = await Promise.all([
        fetchProfile(nextSession.user.id),
        fetchRoles(nextSession.user.id),
      ]);

      if (runId !== hydrationRunRef.current) return;
      setProfile(nextProfile);
      setRoles(nextRoles);
    } catch (error) {
      if (runId !== hydrationRunRef.current) return;
      console.error("Failed to hydrate auth state", error);
      setProfile(null);
      setRoles([]);
    } finally {
      if (runId === hydrationRunRef.current) {
        setLoading(false);
      }
    }
  };

  const refreshProfile = async () => {
    if (!user) return;

    const runId = ++hydrationRunRef.current;
    setLoading(true);

    try {
      const [nextProfile, nextRoles] = await Promise.all([
        fetchProfile(user.id),
        fetchRoles(user.id),
      ]);

      if (runId !== hydrationRunRef.current) return;
      setProfile(nextProfile);
      setRoles(nextRoles);
    } finally {
      if (runId === hydrationRunRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isActive = true;

    const runHydration = (nextSession: Session | null) => {
      if (!isActive) return;
      void hydrateSession(nextSession);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        runHydration(nextSession);
      }
    );

    void supabase.auth.getSession().then(({ data: { session } }) => {
      runHydration(session);
    });

    return () => {
      isActive = false;
      hydrationRunRef.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * ⚠️  SECURITY WARNING — DEV / DEMO AUTH ONLY
   * -----------------------------------------------
   * This uses a deterministic email+password derived from the phone number.
   * Anyone who knows a user's phone can log in as them.
   *
   * BEFORE PRODUCTION, replace this with:
   *   1. Supabase Phone Auth (OTP via Twilio) — supabase.auth.signInWithOtp({ phone })
   *   2. Or a proper email/password auth flow
   *
   * The fake-email pattern exists solely so the app can be demo'd without
   * configuring an SMS provider.
   */
  const signInWithPhone = async (phone: string) => {
    const sanitized = phone.replace(/\D/g, "");
    if (sanitized.length < 10 || sanitized.length > 15) {
      return { error: new Error("Invalid phone number. Must be 10-15 digits.") };
    }

    const fakeEmail = `${sanitized}@blueokra.local`;
    const password = `bo_${sanitized}_pass`;
    
    // Try to sign up first, then sign in
    const { error: signUpError } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
    });
    
    // If user already exists, just sign in
    if (signUpError && signUpError.message?.includes("already registered")) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });
      return { error: signInError as Error | null };
    }
    
    return { error: signUpError as Error | null };
  };

  const verifyOtp = async (_phone: string, _token: string) => {
    // OTP verification is bypassed — user is already signed in via signUp
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, roles, loading,
        signInWithPhone, verifyOtp, signOut, refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
