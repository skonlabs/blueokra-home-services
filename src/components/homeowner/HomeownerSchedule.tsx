import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Inbox, Clock, MapPin, CalendarClock, ThumbsUp, MessageSquare, User as UserIcon, DollarSign, Check, QrCode } from "lucide-react";
import { useHomeownerAppointments } from "@/hooks/useHomeownerAppointments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ServiceIcon from "@/components/shared/ServiceIcon";
import DateProposalSheet from "@/components/provider/jobs/DateProposalSheet";
import { format, isAfter } from "date-fns";
import {
  getAppointmentStatusInfo,
  userNeedsToConfirm,
  canCompleteAppointment,
} from "@/lib/appointmentStatus";

type ScheduleTab = "all" | "pending" | "upcoming" | "completed";

interface HomeownerScheduleProps {
  onChat?: (userId: string, name: string) => void;
  onComplete?: (appointmentId: string) => void;
}

const HomeownerSchedule = ({ onChat, onComplete }: HomeownerScheduleProps) => {
  const [activeTab, setActiveTab] = useState<ScheduleTab>("all");
  const { data: appointments, isLoading } = useHomeownerAppointments();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proposalApptId, setProposalApptId] = useState<string | null>(null);
  const [proposalDate, setProposalDate] = useState<string>("");
  const [accepting, setAccepting] = useState<string | null>(null);

  const tabs: { key: ScheduleTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
  ];

  const filtered = useMemo(() => {
    const all = appointments || [];
    const now = new Date();
    switch (activeTab) {
      case "pending":
        return all.filter(a => ["new", "pending", "scheduled"].includes(a.appointment_status) || a.customer_status === "pending");
      case "upcoming":
        return all.filter(a => {
          if (a.customer_status !== "confirmed" || a.provider_status !== "confirmed") return false;
          try { return isAfter(new Date(a.appointment_date), now); } catch { return false; }
        });
      case "completed":
        return all.filter(a => a.appointment_status === "completed");
      default:
        return all;
    }
  }, [appointments, activeTab]);

  const handleAcceptDate = async (appointmentId: string) => {
    if (!user) return;
    setAccepting(appointmentId);
    try {
      const { data, error } = await supabase.rpc("accept_appointment_date", {
        _user_id: user.id,
        _appointment_id: appointmentId,
      });
      if (error) throw error;
      const result = data as any;
      if (result?.confirmed) {
        toast({ title: "Appointment confirmed!", description: "Both parties agreed on the date." });
      } else {
        toast({ title: "Date accepted", description: "Waiting for the provider to confirm." });
      }
      queryClient.invalidateQueries({ queryKey: ["homeowner-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setAccepting(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => {
          const count = (() => {
            const all = appointments || [];
            const now = new Date();
            switch (tab.key) {
              case "pending": return all.filter(a => ["new", "pending", "scheduled"].includes(a.appointment_status) || a.customer_status === "pending").length;
              case "upcoming": return all.filter(a => { if (a.customer_status !== "confirmed" || a.provider_status !== "confirmed") return false; try { return isAfter(new Date(a.appointment_date), now); } catch { return false; } }).length;
              case "completed": return all.filter(a => a.appointment_status === "completed").length;
              default: return all.length;
            }
          })();
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-foreground"
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Appointments */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((appt, i) => {
            // Use shared status logic
            const statusInfo = getAppointmentStatusInfo(
              appt.appointment_status,
              appt.provider_status,
              appt.customer_status,
              "homeowner"
            );
            const needsConfirm = userNeedsToConfirm(
              appt.provider_status,
              appt.customer_status,
              "homeowner"
            );
            const provider = appt.providerProfile;
            const amount = Number(appt.customerAmount) || 0;
            const isCompleted = appt.appointment_status === "completed";
            const isActive = !isCompleted && !["declined", "cancelled"].includes(appt.appointment_status);

            let dateStr = "TBD";
            let timeStr = "";
            try {
              const d = new Date(appt.appointment_date);
              if (!isNaN(d.getTime())) {
                dateStr = format(d, "EEE, MMM d");
                timeStr = format(d, "h:mm a");
              }
            } catch {}

            return (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card rounded-xl border border-border p-3"
              >
                {/* Top: service + amount */}
                <div className="flex items-center gap-2.5 mb-2">
                  <ServiceIcon serviceType={appt.serviceType} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{appt.serviceName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                      <span className={`text-[10px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </div>
                  {amount > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">${amount}</p>
                      <p className="text-[10px] text-muted-foreground">to pay</p>
                    </div>
                  )}
                </div>

                {/* Date + provider */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0" />{dateStr} · {timeStr}</span>
                  {provider && (
                    <span className="flex items-center gap-1">
                      {provider.profile_photo_url ? (
                        <img src={provider.profile_photo_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                      ) : (
                        <UserIcon className="w-3 h-3 shrink-0" />
                      )}
                      <span className="text-primary font-medium">{appt.providerName}</span>
                    </span>
                  )}
                </div>

                {/* Actions */}
                {isActive && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                    {needsConfirm && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAcceptDate(appt.id); }}
                        disabled={accepting === appt.id}
                        className="h-7 px-2 bg-success/10 text-success text-[10px] font-medium rounded-lg flex items-center gap-1 active:scale-[0.95] transition-transform"
                      >
                        <ThumbsUp className="w-3 h-3" /> Confirm
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setProposalApptId(appt.id); setProposalDate(appt.appointment_date); }}
                      className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
                      title="Propose new date"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {appt.provider_user_id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onChat?.(appt.provider_user_id!, appt.providerName); }}
                        className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
                        title="Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}

                {isCompleted && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border text-okra-600">
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium">Completed</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Date proposal sheet */}
      {proposalApptId && (
        <DateProposalSheet
          appointmentId={proposalApptId}
          currentDate={proposalDate}
          onClose={() => { setProposalApptId(null); queryClient.invalidateQueries({ queryKey: ["homeowner-appointments"] }); }}
        />
      )}
    </div>
  );
};

export default HomeownerSchedule;
