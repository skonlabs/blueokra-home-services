import { motion } from "framer-motion";
import { Clock, MapPin, ChevronLeft, ChevronRight, Loader2, Inbox, DollarSign, User } from "lucide-react";
import ServiceIcon from "@/components/shared/ServiceIcon";
import { useState, useMemo } from "react";
import { useProviderJobs } from "@/hooks/useBookings";
import { format } from "date-fns";

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
  time: string;
  service: string;
  serviceType: string;
  customer: string;
  address: string;
  revenue: number;
  status: string;
}

const ProviderSchedule = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const { data: rawJobs, isLoading } = useProviderJobs();

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Build schedule from real appointment data
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
        // Calculate provider earnings (after platform fee)
        const feeP = revenue < 150 ? 0.20 : revenue <= 400 ? 0.25 : 0.30;
        const providerEarnings = Math.round(revenue * (1 - feeP));
        if (!result[key]) result[key] = [];
        result[key].push({
          time: format(d, "h:mm a"),
          service: service?.package_name || service?.service_type || "Service",
          serviceType: service?.service_type || "general",
          customer: cp?.display_name || [cp?.first_name, cp?.last_name].filter(Boolean).join(" ") || "Customer",
          address: cp?.address || service?.notes || "Address pending",
          revenue: providerEarnings,
          status: job.appointment_status || "pending",
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
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
          >
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
            <button
              key={key}
              onClick={() => { setSelectedKey(key); setExpandedIdx(null); }}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all relative ${
                isSelected ? "bg-primary text-primary-foreground" : "bg-card border border-border"
              }`}
            >
              <span className="text-[10px] font-medium opacity-70">{days[i]}</span>
              <span className="text-sm font-semibold">{date.getDate()}</span>
              {isToday && !isSelected && (
                <span className="text-[9px] font-bold text-primary leading-none">TODAY</span>
              )}
              {isToday && isSelected && (
                <span className="text-[9px] font-bold text-primary-foreground leading-none opacity-80">TODAY</span>
              )}
              {hasJobs && !isSelected && !isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
              {hasJobs && isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground opacity-70" />
              )}
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
            const isExpanded = expandedIdx === i;
            const statusColor = job.status === "confirmed" ? "text-success" : job.status === "completed" ? "text-okra-600" : "text-warm-500";
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className="w-full text-left bg-card rounded-xl border border-border p-3 active:scale-[0.99] transition-transform"
              >
                {/* Top row: service + earnings */}
                <div className="flex items-center gap-2.5 mb-2">
                  <ServiceIcon serviceType={job.serviceType} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{job.service}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium capitalize ${statusColor}`}>{job.status.replace("_", " ")}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">${job.revenue}</p>
                    <p className="text-[10px] text-muted-foreground">earnings</p>
                  </div>
                </div>

                {/* Key info row */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0" />{job.time}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3 shrink-0" />{job.customer}</span>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="break-words">{job.address}</span>
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProviderSchedule;
