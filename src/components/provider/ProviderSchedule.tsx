import { motion } from "framer-motion";
import { Clock, MapPin, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dates = [24, 25, 26, 27, 28, 29, 30];

interface ScheduleJob {
  time: string;
  service: string;
  customer: string;
  address: string;
  price: string;
  duration: string;
  icon: string;
}

const scheduleData: Record<number, ScheduleJob[]> = {
  26: [
    { time: "9:00 AM", service: "HVAC Tune-up", customer: "Amy R.", address: "789 Pine Rd", price: "$150", duration: "1 hr", icon: "❄️" },
    { time: "11:00 AM", service: "Lawn Mowing", customer: "Sarah M.", address: "123 Main St", price: "$185", duration: "1.5 hrs", icon: "🌿" },
    { time: "2:00 PM", service: "Pressure Wash", customer: "James L.", address: "456 Oak Ave", price: "$320", duration: "2 hrs", icon: "💧" },
  ],
  27: [
    { time: "8:00 AM", service: "Roof Cleaning", customer: "Tom B.", address: "555 Cedar Ln", price: "$450", duration: "3 hrs", icon: "🏠" },
    { time: "1:00 PM", service: "Lawn Mowing", customer: "David K.", address: "321 Elm St", price: "$165", duration: "1 hr", icon: "🌿" },
  ],
  28: [
    { time: "10:00 AM", service: "Electrical", customer: "Lisa W.", address: "890 Birch Dr", price: "$200", duration: "1.5 hrs", icon: "⚡" },
  ],
  29: [
    { time: "9:00 AM", service: "Lawn Mowing", customer: "Sarah M.", address: "123 Main St", price: "$185", duration: "1.5 hrs", icon: "🌿" },
    { time: "12:00 PM", service: "Handyman", customer: "Mike P.", address: "234 Maple Ave", price: "$175", duration: "2 hrs", icon: "🛠️" },
    { time: "3:00 PM", service: "Pressure Wash", customer: "Ana S.", address: "678 Walnut St", price: "$280", duration: "1.5 hrs", icon: "💧" },
  ],
};

const ProviderSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(26);
  const jobs = scheduleData[selectedDate] || [];
  const dayEarnings = jobs.reduce((sum, j) => sum + parseInt(j.price.replace("$", "")), 0);

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">March 2024</h3>
        <div className="flex gap-1">
          <button className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-1">
        {days.map((day, i) => {
          const date = dates[i];
          const hasJobs = scheduleData[date] && scheduleData[date].length > 0;
          const isSelected = date === selectedDate;
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(date)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                isSelected ? "bg-primary text-primary-foreground" : "bg-card border border-border"
              }`}
            >
              <span className="text-[10px] font-medium opacity-70">{day}</span>
              <span className="text-sm font-semibold">{date}</span>
              {hasJobs && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Day summary */}
      <div className="flex items-center justify-between bg-muted rounded-xl px-4 py-2.5">
        <span className="text-xs text-muted-foreground">{jobs.length} job{jobs.length !== 1 ? "s" : ""} scheduled</span>
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
                    <span className="text-lg">{job.icon}</span>
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
