import { useAuth } from "@/contexts/AuthContext";

interface ProfileScreenProps {
  onSwitchMode: () => void;
  isProvider?: boolean;
}

const ProfileScreen = ({ onSwitchMode, isProvider }: ProfileScreenProps) => {
  const { profile, user, signOut } = useAuth();

  const displayName = profile?.display_name
    || (profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : null)
    || user?.phone
    || "User";

  return (
    <div className="px-4 py-6 pb-24 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-2xl">{isProvider ? "👷" : "👤"}</span>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">{displayName}</h2>
          <p className="text-sm text-muted-foreground">{user?.phone || ""}</p>
        </div>
      </div>

      <div className="space-y-2">
        {[
          "Account Settings",
          "Payment Methods",
          "Notifications",
          "Help & Support",
          "Privacy Policy",
          "Terms of Service",
        ].map((item) => (
          <button key={item} className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-3.5 text-sm text-foreground text-left">
            {item}
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
