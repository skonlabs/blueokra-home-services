import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CircleCheck, Calendar, Leaf, Star, X, DollarSign } from "lucide-react";

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
  onPaymentAction?: () => void;
}

type NotificationType = "info" | "payment" | "confirmed" | "tip" | "loyalty";

interface Notification {
  id: string;
  title: string;
  subtitle: string;
  type: NotificationType;
  time: string;
  unread?: boolean;
}

const notifications: Notification[] = [
  {
    id: "1",
    title: "Mike's Lawn Care is on the way!",
    subtitle: "Arriving in ~15 min",
    type: "info",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "2",
    title: "Job Complete - Lawn Mowing",
    subtitle: "Tap to confirm payment",
    type: "payment",
    time: "1 hr ago",
    unread: true,
  },
  {
    id: "3",
    title: "HVAC appointment confirmed",
    subtitle: "Tomorrow at 10:00 AM",
    type: "confirmed",
    time: "3 hrs ago",
  },
  {
    id: "4",
    title: "Seasonal tip: Gutter cleaning",
    subtitle: "Spring is here - schedule now",
    type: "tip",
    time: "1 day ago",
  },
  {
    id: "5",
    title: "Your review helped Mike",
    subtitle: "+10 loyalty points earned",
    type: "loyalty",
    time: "2 days ago",
  },
];

const iconMap: Record<NotificationType, React.ElementType> = {
  info: Bell,
  payment: DollarSign,
  confirmed: CircleCheck,
  tip: Leaf,
  loyalty: Star,
};

const iconBgMap: Record<NotificationType, string> = {
  info: "bg-primary/10 text-primary",
  payment: "bg-okra-50 text-okra-600",
  confirmed: "bg-secondary/10 text-secondary",
  tip: "bg-okra-50 text-okra-500",
  loyalty: "bg-warm-50 text-warm-500",
};

const NotificationsDrawer = forwardRef<HTMLDivElement, NotificationsDrawerProps>(({ open, onClose, onPaymentAction }, ref) => {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));

  return (
    <div ref={ref}>
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="relative z-10 w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 shadow-xl mx-auto"
            initial={{ y: "100%" }}
            animate={{ y: open ? 0 : "100%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-foreground">Notifications</h2>
              <div className="flex items-center gap-3">
                <button onClick={markAllRead} className="text-xs text-primary font-medium">Mark all read</button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="space-y-1">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.type];
                const isPayment = notification.type === "payment";

                return (
                  <button
                    key={notification.id}
                    onClick={isPayment && onPaymentAction ? onPaymentAction : undefined}
                    className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-colors ${
                      isPayment && onPaymentAction
                        ? "hover:bg-muted active:scale-[0.99] transition-transform"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBgMap[notification.type]}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notification.subtitle}
                      </p>
                    </div>

                    {/* Time + unread dot */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[11px] text-muted-foreground">{notification.time}</span>
                      {notification.unread && !readIds.has(notification.id) && (
                        <span className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
});
NotificationsDrawer.displayName = "NotificationsDrawer";

export default NotificationsDrawer;
