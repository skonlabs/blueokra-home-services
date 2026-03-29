import { useState } from "react";
import { Navigation, MessageSquare, QrCode, Check, Clock, CalendarClock, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Appointment } from "./types";
import DateProposalSheet from "./DateProposalSheet";
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
  viewRole?: ViewRole;
  onComplete?: (appointment: Appointment) => void;
  onChat?: (appointment: Appointment) => void;
  /** Hide navigate button (e.g. for homeowner view) */
  hideNavigate?: boolean;
  /** Hide done/complete button (e.g. for homeowner view) */
  hideDone?: boolean;
}

const AppointmentRow = ({
  appointment,
  address,
  customerUserId,
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

  // Use shared status logic
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
      <div className="flex items-start justify-between gap-2 py-3 border-t border-border first:border-t-0">
        <div className="flex items-start gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${statusInfo.dotColor}`} />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{appointment.date}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{statusInfo.label}</p>
            {appointment.serviceName && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{appointment.serviceName}</p>
            )}
            {appointment.customerName && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onChat) onChat(appointment);
                }}
                className="text-[10px] text-primary font-medium mt-0.5 block"
              >
                {appointment.customerName}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isCompleted && (
            <div className="flex items-center gap-1 text-okra-600">
              <Check className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Done</span>
            </div>
          )}

          {isActive && (
            <>
              {/* Accept date (if pending) */}
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

              {/* Propose new date */}
              <button
                onClick={() => setProposalOpen(true)}
                className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
                aria-label="Propose new date"
                title="Propose new date"
              >
                <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {/* Navigate (provider only) */}
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

              {/* Chat */}
              <button
                onClick={() => onChat?.(appointment)}
                className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
                aria-label="Message"
              >
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {/* Complete */}
              {showDone && onComplete && (
                <button
                  onClick={() => onComplete(appointment)}
                  className="h-7 px-2 bg-success text-success-foreground text-[10px] font-medium rounded-lg flex items-center gap-1 active:scale-[0.95] transition-transform"
                >
                  <QrCode className="w-3 h-3" /> Done
                </button>
              )}
              {showDoneDisabled && (
                <span className="h-7 px-2 bg-muted text-muted-foreground text-[10px] font-medium rounded-lg flex items-center gap-1 cursor-not-allowed opacity-60" title="Available on service date">
                  <Clock className="w-3 h-3" /> Done
                </span>
              )}
            </>
          )}
        </div>
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
