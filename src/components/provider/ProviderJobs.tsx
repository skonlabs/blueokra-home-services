import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, MapPin, DollarSign, Navigation, QrCode, Loader2, MessageSquare, Inbox, ThumbsDown, Calendar } from "lucide-react";
import ServiceIcon from "@/components/shared/ServiceIcon";
import { useProviderJobs, useProviderLeads } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export interface Job {
  id: string;
  leadId?: string;
  service: string;
  serviceType: string;
  customer: string;
  address: string;
  date: string;
  price: string;
  status: string;
  serviceId?: string;
}

type TabKey = "all" | "new" | "in_progress" | "completed" | "declined";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New Requests" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "declined", label: "Declined" },
];

interface ProviderJobsProps {
  initialTab?: TabKey;
  onCompleteJob: (job: Job) => void;
}

const ProviderJobs = ({ initialTab, onCompleteJob }: ProviderJobsProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab || "all");
  const { user } = useAuth();
  const { data: rawJobs, isLoading: jobsLoading } = useProviderJobs();
  const { data: rawLeads, isLoading: leadsLoading } = useProviderLeads();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isLoading = jobsLoading || leadsLoading;

  // Map appointments to jobs
  const appointmentJobs: Job[] = (rawJobs || []).map((j) => {
    const service = j.booking_service as any;
    const customerProfile = (j as any).customer_profile;
    return {
      id: j.id,
      service: service?.package_name || service?.service_type || "Service",
      serviceType: service?.service_type || "lawn",
      customer: customerProfile?.display_name || 
                [customerProfile?.first_name, customerProfile?.last_name].filter(Boolean).join(" ") || 
                "Customer",
      address: service?.notes || customerProfile?.address || "Address pending",
      date: (() => { try { const d = new Date(j.appointment_date); return isNaN(d.getTime()) ? "N/A" : format(d, "MMM d, h:mm a"); } catch { return "N/A"; } })(),
      price: service?.revenue ? `$${service.revenue}` : "TBD",
      status: j.appointment_status as string,
    };
  });

  // Map leads to jobs (these are new requests not yet accepted)
  const leadJobs: Job[] = (rawLeads || []).map((l: any) => {
    const svc = l.booking_service;
    const cp = l.customer_profile;
    return {
      id: `lead-${l.id}`,
      leadId: l.id,
      serviceId: l.service_id,
      service: svc?.package_name || svc?.service_type || "Service",
      serviceType: svc?.service_type || "lawn",
      customer: cp?.display_name || [cp?.first_name, cp?.last_name].filter(Boolean).join(" ") || "Customer",
      address: svc?.notes || cp?.address || "Address pending",
      date: (() => { try { if (l.appointment_date) { const d = new Date(l.appointment_date); return isNaN(d.getTime()) ? "N/A" : format(d, "MMM d, h:mm a"); } return "TBD"; } catch { return "N/A"; } })(),
      price: svc?.revenue ? `$${svc.revenue}` : "TBD",
      status: "new_lead",
    };
  });

  // Combine: leads show as "new", appointments show for other statuses
  const allJobs = [...leadJobs, ...appointmentJobs];

  const filterJobs = (tab: TabKey): Job[] => {
    switch (tab) {
      case "new": return jobs.filter((j) => ["scheduled", "new", "pending"].includes(j.status));
      case "in_progress": return jobs.filter((j) => ["confirmed", "in_progress"].includes(j.status));
      case "completed": return jobs.filter((j) => j.status === "completed");
      case "declined": return jobs.filter((j) => ["declined", "cancelled"].includes(j.status));
      default: return jobs;
    }
  };

  const filteredJobs = filterJobs(activeTab);

  const getTabCount = (tab: TabKey) => filterJobs(tab).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => {
          const count = getTabCount(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-foreground"
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Job list */}
      {filteredJobs.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Inbox className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-display font-semibold text-foreground text-base">
            {activeTab === "new" ? "No new requests" : activeTab === "declined" ? "No declined jobs" : activeTab === "completed" ? "No completed jobs" : "No jobs yet"}
          </p>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            {activeTab === "new" ? "New jobs will appear here when customers book services in your area" : "Jobs matching this filter will show here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job, i) => (
            <JobCard
              key={job.id}
              job={job}
              index={i}
              onComplete={["confirmed", "in_progress"].includes(job.status) ? () => onCompleteJob(job) : undefined}
            />
          ))}
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
  const isPending = ["scheduled", "new", "pending"].includes(job.status);
  const isActive = ["confirmed", "in_progress"].includes(job.status);
  const isCompleted = job.status === "completed";
  const isDeclined = ["declined", "cancelled"].includes(job.status);

  const rawPrice = parseFloat(job.price.replace(/[^0-9.]/g, ""));
  const netEarnings = !isNaN(rawPrice) ? `(~$${Math.round(rawPrice * 0.88)} after fees)` : null;

  const statusBadge = isPending
    ? { bg: "bg-warm-50 text-warm-500", label: "New" }
    : isCompleted
    ? { bg: "bg-okra-50 text-okra-600", label: "Done" }
    : isDeclined
    ? { bg: "bg-destructive/10 text-destructive", label: "Declined" }
    : { bg: "bg-blue-50 text-blue-500", label: "Active" };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
      className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ServiceIcon serviceType={job.serviceType} size="sm" />
          <div>
            <p className="font-semibold text-sm text-foreground">{job.service}</p>
            <p className="text-xs text-muted-foreground">{job.customer}</p>
          </div>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusBadge.bg}`}>
          {statusBadge.label}
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

      {isDeclined && (
        <div className="flex items-center gap-2 bg-destructive/5 rounded-xl p-2.5">
          <ThumbsDown className="w-4 h-4 text-destructive" />
          <p className="text-xs text-destructive font-medium">This job was declined</p>
        </div>
      )}
    </motion.div>
  );
};

export default ProviderJobs;
