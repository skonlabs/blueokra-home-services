import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, MapPin, DollarSign, Navigation, QrCode, Loader2, MessageSquare, Inbox } from "lucide-react";
import { useProviderJobs } from "@/hooks/useBookings";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface Job {
  id: string;
  service: string;
  icon: string;
  customer: string;
  address: string;
  date: string;
  price: string;
  status: string;
}

const serviceIcons: Record<string, string> = {
  lawn: "🌿", hvac: "❄️", plumbing: "🔧", pressure: "💧",
  roof: "🏠", electrical: "⚡", handyman: "🛠️",
};

interface ProviderJobsProps {
  onCompleteJob: (job: Job) => void;
}

const ProviderJobs = ({ onCompleteJob }: ProviderJobsProps) => {
  const { data: rawJobs, isLoading } = useProviderJobs();

  const jobs: Job[] = (rawJobs || []).map((j) => {
    const service = j.booking_service as any;
    return {
      id: j.id,
      service: service?.package_name || service?.service_type || "Service",
      icon: serviceIcons[service?.service_type] || "🔧",
      customer: "Customer",
      address: "123 Main St",
      date: format(new Date(j.appointment_date), "MMM d, h:mm a"),
      price: service?.revenue ? `$${service.revenue}` : "TBD",
      status: j.appointment_status as string,
    };
  });

  const pendingJobs = jobs.filter((j) => j.status === "scheduled" || j.status === "new" || j.status === "pending");
  const activeJobs = jobs.filter((j) => j.status === "confirmed" || j.status === "in_progress");
  const completedJobs = jobs.filter((j) => j.status === "completed");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="px-4 py-12 text-center flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <Inbox className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="font-display font-semibold text-foreground text-base">No new requests</p>
        <p className="text-xs text-muted-foreground max-w-[240px]">New jobs will appear here when customers book services in your area</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24 space-y-5">
      {pendingJobs.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            New Requests
            <span className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 rounded-full">{pendingJobs.length}</span>
          </h3>
          <div className="space-y-3">
            {pendingJobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
          </div>
        </div>
      )}
      {activeJobs.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground mb-2">Today's Jobs</h3>
          <div className="space-y-3">
            {activeJobs.map((job, i) => <JobCard key={job.id} job={job} index={i} onComplete={() => onCompleteJob(job)} />)}
          </div>
        </div>
      )}
      {completedJobs.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground mb-2">Completed</h3>
          <div className="space-y-3">
            {completedJobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
};

interface JobCardProps {
  job: Job;
  index: number;
  onComplete?: () => void;
}

const JobCard = ({ job, index, onComplete }: JobCardProps) => {
  const { toast } = useToast();
  const isPending = job.status === "scheduled" || job.status === "new" || job.status === "pending";
  const isActive = job.status === "confirmed" || job.status === "in_progress";
  const isCompleted = job.status === "completed";

  const rawPrice = parseFloat(job.price.replace(/[^0-9.]/g, ""));
  const netEarnings = !isNaN(rawPrice) ? `(~$${Math.round(rawPrice * 0.88)} after fees)` : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{job.icon}</span>
          <div>
            <p className="font-semibold text-sm text-foreground">{job.service}</p>
            <p className="text-xs text-muted-foreground">{job.customer}</p>
          </div>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${isPending ? "bg-warm-50 text-warm-500" : isCompleted ? "bg-okra-50 text-okra-600" : "bg-blue-50 text-blue-500"}`}>
          {isPending ? "New" : isCompleted ? "Done" : "Active"}
        </span>
      </div>

      {isPending && netEarnings && (
        <p className="text-[11px] text-muted-foreground">{netEarnings}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.date}</span>
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.address}</span>
        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.price}</span>
      </div>

      {isActive && onComplete && (
        <div className="flex gap-2">
          <button
            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`, '_blank')}
            className="flex-1 bg-muted text-foreground text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
          >
            <Navigation className="w-4 h-4" /> Navigate
          </button>
          <button
            onClick={() => toast({ title: "Messaging coming soon" })}
            className="w-11 bg-muted text-muted-foreground rounded-xl flex items-center justify-center active:scale-[0.97] transition-transform"
            aria-label="Message customer"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={onComplete}
            className="flex-1 bg-success text-success-foreground text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
          >
            <QrCode className="w-4 h-4" /> Complete
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-2 bg-okra-50 rounded-xl p-2.5">
          <Check className="w-4 h-4 text-okra-600" />
          <p className="text-xs text-okra-600 font-medium">Payment of {job.price} captured</p>
        </div>
      )}
    </motion.div>
  );
};

export default ProviderJobs;
