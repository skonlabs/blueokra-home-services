import { useState } from "react";
import { Navigation, MessageSquare, QrCode, Check, Clock, CalendarClock, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Appointment } from "./types";
import DateProposalSheet from "./DateProposalSheet";
import ServiceIcon from "@/components/shared/ServiceIcon";
import {
  getAppointmentStatusInfo,
  userNeedsToConfirm,
  canCompleteAppointment,
  type ViewRole,
} from "@/lib/appointmentStatus";

interface AppointmentRowProps {
  appointment: Appointment;
  address: string;
  customerUserId?: string;
  serviceType?: string;
  viewRole?: ViewRole;
  onComplete?: (appointment: Appointment) => void;
  onChat?: (appointment: Appointment) => void;
  hideNavigate?: boolean;
  hideDone?: boolean;
}

const AppointmentRow = ({
  appointment,
  address,
  customerUserId,
  serviceType = "general",
  viewRole = "provider",
  onComplete,
  onChat,
  hideNavigate = false,
  hideDone = false,
}: AppointmentRowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proposalOpen, setProposalOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const isCompleted = appointment.status === "completed";
  const isActive = !isCompleted && !["declined", "cancelled"].includes(appointment.status);

  const statusInfo = getAppointmentStatusInfo(
    appointment.status,
    appointment.providerStatus,
    appointment.customerStatus,
    viewRole
  );
  const iNeedToConfirm = userNeedsToConfirm(
    appointment.providerStatus,
    appointment.customerStatus,
    viewRole
  );
  const showDone =
    !hideDone &&
    canCompleteAppointment(
      appointment.rawDate,
      appointment.status,
      appointment.providerStatus,
      appointment.customerStatus
    );
  const showDoneDisabled = !hideDone && !showDone && isActive;

  const handleAcceptDate = async () => {
    if (!user) return;
    setAccepting(true);
    try {
      const { data, error } = await supabase.rpc("accept_appointment_date", {
        _user_id: user.id,
        _appointment_id: appointment.id,
      });
      if (error) throw error;
      const result = data as any;
      if (result?.confirmed) {
        toast({ title: "Appointment confirmed!", description: "Both parties agreed on the date." });
      } else {
        toast({ title: "Date accepted", description: "Waiting for the other party to confirm." });
      }
      queryClient.invalidateQueries({ queryKey: ["provider-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["homeowner-appointments"] });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-3 mb-2 last:mb-0">
        {/* Top row: icon + service + status + completed badge */}
        <div className="flex items-center gap-2.5 mb-2">
          <ServiceIcon serviceType={serviceType} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {appointment.serviceName || "Service"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
              <span className={`text-[10px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1 text-okra-600 shrink-0">
              <Check className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Done</span>
            </div>
          )}
        </div>

        {/* Date + customer row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {appointment.date}
          </span>
          {appointment.customerName && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onChat) onChat(appointment);
              }}
              className="flex items-center gap-1 text-primary font-medium"
            >
              {appointment.customerName}
            </button>
          )}
        </div>

        {/* Action buttons */}
        {isActive && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
            {iNeedToConfirm && (
              <button
                onClick={handleAcceptDate}
                disabled={accepting}
                className="h-7 px-2 bg-success/10 text-success text-[10px] font-medium rounded-lg flex items-center gap-1 active:scale-[0.95] transition-transform"
                title="Accept this date"
              >
                <ThumbsUp className="w-3 h-3" /> Accept
              </button>
            )}

            <button
              onClick={() => setProposalOpen(true)}
              className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
              aria-label="Propose new date"
              title="Propose new date"
            >
              <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {!hideNavigate && (
              <button
                onClick={() =>
                  window.open(
                    `https://maps.google.com/?q=${encodeURIComponent(address)}`,
                    "_blank"
                  )
                }
                className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
                aria-label="Navigate"
              >
                <Navigation className="w-3.5 h-3.5 text-foreground" />
              </button>
            )}

            <button
              onClick={() => onChat?.(appointment)}
              className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
              aria-label="Message"
            >
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {showDone && onComplete ? (
              <button
                onClick={() => onComplete(appointment)}
                className="h-7 px-2 bg-success text-success-foreground text-[10px] font-medium rounded-lg flex items-center gap-1 active:scale-[0.95] transition-transform"
              >
                <QrCode className="w-3 h-3" /> Done
              </button>
            ) : showDoneDisabled ? (
              <span className="h-7 px-2 bg-muted text-muted-foreground text-[10px] font-medium rounded-lg flex items-center gap-1 cursor-not-allowed opacity-60" title="Available on service date">
                <Clock className="w-3 h-3" /> Done
              </span>
            ) : null}
          </div>
        )}
      </div>

      {proposalOpen && (
        <DateProposalSheet
          appointmentId={appointment.id}
          currentDate={appointment.rawDate}
          onClose={() => {
            setProposalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["provider-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["homeowner-appointments"] });
          }}
          key={`proposal-${appointment.id}`}
        />
      )}
    </>
  );
};

export default AppointmentRow;
