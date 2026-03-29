import { useState } from "react";
import { X, Calendar, Clock, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface DateProposalSheetProps {
  appointmentId: string;
  currentDate: string;
  onClose: () => void;
}

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM",
];

const DateProposalSheet = ({ appointmentId, currentDate, onClose }: DateProposalSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentFormatted = (() => {
    try {
      return format(new Date(currentDate), "EEE, MMM d, yyyy h:mm a");
    } catch {
      return "Not set";
    }
  })();

  const handleSubmit = async () => {
    if (!user || !selectedDate || !selectedTime) return;

    // Parse time
    const [time, period] = selectedTime.split(" ");
    const [hours, mins] = time.split(":").map(Number);
    let h = hours;
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    const proposedDate = new Date(`${selectedDate}T${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`);

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("propose_appointment_date", {
        _user_id: user.id,
        _appointment_id: appointmentId,
        _proposed_date: proposedDate.toISOString(),
        _notes: notes || null,
      });

      if (error) throw error;
      
      const result = data as any;
      if (result && !result.success) {
        throw new Error(result.error || "Failed to propose date");
      }

      toast({ title: "Date proposed!", description: "Waiting for the other party to confirm." });
      queryClient.invalidateQueries({ queryKey: ["provider-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed to propose date", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Generate next 30 days
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split("T")[0];
  });

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-end justify-center">
      <div className="w-full max-w-md bg-card rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-foreground">Propose New Date</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-muted/50 rounded-xl p-3 mb-4">
          <p className="text-xs text-muted-foreground">Current date</p>
          <p className="text-sm font-medium text-foreground">{currentFormatted}</p>
        </div>

        {/* Date picker */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Select Date
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {dateOptions.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`text-xs py-2 px-2 rounded-lg transition-colors ${
                  selectedDate === d
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted text-foreground"
                }`}
              >
                {format(new Date(d + "T12:00:00"), "MMM d")}
              </button>
            ))}
          </div>
        </div>

        {/* Time picker */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Select Time
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`text-xs py-2 px-2 rounded-lg transition-colors ${
                  selectedTime === t
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2 mb-5">
          <label className="text-xs font-medium text-foreground">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., I'm available mornings only..."
            className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none h-16"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedDate || !selectedTime || submitting}
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Propose Date
        </button>
      </div>
    </div>
  );
};

export default DateProposalSheet;
