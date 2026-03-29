import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminDisputes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: disputes, isLoading } = useQuery({
    queryKey: ["admin-disputes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).flatMap((d: any) => [d.filed_by, d.filed_against].filter(Boolean)))];
      let profiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: pData } = await supabase
          .from("profiles")
          .select("user_id, display_name, first_name, last_name")
          .in("user_id", userIds);
        (pData || []).forEach((p: any) => {
          profiles[p.user_id] = p.display_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown";
        });
      }

      return (data || []).map((d: any) => ({
        ...d,
        filerName: profiles[d.filed_by] || "Unknown",
        againstName: profiles[d.filed_against] || "N/A",
      }));
    },
  });

  const resolveDispute = useMutation({
    mutationFn: async ({ disputeId, resolution, notes }: { disputeId: string; resolution: string; notes: string }) => {
      const { error } = await supabase
        .from("disputes")
        .update({
          dispute_status: "resolved",
          resolution_type: resolution,
          resolution_notes: notes,
          resolved_at: new Date().toISOString(),
          resolved_by: user!.id,
        })
        .eq("id", disputeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Dispute resolved");
      setResolutionNotes("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to resolve"),
  });

  const filtered = (disputes || []).filter((d: any) => {
    if (statusFilter === "all") return true;
    return d.dispute_status === statusFilter;
  });

  const statusColors: Record<string, string> = {
    open: "bg-amber-100 text-amber-700",
    in_review: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "open", "in_review", "resolved", "closed"].map((s) => (
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
        <div className="text-center py-12 text-muted-foreground text-sm">No disputes found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d: any) => {
            const isExpanded = expandedId === d.id;
            return (
              <div key={d.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground capitalize">{d.dispute_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">Filed by {d.filerName} · {format(new Date(d.created_at), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[d.dispute_status] || "bg-muted text-muted-foreground"}`}>
                      {d.dispute_status}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Filed By</p><p className="font-medium text-foreground">{d.filerName}</p></div>
                      <div><p className="text-muted-foreground">Against</p><p className="font-medium text-foreground">{d.againstName}</p></div>
                      <div><p className="text-muted-foreground">Type</p><p className="font-medium text-foreground capitalize">{d.dispute_type.replace(/_/g, " ")}</p></div>
                      <div><p className="text-muted-foreground">Refund Amount</p><p className="font-medium text-foreground">{d.refund_amount ? `$${d.refund_amount}` : "N/A"}</p></div>
                    </div>
                    {d.description && (
                      <div className="text-xs"><p className="text-muted-foreground">Description</p><p className="text-foreground bg-muted rounded-xl p-2.5 mt-1">{d.description}</p></div>
                    )}
                    {d.resolution_notes && (
                      <div className="text-xs"><p className="text-muted-foreground">Resolution</p><p className="text-foreground">{d.resolution_notes}</p></div>
                    )}

                    {d.dispute_status === "open" && (
                      <div className="space-y-2 pt-1">
                        <textarea
                          className="w-full bg-muted rounded-xl p-3 text-xs min-h-[60px] resize-none outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                          placeholder="Resolution notes..."
                          value={expandedId === d.id ? resolutionNotes : ""}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => resolveDispute.mutate({ disputeId: d.id, resolution: "refund", notes: resolutionNotes })}
                            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolve (Refund)
                          </button>
                          <button
                            onClick={() => resolveDispute.mutate({ disputeId: d.id, resolution: "dismissed", notes: resolutionNotes })}
                            className="flex items-center gap-1.5 bg-muted text-foreground px-3 py-2 rounded-xl text-xs font-medium"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Dismiss
                          </button>
                        </div>
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

export default AdminDisputes;
