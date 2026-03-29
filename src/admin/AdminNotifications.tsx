import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

const AdminNotifications = () => {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["admin-notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notification")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Also fetch system support tickets
  const { data: tickets } = useQuery({
    queryKey: ["admin-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Admin can't SELECT from admin_support_ticket via RLS, so this may be empty
      // In production, add an admin SELECT policy
      const { data } = await supabase
        .from("admin_support_ticket")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Support Tickets */}
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">Support Tickets</h2>
        {(tickets || []).length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground text-sm">
            No support tickets yet
          </div>
        ) : (
          <div className="space-y-2">
            {(tickets || []).map((t: any) => (
              <div key={t.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm text-foreground">{t.subject || "No subject"}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    t.ticket_status === "open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}>{t.ticket_status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t.sender_email || "No email"} · {format(new Date(t.created_at), "MMM d, yyyy")}</p>
                {t.content && <p className="text-xs text-foreground mt-2 bg-muted rounded-xl p-2.5">{t.content}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Notifications */}
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">Broadcast Notifications</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (notifications || []).length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground text-sm">
            No broadcast notifications
          </div>
        ) : (
          <div className="space-y-2">
            {(notifications || []).map((n: any) => (
              <div key={n.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-4 h-4 text-primary" />
                  <p className="font-semibold text-sm text-foreground">{n.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {n.target_audience} · {format(new Date(n.created_at), "MMM d, yyyy")} · {n.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
