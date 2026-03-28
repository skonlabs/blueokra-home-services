import { motion } from "framer-motion";
import { Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import ServiceIcon from "@/components/shared/ServiceIcon";
import { useState, useMemo } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface ScheduleJob {
  time: string;
  service: string;
  serviceType: string;
  customer: string;
  address: string;
  price: string;
  duration: string;
}

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

// Build schedule data keyed by "YYYY-MM-DD" using real current week dates
const buildScheduleData = (): Record<string, ScheduleJob[]> => {
  const baseWeek = getWeekDates(0);
  // Use the actual date numbers of this week to map to the existing mock slots
  // We'll attach jobs to specific weekday indices (0=Mon … 6=Sun)
  const byWeekday: Record<number, ScheduleJob[]> = {
    2: [ // Wed (index 2)
      { time: "9:00 AM", service: "HVAC Tune-up", serviceType: "duct", customer: "Amy R.", address: "789 Pine Rd", price: "$150", duration: "1 hr" },
      { time: "11:00 AM", service: "Lawn Mowing", serviceType: "lawn", customer: "Sarah M.", address: "123 Main St", price: "$185", duration: "1.5 hrs" },
      { time: "2:00 PM", service: "Pressure Wash", serviceType: "pressure", customer: "James L.", address: "456 Oak Ave", price: "$320", duration: "2 hrs" },
    ],
    3: [ // Thu (index 3)
      { time: "8:00 AM", service: "Roof Cleaning", serviceType: "roof", customer: "Tom B.", address: "555 Cedar Ln", price: "$450", duration: "3 hrs" },
      { time: "1:00 PM", service: "Lawn Mowing", serviceType: "lawn", customer: "David K.", address: "321 Elm St", price: "$165", duration: "1 hr" },
    ],
    4: [ // Fri (index 4)
      { time: "10:00 AM", service: "Duct Cleaning", serviceType: "duct", customer: "Lisa W.", address: "890 Birch Dr", price: "$200", duration: "1.5 hrs" },
    ],
    5: [ // Sat (index 5)
      { time: "9:00 AM", service: "Lawn Mowing", serviceType: "lawn", customer: "Sarah M.", address: "123 Main St", price: "$185", duration: "1.5 hrs" },
      { time: "12:00 PM", service: "Fence Repair", serviceType: "fence", customer: "Mike P.", address: "234 Maple Ave", price: "$175", duration: "2 hrs" },
      { time: "3:00 PM", service: "Pressure Wash", serviceType: "pressure", customer: "Ana S.", address: "678 Walnut St", price: "$280", duration: "1.5 hrs" },
    ],
  };

  const result: Record<string, ScheduleJob[]> = {};
  baseWeek.forEach((date, i) => {
    const key = date.toISOString().split("T")[0];
    if (byWeekday[i]) {
      result[key] = byWeekday[i];
    }
  });
  return result;
};

const scheduleData = buildScheduleData();

const toDateKey = (d: Date) => d.toISOString().split("T")[0];
const todayKey = toDateKey(today);

const ProviderSchedule = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const monthLabel = useMemo(() => {
    // If the week spans two months, show the month of the first day
    const first = weekDates[0];
    const last = weekDates[6];
    const firstLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const lastLabel = last.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return firstLabel === lastLabel ? firstLabel : `${first.toLocaleDateString("en-US", { month: "short" })} – ${last.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  }, [weekDates]);

  const jobs = scheduleData[selectedKey] || [];
  const dayEarnings = jobs.reduce((sum, j) => sum + parseInt(j.price.replace("$", "")), 0);

  const selectedDateObj = weekDates.find((d) => toDateKey(d) === selectedKey) || new Date(selectedKey);
  const fullDateLabel = selectedDateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            disabled={weekOffset === 0}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
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
              onClick={() => setSelectedKey(key)}
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
        <span className="text-xs font-medium text-foreground">${dayEarnings} estimated</span>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No jobs scheduled</p>
            <p className="text-xs text-muted-foreground mt-1">Enjoy your day off! 🌴</p>
          </div>
        ) : (
          jobs.map((job, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-3"
            >
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm mt-1" />
                {i < jobs.length - 1 && <div className="w-0.5 flex-1 bg-border my-1" />}
              </div>

              {/* Job card */}
              <div className="flex-1 bg-card rounded-2xl border border-border p-3.5 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ServiceIcon serviceType={job.serviceType} size="sm" />
                    <div>
                      <p className="font-semibold text-sm text-foreground">{job.service}</p>
                      <p className="text-xs text-muted-foreground">{job.customer}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{job.price}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.time} · {job.duration}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.address}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Route optimization hint */}
      {jobs.length > 1 && (
        <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground">Route optimized</p>
            <p className="text-[11px] text-muted-foreground">Jobs ordered by proximity. Est. 12 mi total driving.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderSchedule;
