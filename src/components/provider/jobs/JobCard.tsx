import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, MapPin, DollarSign, Loader2, Calendar, Repeat, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import ServiceIcon from "@/components/shared/ServiceIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { ProviderJob, Appointment } from "./types";
import { FREQUENCY_LABELS } from "./types";
import AppointmentRow from "./AppointmentRow";

interface JobCardProps {
  job: ProviderJob;
  index: number;
  onCompleteAppointment: (job: ProviderJob, appointment: Appointment) => void;
}

const JobCard = ({ job, index, onCompleteAppointment }: JobCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isNewLead = job.status === "new_lead";
  const isInProgress = job.status === "in_progress";
  const isCompleted = job.status === "completed";
  const isDeclined = job.status === "declined";

  const freqLabel = FREQUENCY_LABELS[job.frequency || "one-time"] || job.frequency || "One-Time";
  const isRecurring = job.frequency && job.frequency !== "one-time";
  const startDateFormatted = job.firstServiceDate
    ? (() => { try { return format(new Date(job.firstServiceDate), "EEE, MMM d, yyyy"); } catch { return "Date pending"; } })()
    : "Date pending";
  const receivedFormatted = job.receivedAt
    ? (() => { try { return format(new Date(job.receivedAt), "MMM d, yyyy 'at' h:mm a"); } catch { return ""; } })()
    : "";

  const handleAcceptLead = async () => {
    if (!user || !job.leadId || !job.serviceId) return;
    setAccepting(true);
    try {
      const { error } = await supabase.rpc("provider_respond_service", {
        _user_id: user.id,
        _service_id: job.serviceId,
        _response_type: "accepted",
      });
      if (error) throw error;
      toast({ title: "Job accepted!", description: "You've been assigned this service." });
      queryClient.invalidateQueries({ queryKey: ["provider-leads"] });
      queryClient.invalidateQueries({ queryKey: ["provider-jobs"] });
    } catch (err: any) {
      toast({ title: "Failed to accept", description: err.message, variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineLead = async () => {
    if (!user || !job.leadId || !job.serviceId) return;
    setDeclining(true);
    try {
      const { error } = await supabase.rpc("provider_respond_service", {
        _user_id: user.id,
        _service_id: job.serviceId,
        _response_type: "declined",
      });
      if (error) throw error;
      toast({ title: "Job declined" });
      queryClient.invalidateQueries({ queryKey: ["provider-leads"] });
    } catch (err: any) {
      toast({ title: "Failed to decline", description: err.message, variant: "destructive" });
    } finally {
      setDeclining(false);
    }
  };

  // Earnings calculation
  const feeP = job.firstServicePrice && job.firstServicePrice < 150 ? 20 : job.firstServicePrice && job.firstServicePrice <= 400 ? 25 : 30;
  const earningsP = (100 - feeP) / 100;
  const firstEarnings = Math.round((job.firstServicePrice || 0) * earningsP);
  const recurringEarnings = Math.round((job.recurringPrice || 0) * earningsP);

  const statusBadge = isNewLead
    ? { bg: "bg-warm-50 text-warm-500", label: "New Request" }
    : isCompleted
    ? { bg: "bg-okra-50 text-okra-600", label: "Completed" }
    : isDeclined
    ? { bg: "bg-destructive/10 text-destructive", label: "Declined" }
    : { bg: "bg-blue-50 text-blue-500", label: "In Progress" };

  const borderClass = isNewLead ? "border-2 border-primary/20" : "border border-border";

  // Active appointments (for in_progress)
  const activeAppts = job.appointments.filter(a => 
    ["confirmed", "in_progress", "scheduled", "new", "pending"].includes(a.status)
  );
  const completedAppts = job.appointments.filter(a => a.status === "completed");
  const hasAppointments = job.appointments.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`bg-card rounded-2xl ${borderClass} p-4 space-y-3`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ServiceIcon serviceType={job.serviceType} size="sm" />
          <div>
            <p className="font-semibold text-sm text-foreground">{job.service}</p>
            <p className="text-xs text-muted-foreground">{job.customer}</p>
          </div>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusBadge.bg}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        <span>{[job.city, job.state].filter(Boolean).join(", ") || job.address}</span>
      </div>

      {/* Earnings breakdown */}
      <div className="bg-muted/60 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Your Earnings</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">First service</span>
          <span className="text-sm font-bold text-foreground">${firstEarnings}</span>
        </div>

        {isRecurring && job.recurringPrice ? (
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">2nd service onwards</span>
            <span className="text-sm font-semibold text-foreground">${recurringEarnings}</span>
          </div>
        ) : null}

        <p className="text-[10px] text-muted-foreground italic">
          After platform fee{job.expectedEndDate ? `, expected through ${job.expectedEndDate}` : ""}
        </p>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/40 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Repeat className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Frequency</span>
          </div>
          <p className="text-xs font-semibold text-foreground">{freqLabel}</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Start Date</span>
          </div>
          <p className="text-xs font-semibold text-foreground">{startDateFormatted}</p>
        </div>
      </div>

      {/* Progress indicator for in-progress jobs */}
      {isInProgress && job.totalAppointments > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">
              {job.completedAppointments} of {job.totalAppointments} services completed
            </span>
            <span className="text-[11px] font-semibold text-foreground">
              {Math.round((job.completedAppointments / job.totalAppointments) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(job.completedAppointments / job.totalAppointments) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Completed summary */}
      {isCompleted && (
        <div className="flex items-center gap-2 bg-okra-50 rounded-xl p-2.5">
          <Check className="w-4 h-4 text-okra-600" />
          <p className="text-xs text-okra-600 font-medium">
            All {job.totalAppointments} service{job.totalAppointments !== 1 ? "s" : ""} completed
          </p>
        </div>
      )}

      {/* New lead specific content */}
      {isNewLead && (
        <>
          <div className="flex items-start gap-2 bg-accent/30 rounded-lg p-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Start date can be adjusted based on your availability after accepting.
            </p>
          </div>

          {receivedFormatted && (
            <p className="text-[10px] text-muted-foreground text-right">
              Received {receivedFormatted}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDeclineLead}
              disabled={declining || accepting}
              className="flex-1 bg-muted text-destructive text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
            >
              {declining ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Decline
            </button>
            <button
              onClick={handleAcceptLead}
              disabled={accepting || declining}
              className="flex-1 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
            >
              {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accept
            </button>
          </div>
        </>
      )}

      {/* Expandable appointments section for non-lead cards */}
      {!isNewLead && hasAppointments && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between py-2 text-xs font-medium text-primary active:opacity-70 transition-opacity"
          >
            <span>
              {expanded ? "Hide" : "View"} Services ({job.appointments.length})
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-muted/30 rounded-xl p-3">
                  {job.appointments.map((appt) => (
                    <AppointmentRow
                      key={appt.id}
                      appointment={appt}
                      address={job.address}
                      onComplete={(a) => onCompleteAppointment(job, a)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default JobCard;
