import { motion } from "framer-motion";
import { Clock, MapPin, ChevronLeft, ChevronRight, Loader2, Inbox, DollarSign, User, CalendarClock, Navigation, MessageSquare, QrCode, ThumbsUp, Check } from "lucide-react";
import ServiceIcon from "@/components/shared/ServiceIcon";
import { useState, useMemo } from "react";
import { useProviderJobs } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import DateProposalSheet from "@/components/provider/jobs/DateProposalSheet";
import {
  getAppointmentStatusInfo,
  userNeedsToConfirm,
  canCompleteAppointment,
} from "@/lib/appointmentStatus";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const today = new Date();

const getWeekDates = (weekOffset: number): Date[] => {
  const d = new Date(today);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7;
  d.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d);
    date.setDate(d.getDate() + i);
    return date;
  });
};

const toDateKey = (d: Date) => d.toISOString().split("T")[0];
const todayKey = toDateKey(today);

interface ScheduleJob {
  id: string;
  time: string;
  rawDate: string;
  service: string;
  serviceType: string;
  customer: string;
  customerUserId: string;
  address: string;
  revenue: number;
  appointmentStatus: string;
  providerStatus: string;
  customerStatus: string;
}

interface ProviderScheduleProps {
  onChat?: (userId: string, name: string) => void;
  onComplete?: (appointmentId: string) => void;
}

