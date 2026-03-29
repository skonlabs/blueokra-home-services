import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, DollarSign, CalendarDays, Clock, TrendingUp, AlertCircle, Loader2, User as UserIcon, Camera, Smartphone, ChevronRight, MapPin } from "lucide-react";
import { useProviderJobs, useProviderEarnings } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import ServiceIcon from "@/components/shared/ServiceIcon";
import { format } from "date-fns";

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

interface ProviderHomeProps {
  onNavigate: (screen: string, params?: Record<string, string>) => void;
}

const ProviderHome = ({ onNavigate }: ProviderHomeProps) => {
  const { user, profile } = useAuth();
  const { data: rawJobs, isLoading: jobsLoading } = useProviderJobs();
  const { data: earnings, isLoading: earningsLoading } = useProviderEarnings();

  const isLoading = jobsLoading || earningsLoading;

  const jobs = rawJobs || [];
  const newRequests = jobs.filter((j) => ["scheduled", "new", "pending"].includes(j.appointment_status as string));
  const upcomingJobs = jobs.filter((j) => ["confirmed", "in_progress"].includes(j.appointment_status as string));
  const completedJobs = jobs.filter((j) => j.appointment_status === "completed");

  const totalEarned = (earnings || []).reduce((sum, e) => sum + (e.provider_amount || 0), 0);
  const pendingPayments = (earnings || []).filter((e) => e.payment_status === "pending").reduce((sum, e) => sum + (e.provider_amount || 0), 0);

  // Action needed items
  const actionItems: { label: string; description: string; icon: React.ReactNode; action: string }[] = [];
  if (!profile?.profile_photo_url) {
    actionItems.push({ label: "Add profile photo", description: "Help customers recognize you", icon: <Camera className="w-4 h-4 text-primary" />, action: "provider-profile" });
  }
  if (!profile?.venmo_phone) {
    actionItems.push({ label: "Set up Venmo", description: "Required to receive payments", icon: <Smartphone className="w-4 h-4 text-primary" />, action: "provider-profile" });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24 space-y-5">
      {/* Greeting - compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <h1 className="font-display text-lg font-bold text-foreground">
            {getGreeting()}, {profile?.first_name || profile?.display_name || "Pro"} 👋
          </h1>
        </div>
      </div>

      {/* Action Needed */}
      {actionItems.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-accent" />
            Action Needed
          </h3>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => onNavigate(item.action)}
                className="w-full bg-accent/10 border border-accent/20 rounded-xl p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onClick={() => onNavigate("provider-jobs", { tab: "new" })}
          className="bg-card rounded-2xl border border-border p-4 text-left active:scale-[0.97] transition-transform"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-accent" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{newRequests.length}</p>
          <p className="text-xs text-muted-foreground">New Requests</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => onNavigate("provider-jobs", { tab: "in_progress" })}
          className="bg-card rounded-2xl border border-border p-4 text-left active:scale-[0.97] transition-transform"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{upcomingJobs.length}</p>
          <p className="text-xs text-muted-foreground">Upcoming Jobs</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={() => onNavigate("provider-earnings")}
          className="bg-card rounded-2xl border border-border p-4 text-left active:scale-[0.97] transition-transform"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-success/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">${totalEarned.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Total Earned</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          onClick={() => onNavigate("provider-earnings")}
          className="bg-card rounded-2xl border border-border p-4 text-left active:scale-[0.97] transition-transform"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-warm-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-warm-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">${pendingPayments.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Pending Payments</p>
        </motion.button>
      </div>

      {/* Upcoming jobs preview - clickable like schedule */}
      {upcomingJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-semibold text-foreground">Upcoming Jobs</h3>
            <button onClick={() => onNavigate("provider-schedule")} className="text-xs text-primary font-medium">View Schedule</button>
          </div>
          <div className="space-y-2">
            {upcomingJobs.slice(0, 3).map((job, i) => {
              const service = job.booking_service as any;
              const cp = (job as any).customer_profile;
              const dateStr = (() => { try { const d = new Date(job.appointment_date); return isNaN(d.getTime()) ? "TBD" : format(d, "h:mm a"); } catch { return "TBD"; } })();
              const dateLabel = (() => { try { const d = new Date(job.appointment_date); return isNaN(d.getTime()) ? "" : format(d, "MMM d"); } catch { return ""; } })();
              const customerName = cp?.display_name || [cp?.first_name, cp?.last_name].filter(Boolean).join(" ") || "Customer";
              const revenue = service?.revenue ? Number(service.revenue) : 0;
              const feeP = revenue < 150 ? 0.20 : revenue <= 400 ? 0.25 : 0.30;
              const providerEarnings = Math.round(revenue * (1 - feeP));
              const statusColor = job.appointment_status === "confirmed" ? "text-success" : "text-warm-500";
              const address = cp?.address || service?.notes || "Address pending";
              return (
                <ExpandableJobCard
                  key={job.id}
                  index={i}
                  serviceType={service?.service_type || "lawn"}
                  serviceName={service?.package_name || service?.service_type || "Service"}
                  status={job.appointment_status || "pending"}
                  statusColor={statusColor}
                  earnings={providerEarnings}
                  dateLabel={dateLabel}
                  timeStr={dateStr}
                  customerName={customerName}
                  address={address}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* New requests preview */}
      {newRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              New Requests
              <span className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 rounded-full">{newRequests.length}</span>
            </h3>
            <button onClick={() => onNavigate("provider-jobs")} className="text-xs text-primary font-medium">View All</button>
          </div>
          <div className="space-y-2">
            {newRequests.slice(0, 2).map((job, i) => {
              const service = job.booking_service as any;
              return (
                <motion.div key={job.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl border border-border p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <ServiceIcon serviceType={service?.service_type || "lawn"} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{service?.package_name || "Service"}</p>
                      <p className="text-xs text-muted-foreground">New request</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full font-medium bg-warm-50 text-warm-500">Pending</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent payments */}
      {(earnings || []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-semibold text-foreground">Recent Payments</h3>
            <button onClick={() => onNavigate("provider-earnings")} className="text-xs text-primary font-medium">View All</button>
          </div>
          <div className="space-y-2">
            {(earnings || []).slice(0, 3).map((txn, i) => (
              <motion.div key={txn.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${txn.payment_status === "paid" ? "bg-success/10" : "bg-muted"}`}>
                    <DollarSign className={`w-4 h-4 ${txn.payment_status === "paid" ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">${txn.provider_amount || txn.total_amount}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(txn.created_at), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${txn.payment_status === "paid" ? "bg-success/10 text-success" : "bg-warm-50 text-warm-500"}`}>
                  {txn.payment_status === "paid" ? "Received" : "Pending"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Expandable job card sub-component (matches schedule screen)
interface ExpandableJobCardProps {
  index: number;
  serviceType: string;
  serviceName: string;
  status: string;
  statusColor: string;
  earnings: number;
  dateLabel: string;
  timeStr: string;
  customerName: string;
  address: string;
}

const ExpandableJobCard = ({ index, serviceType, serviceName, status, statusColor, earnings, dateLabel, timeStr, customerName, address }: ExpandableJobCardProps) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left bg-card rounded-xl border border-border p-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <ServiceIcon serviceType={serviceType} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{serviceName}</p>
          <span className={`text-[10px] font-medium capitalize ${statusColor}`}>{(status).replace("_", " ")}</span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-foreground">${earnings}</p>
          <p className="text-[10px] text-muted-foreground">earnings</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0" />{dateLabel} {timeStr}</span>
        <span className="flex items-center gap-1"><UserIcon className="w-3 h-3 shrink-0" />{customerName}</span>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="break-words">{address}</span>
          </div>
        </div>
      )}
    </motion.button>
  );
};

export default ProviderHome;
