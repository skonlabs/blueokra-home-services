import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Inbox, Clock, MapPin, CalendarClock, ThumbsUp, MessageSquare, User as UserIcon } from "lucide-react";
import { useHomeownerAppointments } from "@/hooks/useHomeownerAppointments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ServiceIcon from "@/components/shared/ServiceIcon";
import DateProposalSheet from "@/components/provider/jobs/DateProposalSheet";
import { format, isAfter } from "date-fns";

type ScheduleTab = "all" | "pending" | "upcoming" | "completed";

interface HomeownerScheduleProps {
  onChat?: (userId: string, name: string) => void;
}

const HomeownerSchedule = ({ onChat }: HomeownerScheduleProps) => {
  const [activeTab, setActiveTab] = useState<ScheduleTab>("all");
  const { data: appointments, isLoading } = useHomeownerAppointments();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proposalApptId, setProposalApptId] = useState<string | null>(null);
  const [proposalDate, setProposalDate] = useState<string>("");
  const [accepting, setAccepting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          if (a.appointment_status !== "confirmed") return false;
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

  const getStatusInfo = (appt: any) => {
    const cs = appt.customer_status;
    const ps = appt.provider_status;
    const status = appt.appointment_status;

    if (status === "completed") return { label: "Completed", color: "text-okra-600", dot: "bg-okra-500" };
    if (status === "confirmed" || (cs === "confirmed" && ps === "confirmed")) return { label: "Confirmed", color: "text-success", dot: "bg-success" };
    
    // Homeowner view: if provider proposed (provider confirmed, customer pending)
    if (ps === "confirmed" && cs === "pending") return { label: "Pending your confirmation", color: "text-warm-500", dot: "bg-warm-400" };
    // If homeowner proposed (customer confirmed, provider pending)
    if (cs === "confirmed" && ps === "pending") return { label: "Awaiting confirmation", color: "text-primary", dot: "bg-primary" };
    
    return { label: status.replace("_", " "), color: "text-muted-foreground", dot: "bg-muted-foreground" };
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
              case "upcoming": return all.filter(a => { if (a.appointment_status !== "confirmed") return false; if (a.customer_status !== "confirmed" || a.provider_status !== "confirmed") return false; try { return isAfter(new Date(a.appointment_date), now); } catch { return false; } }).length;
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
            const statusInfo = getStatusInfo(appt);
            const isExpanded = expandedId === appt.id;
            const provider = appt.providerProfile;
            const amount = Number(appt.customerAmount) || 0;
            const needsConfirm = appt.provider_status === "confirmed" && appt.customer_status === "pending";
            const isCompleted = appt.appointment_status === "completed";
            const isActive = !isCompleted;

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
                className="bg-card rounded-xl border border-border p-3 active:scale-[0.99] transition-transform"
              >
                {/* Top: service + amount */}
                <button onClick={() => setExpandedId(isExpanded ? null : appt.id)} className="w-full text-left">
                  <div className="flex items-center gap-2.5 mb-2">
                    <ServiceIcon serviceType={appt.serviceType} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{appt.serviceName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
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
                </button>

                {/* Actions always visible */}
                {isActive && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                    {/* Accept date */}
                    {needsConfirm && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAcceptDate(appt.id); }}
                        disabled={accepting === appt.id}
                        className="h-7 px-2 bg-success/10 text-success text-[10px] font-medium rounded-lg flex items-center gap-1 active:scale-[0.95] transition-transform"
                      >
                        <ThumbsUp className="w-3 h-3" /> Confirm
                      </button>
                    )}

                    {/* Propose new date */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setProposalApptId(appt.id); setProposalDate(appt.appointment_date); }}
                      className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
                      title="Propose new date"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>

                    {/* Chat */}
                    {appt.provider_user_id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onChat?.(appt.provider_user_id!, appt.providerName); }}
                        className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}

                {/* Expanded: address details */}
                {isExpanded && provider?.address && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="break-words">{provider.address}</span>
                    </div>
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
