import { motion } from "framer-motion";
import { Check, X, Clock, MapPin, DollarSign, Navigation, QrCode, Camera } from "lucide-react";
import { useState } from "react";

interface Job {
  id: string;
  service: string;
  customer: string;
  address: string;
  time: string;
  price: string;
  status: "pending" | "accepted" | "in_progress" | "completed";
  icon: string;
}

const mockJobs: Job[] = [
  { id: "1", service: "Lawn Mowing", customer: "Sarah M.", address: "123 Main St", time: "2:00 PM", price: "$185", status: "pending", icon: "🌿" },
  { id: "2", service: "Pressure Wash", customer: "James L.", address: "456 Oak Ave", time: "4:30 PM", price: "$320", status: "accepted", icon: "💧" },
  { id: "3", service: "HVAC Tune-up", customer: "Amy R.", address: "789 Pine Rd", time: "Tomorrow 9am", price: "$150", status: "accepted", icon: "❄️" },
];

const ProviderDashboard = () => {
  const [jobs, setJobs] = useState(mockJobs);
  const [activeTab, setActiveTab] = useState<"jobs" | "schedule" | "earnings">("jobs");

  const handleAccept = (id: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "accepted" } : j)));
  };

  const handleDecline = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleComplete = (id: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "completed" } : j)));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-sm">Good afternoon</p>
            <h1 className="font-display text-xl font-bold text-primary-foreground">Mike's Services</h1>
          </div>
          <div className="text-right">
            <p className="text-primary-foreground/70 text-xs">Today's earnings</p>
            <p className="text-primary-foreground font-bold text-lg">$505</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 -mt-3">
        {(["jobs", "schedule", "earnings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "bg-primary/10 text-primary"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Job Cards */}
      <div className="px-4 py-4 space-y-3">
        {activeTab === "jobs" && jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{job.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{job.service}</p>
                  <p className="text-xs text-muted-foreground">{job.customer}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                job.status === "pending" ? "bg-warm-50 text-warm-500" :
                job.status === "completed" ? "bg-okra-50 text-okra-600" :
                "bg-blue-50 text-blue-500"
              }`}>
                {job.status === "pending" ? "New" : job.status === "completed" ? "Done" : "Accepted"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.time}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.address}</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.price}</span>
            </div>

            {/* Actions */}
            {job.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(job.id)}
                  className="flex-1 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => handleDecline(job.id)}
                  className="w-12 bg-muted text-muted-foreground rounded-xl flex items-center justify-center active:scale-[0.97] transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {job.status === "accepted" && (
              <div className="flex gap-2">
                <button className="flex-1 bg-muted text-foreground text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                  <Navigation className="w-4 h-4" /> Navigate
                </button>
                <button
                  onClick={() => handleComplete(job.id)}
                  className="flex-1 bg-success text-success-foreground text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                >
                  <QrCode className="w-4 h-4" /> Complete
                </button>
              </div>
            )}
            {job.status === "completed" && (
              <div className="flex items-center gap-2 bg-okra-50 rounded-xl p-2.5">
                <Check className="w-4 h-4 text-okra-600" />
                <p className="text-xs text-okra-600 font-medium">Payment of {job.price} captured</p>
              </div>
            )}
          </motion.div>
        ))}

        {activeTab === "schedule" && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Schedule view coming soon</p>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-5 text-center">
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="font-display text-3xl font-bold text-foreground mt-1">$2,340</p>
              <p className="text-xs text-secondary mt-1">↑ 12% from last week</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Jobs Done</p>
                <p className="text-xl font-bold text-foreground mt-1">14</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="text-xl font-bold text-foreground mt-1">4.9 ⭐</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Need Calendar import for schedule tab
import { Calendar } from "lucide-react";

export default ProviderDashboard;
