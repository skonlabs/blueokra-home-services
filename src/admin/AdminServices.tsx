import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Check, X, ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { toast } from "sonner";
import ServiceIcon from "@/components/shared/ServiceIcon";
import { format } from "date-fns";

const AdminServices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_service")
        .select(`*, booking_appointment(*), booking_assignment(*)`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch customer profiles
      const customerIds = [...new Set((data || []).map((s: any) => s.customer_user_id).filter(Boolean))];
      let profiles: Record<string, string> = {};
      if (customerIds.length > 0) {
        const { data: pData } = await supabase
          .from("profiles")
          .select("user_id, display_name, first_name, last_name, phone")
          .in("user_id", customerIds);
        (pData || []).forEach((p: any) => {
          profiles[p.user_id] = p.display_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || p.phone || "Unknown";
        });
      }

      return (data || []).map((s: any) => ({
        ...s,
        customerName: profiles[s.customer_user_id] || "Unknown",
        hasAssignment: (s.booking_assignment || []).length > 0,
        appointmentCount: (s.booking_appointment || []).length,
      }));
    },
  });

  const approveService = useMutation({
    mutationFn: async ({ serviceId, approved, notes }: { serviceId: string; approved: boolean; notes?: string }) => {
      const { data, error } = await supabase.rpc("approve_service_request", {
        _admin_id: user!.id,
        _service_id: serviceId,
        _approved: approved,
        _admin_notes: notes || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast.success("Service updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
  });

  const filtered = (services || []).filter((s: any) => {
    if (statusFilter === "all") return true;
    return s.booking_status === statusFilter;
  });

  const statusColors: Record<string, string> = {
    purchased: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-destructive/10 text-destructive",
    completed: "bg-secondary/10 text-secondary",
    in_progress: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "purchased", "approved", "in_progress", "completed", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No services found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s: any) => {
            const isExpanded = expandedId === s.id;
            return (
              <div key={s.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ServiceIcon serviceType={s.service_type} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{s.package_name || s.service_type}</p>
                      <p className="text-xs text-muted-foreground">{s.customerName} · {format(new Date(s.created_at), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[s.booking_status] || "bg-muted text-muted-foreground"}`}>
                      {s.booking_status}
                    </span>
                    {s.revenue && <span className="text-sm font-bold text-foreground">${s.revenue}</span>}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Service Type</p><p className="font-medium text-foreground capitalize">{s.service_type.replace(/_/g, " ")}</p></div>
                      <div><p className="text-muted-foreground">Package</p><p className="font-medium text-foreground">{s.package_name}</p></div>
                      <div><p className="text-muted-foreground">Frequency</p><p className="font-medium text-foreground capitalize">{s.frequency || "One-time"}</p></div>
                      <div><p className="text-muted-foreground">Revenue</p><p className="font-medium text-foreground">${s.revenue || "TBD"}</p></div>
                      <div><p className="text-muted-foreground">Payment</p><p className="font-medium text-foreground capitalize">{s.payment_method || "N/A"}</p></div>
                      <div><p className="text-muted-foreground">Assigned</p><p className="font-medium text-foreground">{s.hasAssignment ? "Yes" : "No"}</p></div>
                      <div><p className="text-muted-foreground">Appointments</p><p className="font-medium text-foreground">{s.appointmentCount}</p></div>
                      <div><p className="text-muted-foreground">ID</p><p className="font-mono text-foreground truncate">{s.id.slice(0, 8)}</p></div>
                    </div>
                    {s.notes && (
                      <div className="text-xs"><p className="text-muted-foreground">Notes</p><p className="text-foreground">{s.notes}</p></div>
                    )}
                    {s.admin_notes && (
                      <div className="text-xs"><p className="text-muted-foreground">Admin Notes</p><p className="text-foreground">{s.admin_notes}</p></div>
                    )}

                    {s.booking_status === "purchased" && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => approveService.mutate({ serviceId: s.id, approved: true })}
                          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-medium"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => approveService.mutate({ serviceId: s.id, approved: false, notes: "Rejected by admin" })}
                          className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-2 rounded-xl text-xs font-medium"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminServices;
