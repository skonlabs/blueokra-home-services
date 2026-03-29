import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Clock, MapPin, DollarSign, Navigation, QrCode, Loader2, MessageSquare, Inbox, ThumbsDown, Calendar, TrendingUp, Repeat, AlertCircle } from "lucide-react";
import ServiceIcon from "@/components/shared/ServiceIcon";
import { useProviderJobs, useProviderLeads } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format, addMonths } from "date-fns";

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
  // Enhanced lead fields
  city?: string;
  state?: string;
  frequency?: string;
  firstServiceDate?: string;
  receivedAt?: string;
  totalRevenue?: number;
  firstServicePrice?: number;
  recurringPrice?: number;
  appointmentCount?: number;
  expectedEndDate?: string;
  customizations?: any;
}

type TabKey = "all" | "new" | "in_progress" | "completed" | "declined";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New Requests" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "declined", label: "Declined" },
];

const FREQUENCY_LABELS: Record<string, string> = {
  "one-time": "One-Time",
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

const FREQUENCY_PER_YEAR: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  "one-time": 1,
};

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
    const revenue = svc?.revenue ? Number(svc.revenue) : 0;
    const frequency = svc?.frequency || "one-time";
    const apptCount = l.appointment_count || 1;
    const perYear = FREQUENCY_PER_YEAR[frequency] || 1;
    
    // Calculate pricing using actual platform economics
    // < $150 → 20% fee, $150-$400 → 25% fee, > $400 → 30% fee
    const feePercent = revenue < 150 ? 0.20 : revenue <= 400 ? 0.25 : 0.30;
    const firstServicePrice = revenue;
    const recurringPrice = frequency !== "one-time" ? Math.round(revenue * 0.85) : 0;
    const totalRevenue = frequency === "one-time" 
      ? revenue 
      : firstServicePrice + (recurringPrice * (apptCount > 1 ? apptCount - 1 : Math.max(perYear - 1, 0)));
    const providerEarningsPercent = 1 - feePercent;

    // Expected end date
    let expectedEnd = "";
    if (frequency !== "one-time" && l.appointment_dates?.length) {
      const lastDate = l.appointment_dates[l.appointment_dates.length - 1];
      try {
        const d = new Date(lastDate);
        if (!isNaN(d.getTime())) expectedEnd = format(d, "MMM yyyy");
      } catch { /* */ }
    }
    if (!expectedEnd && frequency !== "one-time") {
      try {
        const startDate = l.appointment_date ? new Date(l.appointment_date) : new Date();
        const monthsAhead = Math.round(12 / (perYear || 1)) * Math.max(perYear, 1);
        expectedEnd = format(addMonths(startDate, 12), "MMM yyyy");
      } catch { /* */ }
    }

    return {
      id: `lead-${l.id}`,
      leadId: l.id,
      serviceId: l.service_id,
      service: svc?.package_name || svc?.service_type || "Service",
      serviceType: svc?.service_type || "lawn",
      customer: cp?.display_name || [cp?.first_name, cp?.last_name].filter(Boolean).join(" ") || "Customer",
      address: svc?.notes || cp?.address || "Address pending",
      date: (() => { try { if (l.appointment_date) { const d = new Date(l.appointment_date); return isNaN(d.getTime()) ? "N/A" : format(d, "MMM d, h:mm a"); } return "TBD"; } catch { return "N/A"; } })(),
      price: revenue ? `$${revenue}` : "TBD",
      status: "new_lead",
      city: cp?.city || "",
      state: cp?.state || "WA",
      frequency,
      firstServiceDate: l.appointment_date || null,
      receivedAt: l.created_at || null,
      totalRevenue,
      firstServicePrice,
      recurringPrice,
      appointmentCount: apptCount,
      expectedEndDate: expectedEnd,
      customizations: svc?.customizations,
    };
  });

  const allJobs = [...leadJobs, ...appointmentJobs];

  const filterJobs = (tab: TabKey): Job[] => {
    switch (tab) {
      case "new": return allJobs.filter((j) => ["new_lead"].includes(j.status));
      case "in_progress": return allJobs.filter((j) => ["scheduled", "new", "pending", "confirmed", "in_progress"].includes(j.status));
      case "completed": return allJobs.filter((j) => j.status === "completed");
      case "declined": return allJobs.filter((j) => ["declined", "cancelled"].includes(j.status));
      default: return allJobs;
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
              onComplete={["confirmed", "in_progress", "scheduled"].includes(job.status) ? () => onCompleteJob(job) : undefined}
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNewLead = job.status === "new_lead";
  const isPending = ["scheduled", "new", "pending"].includes(job.status);
  const isActive = ["confirmed", "in_progress"].includes(job.status);
  const isCompleted = job.status === "completed";
  const isDeclined = ["declined", "cancelled"].includes(job.status);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const handleAcceptLead = async () => {
    if (!user || !job.leadId || !job.serviceId) return;
    setAccepting(true);
    try {
      const { data, error } = await supabase.rpc("provider_respond_service", {
        _user_id: user.id,
        _service_id: job.serviceId,
        _response_type: "accepted",
      });
      if (error) throw error;
      toast({ title: "Job accepted!", description: "You've been assigned this service." });
      queryClient.invalidateQueries({ queryKey: ["provider-leads"] });
      queryClient.invalidateQueries({ queryKey: ["provider-jobs"] });
    } catch (err: any) {
      toast({ title: "Failed to accept", description: err.message, variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineLead = async () => {
    if (!user || !job.leadId || !job.serviceId) return;
    setDeclining(true);
    try {
      const { data, error } = await supabase.rpc("provider_respond_service", {
        _user_id: user.id,
        _service_id: job.serviceId,
        _response_type: "declined",
      });
      if (error) throw error;
      toast({ title: "Job declined" });
      queryClient.invalidateQueries({ queryKey: ["provider-leads"] });
    } catch (err: any) {
      toast({ title: "Failed to decline", description: err.message, variant: "destructive" });
    } finally {
      setDeclining(false);
    }
  };

  const statusBadge = isNewLead
    ? { bg: "bg-warm-50 text-warm-500", label: "New Request" }
    : isPending
    ? { bg: "bg-warm-50 text-warm-500", label: "Pending" }
    : isCompleted
    ? { bg: "bg-okra-50 text-okra-600", label: "Done" }
    : isDeclined
    ? { bg: "bg-destructive/10 text-destructive", label: "Declined" }
    : { bg: "bg-blue-50 text-blue-500", label: "In Progress" };

  // New lead card with detailed breakdown
  if (isNewLead) {
    const freqLabel = FREQUENCY_LABELS[job.frequency || "one-time"] || job.frequency || "One-Time";
    const isRecurring = job.frequency && job.frequency !== "one-time";
    const receivedFormatted = job.receivedAt
      ? (() => { try { return format(new Date(job.receivedAt), "MMM d, yyyy 'at' h:mm a"); } catch { return ""; } })()
      : "";
    const startDateFormatted = job.firstServiceDate
      ? (() => { try { return format(new Date(job.firstServiceDate), "EEE, MMM d, yyyy"); } catch { return "Requested (date pending)"; } })()
      : "Requested (date pending)";

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
        className="bg-card rounded-2xl border-2 border-primary/20 p-4 space-y-3">
        {/* Header */}
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

        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>{[job.city, job.state].filter(Boolean).join(", ") || job.address}</span>
        </div>

        {/* Pricing breakdown */}
        <div className="bg-muted/60 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Pricing Breakdown</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">First service</span>
            <span className="text-sm font-bold text-primary">
              ${job.firstServicePrice?.toFixed(0) || job.price}
            </span>
          </div>

          {isRecurring && job.recurringPrice ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">2nd service onwards</span>
                <span className="text-sm font-semibold text-foreground">${job.recurringPrice.toFixed(0)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="text-xs font-medium text-foreground">Total contract value</span>
                <span className="text-base font-bold text-primary">${job.totalRevenue?.toLocaleString() || "TBD"}</span>
              </div>
              {job.expectedEndDate && (
                <p className="text-[11px] text-muted-foreground">
                  Expected through {job.expectedEndDate}
                </p>
              )}
            </>
          ) : (
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="text-xs font-medium text-foreground">Total job value</span>
              <span className="text-base font-bold text-primary">${job.totalRevenue?.toLocaleString() || job.price}</span>
            </div>
          )}

          {/* Net earnings estimate */}
          {job.totalRevenue ? (() => {
            const feeP = job.firstServicePrice && job.firstServicePrice < 150 ? 20 : job.firstServicePrice && job.firstServicePrice <= 400 ? 25 : 30;
            const earningsP = 100 - feeP;
            return (
              <p className="text-[11px] text-muted-foreground italic">
                ~${Math.round(job.totalRevenue * earningsP / 100).toLocaleString()} your earnings ({earningsP}% after {feeP}% platform fee)
              </p>
            );
          })() : null}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/40 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Repeat className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Frequency</span>
            </div>
            <p className="text-xs font-semibold text-foreground">{freqLabel}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Start Date</span>
            </div>
            <p className="text-xs font-semibold text-foreground">{startDateFormatted}</p>
          </div>
        </div>

        {/* Flexible date note */}
        <div className="flex items-start gap-2 bg-accent/30 rounded-lg p-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Start date can be adjusted based on your availability after accepting.
          </p>
        </div>

        {/* Received timestamp */}
        {receivedFormatted && (
          <p className="text-[10px] text-muted-foreground text-right">
            Received {receivedFormatted}
          </p>
        )}

        {/* Accept / Decline */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDeclineLead}
            disabled={declining || accepting}
            className="flex-1 bg-muted text-destructive text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {declining ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Decline
          </button>
          <button
            onClick={handleAcceptLead}
            disabled={accepting || declining}
            className="flex-1 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accept
          </button>
        </div>
      </motion.div>
    );
  }

  // Standard job card for non-lead statuses
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

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.date}</span>
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.address}</span>
        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.price}</span>
      </div>

      {(isActive || isPending) && onComplete && (
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
