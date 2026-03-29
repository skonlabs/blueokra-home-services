import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, DollarSign, Clock, ChevronDown, Loader2, FileText, Filter } from "lucide-react";
import ServiceIcon from "@/components/shared/ServiceIcon";
import { useProviderJobs } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const ProviderServiceHistory = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch completed appointments with service + payment data
  const { data: completedJobs, isLoading } = useQuery({
    queryKey: ["provider-service-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_appointment")
        .select(`
          id, appointment_date, appointment_status, customer_user_id,
          provider_user_id, provider_amount, customer_amount, platform_amount,
          notes, service_id,
          booking_service!inner (
            id, service_type, package_name, customer_user_id, revenue, notes, frequency, completed_at, created_at
          )
        `)
        .eq("provider_user_id", user!.id)
        .eq("appointment_status", "completed")
        .order("appointment_date", { ascending: false });

      if (error) throw error;

      // Also fetch payment data for these services
      const serviceIds = (data || []).map((d: any) => d.service_id).filter(Boolean);
      let payments: any[] = [];
      if (serviceIds.length > 0) {
        const { data: paymentData } = await supabase
          .from("payment_transaction")
          .select("*")
          .eq("provider_user_id", user!.id)
          .in("service_id", serviceIds);
        payments = paymentData || [];
      }

      return (data || []).map((job: any) => {
        const service = job.booking_service;
        const payment = payments.find((p: any) => p.service_id === job.service_id);
        return {
          id: job.id,
          serviceId: job.service_id,
          serviceType: service?.service_type || "general",
          packageName: service?.package_name || "Standard",
          appointmentDate: job.appointment_date,
          completedAt: service?.completed_at || job.appointment_date,
          frequency: service?.frequency,
          revenue: service?.revenue || 0,
          providerAmount: job.provider_amount || payment?.provider_amount || 0,
          platformFee: job.platform_amount || payment?.admin_amount || 0,
          totalAmount: payment?.total_amount || service?.revenue || 0,
          paymentStatus: payment?.payment_status || "pending",
          paymentMethod: payment?.payment_method_type || "N/A",
          notes: service?.notes || job.notes,
        };
      });
    },
  });

  // Available years
  const availableYears = useMemo(() => {
    if (!completedJobs?.length) return [currentYear];
    const years = new Set<number>();
    completedJobs.forEach((j: any) => {
      try {
        years.add(new Date(j.appointmentDate).getFullYear());
      } catch { /* skip */ }
    });
    if (years.size === 0) years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [completedJobs, currentYear]);

  // Filter by year
  const filteredJobs = useMemo(() => {
    if (!completedJobs) return [];
    return completedJobs.filter((j: any) => {
      try {
        return new Date(j.appointmentDate).getFullYear() === selectedYear;
      } catch { return false; }
    });
  }, [completedJobs, selectedYear]);

  // Summary stats for selected year
  const yearStats = useMemo(() => {
    const totalEarned = filteredJobs.reduce((s: number, j: any) => s + (j.providerAmount || 0), 0);
    const totalRevenue = filteredJobs.reduce((s: number, j: any) => s + (j.totalAmount || 0), 0);
    const totalFees = filteredJobs.reduce((s: number, j: any) => s + (j.platformFee || 0), 0);
    const byService: Record<string, { count: number; earned: number }> = {};
    filteredJobs.forEach((j: any) => {
      const key = j.serviceType;
      if (!byService[key]) byService[key] = { count: 0, earned: 0 };
      byService[key].count += 1;
      byService[key].earned += j.providerAmount || 0;
    });
    return { totalEarned, totalRevenue, totalFees, jobCount: filteredJobs.length, byService };
  }, [filteredJobs]);

  const safeDateFormat = (dateStr: string, fmt: string) => {
    try {
      const d = dateStr?.length === 10 ? new Date(dateStr + "T12:00:00") : new Date(dateStr);
      return isNaN(d.getTime()) ? "N/A" : format(d, fmt);
    } catch { return "N/A"; }
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
      {/* Year selector */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedYear === year
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Year summary */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <h3 className="font-display font-semibold text-sm text-foreground">
          {selectedYear} Summary
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{yearStats.jobCount}</p>
            <p className="text-[10px] text-muted-foreground">Jobs Done</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              ${yearStats.totalEarned.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">Net Earned</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              ${yearStats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">Gross Revenue</p>
          </div>
        </div>

        {/* Breakdown by service type */}
        {Object.keys(yearStats.byService).length > 0 && (
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">By Service Type</p>
            {Object.entries(yearStats.byService).map(([type, stats]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ServiceIcon serviceType={type} size="xs" />
                  <span className="text-xs text-foreground capitalize">
                    {type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-foreground">
                    ${stats.earned.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({stats.count} job{stats.count !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job list */}
      {filteredJobs.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <FileText className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-display font-semibold text-foreground text-base">
            No completed services in {selectedYear}
          </p>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            Completed services will appear here with full payment details
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground">
            All Completed Services ({filteredJobs.length})
          </h3>
          {filteredJobs.map((job: any, i: number) => {
            const isExpanded = expandedId === job.id;
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : job.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <ServiceIcon serviceType={job.serviceType} size="sm" />
                    <div>
                      <p className="font-semibold text-sm text-foreground capitalize">
                        {job.serviceType.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {safeDateFormat(job.appointmentDate, "MMM d, yyyy")} · {job.packageName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      ${(job.providerAmount || 0).toLocaleString()}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border px-4 pb-4 pt-3 space-y-2.5"
                  >
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Service Date</p>
                        <p className="font-medium text-foreground">
                          {safeDateFormat(job.appointmentDate, "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Package</p>
                        <p className="font-medium text-foreground">{job.packageName}</p>
                      </div>
                      {job.frequency && (
                        <div>
                          <p className="text-muted-foreground">Frequency</p>
                          <p className="font-medium text-foreground capitalize">{job.frequency}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Payment Status</p>
                        <p className={`font-medium capitalize ${
                          job.paymentStatus === "completed" || job.paymentStatus === "paid"
                            ? "text-secondary"
                            : "text-amber-600"
                        }`}>
                          {job.paymentStatus}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross Amount</span>
                        <span className="font-medium text-foreground">
                          ${(job.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee</span>
                        <span className="font-medium text-destructive">
                          -${(job.platformFee || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-border pt-1.5 flex justify-between font-semibold">
                        <span className="text-foreground">Your Earnings</span>
                        <span className="text-foreground">
                          ${(job.providerAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {job.notes && (
                      <div className="text-xs">
                        <p className="text-muted-foreground">Notes</p>
                        <p className="text-foreground">{job.notes}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProviderServiceHistory;
