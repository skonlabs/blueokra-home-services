import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, MapPin, DollarSign, Navigation, QrCode, ChevronRight, Camera, Phone, MessageSquare } from "lucide-react";

export interface Job {
  id: string;
  service: string;
  customer: string;
  address: string;
  time: string;
  price: string;
  status: "pending" | "accepted" | "in_progress" | "completed";
  icon: string;
  description?: string;
  images?: number;
  distance?: string;
  duration?: string;
}

const mockJobs: Job[] = [
  { id: "1", service: "Lawn Mowing", customer: "Sarah M.", address: "123 Main St", time: "2:00 PM", price: "$185", status: "pending", icon: "🌿", description: "Front and backyard, edge trimming needed", images: 2, distance: "3.2 mi", duration: "1.5 hrs" },
  { id: "2", service: "Pressure Wash", customer: "James L.", address: "456 Oak Ave", time: "4:30 PM", price: "$320", status: "accepted", icon: "💧", description: "Driveway and patio, moderate staining", distance: "5.1 mi", duration: "2 hrs" },
  { id: "3", service: "HVAC Tune-up", customer: "Amy R.", address: "789 Pine Rd", time: "Tomorrow 9am", price: "$150", status: "accepted", icon: "❄️", description: "Annual maintenance, Carrier system", distance: "2.8 mi", duration: "1 hr" },
  { id: "4", service: "Lawn Mowing", customer: "David K.", address: "321 Elm St", time: "Tomorrow 2pm", price: "$165", status: "pending", icon: "🌿", description: "Regular weekly mow, small yard", distance: "1.5 mi", duration: "1 hr" },
];

interface ProviderJobsProps {
  onCompleteJob: (jobId: string) => void;
}

const ProviderJobs = ({ onCompleteJob }: ProviderJobsProps) => {
  const [jobs, setJobs] = useState(mockJobs);

  const handleAccept = (id: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "accepted" } : j)));
  };

  const handleDecline = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const pendingJobs = jobs.filter((j) => j.status === "pending");
  const activeJobs = jobs.filter((j) => j.status === "accepted" || j.status === "in_progress");
  const completedJobs = jobs.filter((j) => j.status === "completed");

  return (
    <div className="px-4 py-4 pb-24 space-y-5">
      {/* Pending */}
      {pendingJobs.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            New Requests
            <span className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 rounded-full">{pendingJobs.length}</span>
          </h3>
          <div className="space-y-3">
            {pendingJobs.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} onAccept={handleAccept} onDecline={handleDecline} />
            ))}
          </div>
        </div>
      )}

      {/* Active */}
      {activeJobs.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground mb-2">Today's Jobs</h3>
          <div className="space-y-3">
            {activeJobs.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} onComplete={() => onCompleteJob(job.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedJobs.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground mb-2">Completed</h3>
          <div className="space-y-3">
            {completedJobs.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface JobCardProps {
  job: Job;
  index: number;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onComplete?: () => void;
}

const JobCard = ({ job, index, onAccept, onDecline, onComplete }: JobCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
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
        <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${
          job.status === "pending" ? "bg-warm-50 text-warm-500" :
          job.status === "completed" ? "bg-okra-50 text-okra-600" :
          "bg-blue-50 text-blue-500"
        }`}>
          {job.status === "pending" ? "New" : job.status === "completed" ? "Done" : "Active"}
        </span>
      </div>

      {job.description && (
        <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2">{job.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.time}</span>
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.distance || job.address}</span>
        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.price}</span>
        {job.duration && <span className="flex items-center gap-1">⏱ {job.duration}</span>}
      </div>

      {/* Actions */}
      {job.status === "pending" && onAccept && (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(job.id)}
            className="flex-1 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
          >
            <Check className="w-4 h-4" /> Accept
          </button>
          <button
            onClick={() => onDecline?.(job.id)}
            className="w-12 bg-muted text-muted-foreground rounded-xl flex items-center justify-center active:scale-[0.97] transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {(job.status === "accepted" || job.status === "in_progress") && (
        <div className="flex gap-2">
          <button className="flex-1 bg-muted text-foreground text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Navigation className="w-4 h-4" /> Navigate
          </button>
          <button
            onClick={onComplete}
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
  );
};

export default ProviderJobs;