const ProviderSchedule = ({ onChat, onComplete }: ProviderScheduleProps) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const { data: rawJobs, isLoading } = useProviderJobs();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proposalApptId, setProposalApptId] = useState<string | null>(null);
  const [proposalDate, setProposalDate] = useState("");
  const [accepting, setAccepting] = useState<string | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const scheduleData = useMemo(() => {
    const result: Record<string, ScheduleJob[]> = {};
    (rawJobs || []).forEach((job: any) => {
      try {
        const d = new Date(job.appointment_date);
        if (isNaN(d.getTime())) return;
        const key = toDateKey(d);
        const service = job.booking_service as any;
        const cp = job.customer_profile;
        const revenue = service?.revenue ? Number(service.revenue) : 0;
        const feeP = revenue < 150 ? 0.20 : revenue <= 400 ? 0.25 : 0.30;
        const providerEarnings = Math.round(revenue * (1 - feeP));
        if (!result[key]) result[key] = [];
        result[key].push({
          id: job.id,
          time: format(d, "h:mm a"),
          rawDate: job.appointment_date,
          service: service?.package_name || service?.service_type || "Service",
          serviceType: service?.service_type || "general",
          customer: cp?.display_name || [cp?.first_name, cp?.last_name].filter(Boolean).join(" ") || "Customer",
          customerUserId: cp?.user_id || job.customer_user_id || service?.customer_user_id || "",
          address: cp?.address || service?.notes || "Address pending",
          revenue: providerEarnings,
          appointmentStatus: job.appointment_status || "pending",
          providerStatus: job.provider_status || "pending",
          customerStatus: job.customer_status || "pending",
        });
      } catch { /* skip */ }
    });
    Object.values(result).forEach(arr => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return result;
  }, [rawJobs]);

  const monthLabel = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[6];
    const firstLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const lastLabel = last.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return firstLabel === lastLabel ? firstLabel : `${first.toLocaleDateString("en-US", { month: "short" })} – ${last.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  }, [weekDates]);

  const jobs = scheduleData[selectedKey] || [];
  const dayEarnings = jobs.reduce((sum, j) => sum + j.revenue, 0);

  const selectedDateObj = weekDates.find((d) => toDateKey(d) === selectedKey) || new Date(selectedKey);
  const fullDateLabel = selectedDateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const handleAcceptDate = async (appointmentId: string) => {
    if (!user) return;
    setAccepting(appointmentId);
    try {
      const { data, error } = await supabase.rpc("accept_appointment_date", { _user_id: user.id, _appointment_id: appointmentId });
      if (error) throw error;
      const result = data as any;
      toast({ title: result?.confirmed ? "Appointment confirmed!" : "Date accepted", description: result?.confirmed ? "Both parties agreed." : "Waiting for other party." });
      queryClient.invalidateQueries({ queryKey: ["provider-jobs"] });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setAccepting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">{monthLabel}</h3>
        <div className="flex gap-1">
          <button onClick={() => setWeekOffset((prev) => prev - 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={() => setWeekOffset((prev) => prev + 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-1">
        {weekDates.map((date, i) => {
          const key = toDateKey(date);
          const hasJobs = !!(scheduleData[key] && scheduleData[key].length > 0);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          return (
            <button key={key} onClick={() => setSelectedKey(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all relative ${isSelected ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
              <span className="text-[10px] font-medium opacity-70">{days[i]}</span>
              <span className="text-sm font-semibold">{date.getDate()}</span>
              {isToday && !isSelected && <span className="text-[9px] font-bold text-primary leading-none">TODAY</span>}
              {isToday && isSelected && <span className="text-[9px] font-bold text-primary-foreground leading-none opacity-80">TODAY</span>}
              {hasJobs && !isSelected && !isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              {hasJobs && isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground opacity-70" />}
            </button>
          );
        })}
      </div>

      {/* Day summary */}
      <div className="flex items-center justify-between bg-muted rounded-xl px-4 py-2.5">
        <span className="text-xs text-muted-foreground">{fullDateLabel} · {jobs.length} job{jobs.length !== 1 ? "s" : ""}</span>
        {dayEarnings > 0 && (
          <span className="text-xs font-medium text-foreground flex items-center gap-1">
            <DollarSign className="w-3 h-3" />{dayEarnings} your earnings
          </span>
        )}
      </div>

      {/* Appointments list */}
      <div className="space-y-2">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No jobs scheduled</p>
            <p className="text-xs text-muted-foreground mt-1">Jobs will appear here when customers book and you're assigned</p>
          </div>
        ) : (
          jobs.map((job, i) => {
            const statusInfo = getAppointmentStatusInfo(job.appointmentStatus, job.providerStatus, job.customerStatus, "provider");
            const needsConfirm = userNeedsToConfirm(job.providerStatus, job.customerStatus, "provider");
            const isCompleted = job.appointmentStatus === "completed";
            const isActive = !isCompleted && !["declined", "cancelled"].includes(job.appointmentStatus);
            const showDone = canCompleteAppointment(job.rawDate, job.appointmentStatus, job.providerStatus, job.customerStatus);
            const showDoneDisabled = !showDone;

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full text-left bg-card rounded-xl border border-border p-3"
              >
                {/* Top row */}
                <div className="flex items-center gap-2.5 mb-2">
                  <ServiceIcon serviceType={job.serviceType} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{job.service}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium capitalize ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">${job.revenue}</p>
                    <p className="text-[10px] text-muted-foreground">earnings</p>
                  </div>
                </div>

                {/* Info row */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0" />{job.time}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3 shrink-0" />{job.customer}</span>
                </div>

                {/* Action buttons */}
                {isActive && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                    {needsConfirm && (
                      <button onClick={() => handleAcceptDate(job.id)} disabled={accepting === job.id}
                        className="h-7 px-2 bg-success/10 text-success text-[10px] font-medium rounded-lg flex items-center gap-1 active:scale-[0.95] transition-transform">
                        <ThumbsUp className="w-3 h-3" /> Accept
                      </button>
                    )}
                    <button onClick={() => { setProposalApptId(job.id); setProposalDate(job.rawDate); }}
                      className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform" title="Propose new date">
                      <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`, "_blank")}
                      className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform" title="Navigate">
                      <Navigation className="w-3.5 h-3.5 text-foreground" />
                    </button>
                    {job.customerUserId && onChat && (
                      <button onClick={() => onChat(job.customerUserId, job.customer)}
                        className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform" title="Chat">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                    {showDone && onComplete ? (
                      <button onClick={() => onComplete(job.id)}
                        className="h-7 px-2 bg-success text-success-foreground text-[10px] font-medium rounded-lg flex items-center gap-1 active:scale-[0.95] transition-transform">
                        <QrCode className="w-3 h-3" /> Done
                      </button>
                    ) : (
                      <span className="h-7 px-2 bg-muted text-muted-foreground text-[10px] font-medium rounded-lg flex items-center gap-1 cursor-not-allowed opacity-60" title="Available after confirmation and on service date">
                        <QrCode className="w-3 h-3" /> Done
                      </span>
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
          })
        )}
      </div>

      {/* Date proposal sheet */}
      {proposalApptId && (
        <DateProposalSheet
          appointmentId={proposalApptId}
          currentDate={proposalDate}
          onClose={() => { setProposalApptId(null); queryClient.invalidateQueries({ queryKey: ["provider-jobs"] }); }}
        />
      )}
    </div>
  );
};

export default ProviderSchedule;
