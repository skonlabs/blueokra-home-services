import { Navigation, MessageSquare, QrCode, Check, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "./types";

interface AppointmentRowProps {
  appointment: Appointment;
  address: string;
  onComplete: (appointment: Appointment) => void;
}

const AppointmentRow = ({ appointment, address, onComplete }: AppointmentRowProps) => {
  const { toast } = useToast();
  const isCompleted = appointment.status === "completed";
  const isActive = ["confirmed", "in_progress", "scheduled"].includes(appointment.status);
  const isPending = ["new", "pending"].includes(appointment.status);

  return (
    <div className="flex items-center justify-between gap-2 py-2.5 border-t border-border first:border-t-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${
          isCompleted ? "bg-okra-500" : isActive ? "bg-primary" : isPending ? "bg-warm-400" : "bg-muted-foreground"
        }`} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{appointment.date}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{appointment.status.replace("_", " ")}</p>
        </div>
      </div>

      {isCompleted && (
        <div className="flex items-center gap-1 text-okra-600">
          <Check className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium">Done</span>
        </div>
      )}

      {(isActive || isPending) && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank')}
            className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
            aria-label="Navigate"
          >
            <Navigation className="w-3.5 h-3.5 text-foreground" />
          </button>
          <button
            onClick={() => toast({ title: "Messaging coming soon" })}
            className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center active:scale-[0.95] transition-transform"
            aria-label="Message"
          >
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => onComplete(appointment)}
            className="h-8 px-3 bg-success text-success-foreground text-[11px] font-medium rounded-lg flex items-center gap-1 active:scale-[0.95] transition-transform"
          >
            <QrCode className="w-3.5 h-3.5" /> Complete
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentRow;
