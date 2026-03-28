import { forwardRef } from "react";
import { Home, History, Briefcase, User, Search } from "lucide-react";

interface BottomNavProps {
  active: string;
  onNavigate: (screen: string) => void;
  mode: "homeowner" | "provider";
}

const BottomNav = forwardRef<HTMLDivElement, BottomNavProps>(({ active, onNavigate, mode }, ref) => {
  const homeownerItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "bookings", icon: History, label: "Bookings" },
    { id: "property", icon: Search, label: "Property" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const providerItems = [
    { id: "provider-home", icon: Home, label: "Jobs" },
    { id: "provider-schedule", icon: History, label: "Schedule" },
    { id: "provider-earnings", icon: Briefcase, label: "Earnings" },
    { id: "provider-profile", icon: User, label: "Profile" },
  ];

  const items = mode === "provider" ? providerItems : homeownerItems;

  return (
    <div ref={ref} className="sticky bottom-0 bg-card border-t border-border px-2 pb-6 pt-2 z-50">
      <div className="flex justify-around">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              active === item.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
BottomNav.displayName = "BottomNav";

export default BottomNav;
