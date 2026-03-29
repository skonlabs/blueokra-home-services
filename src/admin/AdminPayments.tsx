import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Check, X, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminPayments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transaction")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for customer and provider
      const userIds = [...new Set((data || []).flatMap((p: any) => [p.customer_user_id, p.provider_user_id].filter(Boolean)))];
      let profiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: pData } = await supabase
          .from("profiles")
          .select("user_id, display_name, first_name, last_name, phone, venmo_phone")
          .in("user_id", userIds);
        (pData || []).forEach((p: any) => {
          profiles[p.user_id] = p.display_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || p.phone || "Unknown";
        });
      }

      return (data || []).map((p: any) => ({
        ...p,
        customerName: profiles[p.customer_user_id] || "N/A",
        providerName: profiles[p.provider_user_id] || "N/A",
      }));
    },
  });

  const approvePayment = useMutation({
    mutationFn: async ({ paymentId, approved, notes }: { paymentId: string; approved: boolean; notes?: string }) => {
      const { data, error } = await supabase.rpc("admin_approve_payment", {
        _admin_id: user!.id,
        _payment_id: paymentId,
        _approved: approved,
        _notes: notes || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast.success("Payment updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update payment"),
  });

  const filtered = (payments || []).filter((p: any) => {
    if (statusFilter === "all") return true;
    return p.payment_status === statusFilter;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    paid: "bg-green-100 text-green-700",
    failed: "bg-destructive/10 text-destructive",
    rejected: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "pending", "completed", "paid", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No payments found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p: any) => {
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">${p.total_amount}</p>
                      <p className="text-xs text-muted-foreground">{p.customerName} → {p.providerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[p.payment_status] || "bg-muted text-muted-foreground"}`}>
                      {p.payment_status}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Total</p><p className="font-medium text-foreground">${p.total_amount}</p></div>
                      <div><p className="text-muted-foreground">Provider Amount</p><p className="font-medium text-foreground">${p.provider_amount || "TBD"}</p></div>
                      <div><p className="text-muted-foreground">Admin Amount</p><p className="font-medium text-foreground">${p.admin_amount || "TBD"}</p></div>
                      <div><p className="text-muted-foreground">Method</p><p className="font-medium text-foreground capitalize">{p.payment_method_type || "N/A"}</p></div>
                      <div><p className="text-muted-foreground">QR Verified</p><p className="font-medium text-foreground">{p.is_qr_verified ? "Yes" : "No"}</p></div>
                      <div><p className="text-muted-foreground">Admin Approved</p><p className="font-medium text-foreground">{p.is_admin_approved ? "Yes" : "No"}</p></div>
                      <div><p className="text-muted-foreground">Created</p><p className="font-medium text-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</p></div>
                      {p.paid_date && <div><p className="text-muted-foreground">Paid</p><p className="font-medium text-foreground">{format(new Date(p.paid_date), "MMM d, yyyy")}</p></div>}
                    </div>

                    {p.payment_status === "pending" && p.is_qr_verified && !p.is_admin_approved && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => approvePayment.mutate({ paymentId: p.id, approved: true })}
                          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-medium"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve & Release
                        </button>
                        <button
                          onClick={() => approvePayment.mutate({ paymentId: p.id, approved: false, notes: "Rejected by admin" })}
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

export default AdminPayments;
