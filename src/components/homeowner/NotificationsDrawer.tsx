import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CircleCheck, Leaf, Star, X, DollarSign, Loader2, Inbox } from "lucide-react";
import { useNotifications } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
  onPaymentAction?: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  service_update: Bell,
  payment_approved: DollarSign,
  payment_rejected: DollarSign,
  appointment_confirmed: CircleCheck,
  appointment_partial_confirmation: CircleCheck,
  new_service_available: Leaf,
  new_review: Star,
  service_approved: CircleCheck,
  service_rejected: Bell,
};

const iconBgMap: Record<string, string> = {
  service_update: "bg-primary/10 text-primary",
  payment_approved: "bg-okra-50 text-okra-600",
  payment_rejected: "bg-destructive/10 text-destructive",
  appointment_confirmed: "bg-secondary/10 text-secondary",
  appointment_partial_confirmation: "bg-secondary/10 text-secondary",
  new_service_available: "bg-okra-50 text-okra-500",
  new_review: "bg-warm-50 text-warm-500",
  service_approved: "bg-secondary/10 text-secondary",
  service_rejected: "bg-destructive/10 text-destructive",
};

const NotificationsDrawer = forwardRef<HTMLDivElement, NotificationsDrawerProps>(({ open, onClose, onPaymentAction }, ref) => {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const queryClient = useQueryClient();

  const unreadCount = (notifications || []).filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.rpc("mark_notification_read", { _user_id: user.id, _mark_all: true });
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  const markOneRead = async (notifId: string) => {
    if (!user) return;
    await supabase.rpc("mark_notification_read", { _user_id: user.id, _notification_id: notifId });
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  return (
    <div ref={ref}>
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-[60px]">
          <motion.div
            className="absolute inset-0 bg-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-md bg-card rounded-t-3xl p-6 pb-6 shadow-xl mx-auto max-h-[calc(100vh-120px)] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: open ? 0 : "100%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-foreground">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary font-medium">Mark all read</button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : !notifications?.length ? (
              <div className="text-center py-8 space-y-2">
                <Inbox className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const Icon = iconMap[notification.notification_type] || Bell;
                  const bgCls = iconBgMap[notification.notification_type] || "bg-primary/10 text-primary";
                  const isPayment = notification.notification_type.includes("payment");
                  const timeAgo = (() => {
                    try { return formatDistanceToNow(new Date(notification.created_at!), { addSuffix: true }); }
                    catch { return ""; }
                  })();

                  return (
                    <button
                      key={notification.id}
                      onClick={() => {
                        if (!notification.is_read) markOneRead(notification.id);
                        if (isPayment && onPaymentAction) onPaymentAction();
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-colors hover:bg-muted/50 active:scale-[0.99] ${
                        !notification.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bgCls}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
});
NotificationsDrawer.displayName = "NotificationsDrawer";

export default NotificationsDrawer;
