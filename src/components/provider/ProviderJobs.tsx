import { useState } from "react";
import { computeEconomics } from "@/lib/quoteCalculator";
import { Loader2, Inbox } from "lucide-react";
import { useProviderJobs, useProviderLeads } from "@/hooks/useBookings";
import { format, addMonths } from "date-fns";
import type { ProviderJob, Appointment, TabKey } from "./jobs/types";
import { TABS, FREQUENCY_PER_YEAR } from "./jobs/types";
import JobCard from "./jobs/JobCard";

// Re-export Job type for backward compat
export type Job = ProviderJob;

interface ProviderJobsProps {
  initialTab?: TabKey;
  onCompleteJob: (job: ProviderJob) => void;
  onChat?: (userId: string, name: string) => void;
}

const ProviderJobs = ({ initialTab, onCompleteJob, onChat }: ProviderJobsProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab || "all");
  const { data: rawJobs, isLoading: jobsLoading } = useProviderJobs();
  const { data: rawLeads, isLoading: leadsLoading } = useProviderLeads();

  const isLoading = jobsLoading || leadsLoading;

  // Group appointments by service_id into ProviderJob objects
  const serviceJobs: ProviderJob[] = (() => {
    const grouped: Record<string, { service: any; customer: any; appointments: any[] }> = {};

    (rawJobs || []).forEach((j: any) => {
      const svc = j.booking_service as any;
      const serviceId = j.service_id || svc?.id;
      if (!serviceId) return;

      if (!grouped[serviceId]) {
        grouped[serviceId] = { service: svc, customer: j.customer_profile, appointments: [] };
      }
      grouped[serviceId].appointments.push(j);
    });

    return Object.entries(grouped).map(([serviceId, { service: svc, customer: cp, appointments: appts }]) => {
      const revenue = svc?.revenue ? Number(svc.revenue) : 0;
      const frequency = svc?.frequency || "one-time";
      const perYear = FREQUENCY_PER_YEAR[frequency] || 1;
      const isRecurring = frequency !== "one-time";

      const { marginPercent: feePercent } = computeEconomics(revenue);
      const firstServicePrice = revenue;
      const recurringPrice = isRecurring ? Math.round(revenue * 0.85) : 0;

      // Map appointments
      const customerName = cp?.display_name || [cp?.first_name, cp?.last_name].filter(Boolean).join(" ") || "Customer";
      const mappedAppts: Appointment[] = appts.map((a: any) => ({
        id: a.id,
        date: (() => { try { const d = new Date(a.appointment_date); return isNaN(d.getTime()) ? "N/A" : format(d, "MMM d, h:mm a"); } catch { return "N/A"; } })(),
        rawDate: a.appointment_date,
        status: a.appointment_status,
        customerStatus: a.customer_status,
        providerStatus: a.provider_status,
        customerUserId: a.customer_user_id || svc?.customer_user_id || "",
        serviceName: svc?.package_name || svc?.service_type || "Service",
        customerName,
        customerPhoto: cp?.profile_photo_url || undefined,
      }));

      const completedCount = mappedAppts.filter(a => a.status === "completed").length;
      const allCompleted = mappedAppts.length > 0 && completedCount === mappedAppts.length;
      const hasDeclined = mappedAppts.every(a => ["declined", "cancelled"].includes(a.status));

      // Expected end date
      let expectedEnd = "";
      if (isRecurring && appts.length) {
        const lastAppt = appts[appts.length - 1];
        try {
          const d = new Date(lastAppt.appointment_date);
          if (!isNaN(d.getTime())) expectedEnd = format(d, "MMM yyyy");
        } catch { /* */ }
      }
      if (!expectedEnd && isRecurring && appts[0]) {
        try {
          const startDate = new Date(appts[0].appointment_date);
          expectedEnd = format(addMonths(startDate, 12), "MMM yyyy");
        } catch { /* */ }
      }

      const jobStatus: ProviderJob["status"] = allCompleted
        ? "completed"
        : hasDeclined
        ? "declined"
        : "in_progress";

      return {
        id: `svc-${serviceId}`,
        serviceId,
        service: svc?.package_name || svc?.service_type || "Service",
        serviceType: svc?.service_type || "lawn",
        customer: cp?.display_name || [cp?.first_name, cp?.last_name].filter(Boolean).join(" ") || "Customer",
        address: svc?.notes || cp?.address || "Address pending",
        status: jobStatus,
        city: cp?.city || "",
        state: cp?.state || "",
        frequency,
        firstServiceDate: appts[0]?.appointment_date || svc?.created_at || null,
        receivedAt: svc?.created_at || null,
        firstServicePrice,
        recurringPrice,
        expectedEndDate: expectedEnd,
        customizations: svc?.customizations,
        appointments: mappedAppts,
        totalAppointments: mappedAppts.length,
        completedAppointments: completedCount,
      };
    });
  })();

  // Map leads to ProviderJob objects (new requests)
  const leadJobs: ProviderJob[] = (rawLeads || []).map((l: any) => {
    const svc = l.booking_service;
    const cp = l.customer_profile;
    const revenue = svc?.revenue ? Number(svc.revenue) : 0;
    const frequency = svc?.frequency || "one-time";
    const apptCount = l.appointment_count || 1;
    const perYear = FREQUENCY_PER_YEAR[frequency] || 1;
    const isRecurring = frequency !== "one-time";

    const firstServicePrice = revenue;
    const recurringPrice = isRecurring ? Math.round(revenue * 0.85) : 0;

    let expectedEnd = "";
    if (isRecurring && l.appointment_dates?.length) {
      const lastDate = l.appointment_dates[l.appointment_dates.length - 1];
      try { const d = new Date(lastDate); if (!isNaN(d.getTime())) expectedEnd = format(d, "MMM yyyy"); } catch { /* */ }
    }
    if (!expectedEnd && isRecurring) {
      try {
        const startDate = l.appointment_date ? new Date(l.appointment_date) : new Date();
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
      status: "new_lead" as const,
      city: cp?.city || "",
      state: cp?.state || "WA",
      frequency,
      firstServiceDate: l.appointment_dates?.[0] || l.appointment_date || svc?.created_at || null,
      receivedAt: l.created_at || null,
      firstServicePrice,
      recurringPrice,
      expectedEndDate: expectedEnd,
      customizations: svc?.customizations,
      appointments: [],
      totalAppointments: apptCount,
      completedAppointments: 0,
    };
  });

  const allJobs = [...leadJobs, ...serviceJobs];

  const filterJobs = (tab: TabKey): ProviderJob[] => {
    switch (tab) {
      case "new": return allJobs.filter(j => j.status === "new_lead");
      case "in_progress": return allJobs.filter(j => j.status === "in_progress");
      case "completed": return allJobs.filter(j => j.status === "completed");
      case "declined": return allJobs.filter(j => j.status === "declined");
      default: return allJobs;
    }
  };

  const filteredJobs = filterJobs(activeTab);
  const getTabCount = (tab: TabKey) => filterJobs(tab).length;

  const handleCompleteAppointment = (job: ProviderJob, appointment: Appointment) => {
    // Pass job-level data to the completion flow with the specific appointment id
    onCompleteJob({
      ...job,
      id: appointment.id, // The parent expects the appointment id for QR flow
    });
  };

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
              onCompleteAppointment={handleCompleteAppointment}
              onChat={onChat}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderJobs;
