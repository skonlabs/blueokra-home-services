import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Loader2, ShieldCheck, ShieldX, UserCheck, UserX, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const AdminUsers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "homeowner" | "provider" | "admin">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch roles for all users
      const userIds = (profiles || []).map((p: any) => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap: Record<string, string[]> = {};
      (roles || []).forEach((r: any) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      });

      return (profiles || []).map((p: any) => ({
        ...p,
        roles: roleMap[p.user_id] || [],
      }));
    },
  });

  const manageUser = useMutation({
    mutationFn: async ({ action, targetUserId, updates }: { action: string; targetUserId: string; updates?: any }) => {
      const { data, error } = await supabase.rpc("admin_manage_user", {
        _admin_id: user!.id,
        _action: action,
        _user_id: targetUserId,
        _updates: updates || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update user");
    },
  });

  const filtered = (users || []).filter((u: any) => {
    const matchSearch = !search.trim() || 
      [u.display_name, u.first_name, u.last_name, u.company_name, u.phone, u.venmo_phone]
        .filter(Boolean)
        .some((f: string) => f.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "all" || u.roles.includes(roleFilter);
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-4">
      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "homeowner", "provider", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                roleFilter === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u: any) => {
            const isExpanded = expandedId === u.user_id;
            const name = u.display_name || [u.first_name, u.last_name].filter(Boolean).join(" ") || "Unnamed";
            const isBlocked = u.is_blocked;
            const isProvider = u.roles.includes("provider");
            const isPendingProvider = isProvider && u.approval_status === "pending";

            return (
              <div key={u.user_id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : u.user_id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                      isBlocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    }`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{name}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {u.roles.map((r: string) => (
                          <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            r === "admin" ? "bg-purple-100 text-purple-700" :
                            r === "provider" ? "bg-blue-100 text-blue-700" :
                            "bg-green-100 text-green-700"
                          }`}>{r}</span>
                        ))}
                        {isBlocked && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Blocked</span>}
                        {isPendingProvider && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Phone</p><p className="font-medium text-foreground">{u.phone || "N/A"}</p></div>
                      <div><p className="text-muted-foreground">Venmo</p><p className="font-medium text-foreground">{u.venmo_phone || "N/A"}</p></div>
                      <div><p className="text-muted-foreground">Address</p><p className="font-medium text-foreground">{[u.address, u.city, u.state, u.zip_code].filter(Boolean).join(", ") || "N/A"}</p></div>
                      <div><p className="text-muted-foreground">Company</p><p className="font-medium text-foreground">{u.company_name || "N/A"}</p></div>
                      {isProvider && u.services_offered?.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Services</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {u.services_offered.map((s: string) => (
                              <span key={s} className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div><p className="text-muted-foreground">Approval</p><p className="font-medium text-foreground capitalize">{u.approval_status || "N/A"}</p></div>
                      <div><p className="text-muted-foreground">Joined</p><p className="font-medium text-foreground">{new Date(u.created_at).toLocaleDateString()}</p></div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {isPendingProvider && (
                        <>
                          <button
                            onClick={() => manageUser.mutate({ action: "approve_provider", targetUserId: u.user_id })}
                            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-medium"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => manageUser.mutate({ action: "reject_provider", targetUserId: u.user_id })}
                            className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-2 rounded-xl text-xs font-medium"
                          >
                            <UserX className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}
                      {!isBlocked ? (
                        <button
                          onClick={() => manageUser.mutate({ action: "block", targetUserId: u.user_id })}
                          className="flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-2 rounded-xl text-xs font-medium"
                        >
                          <ShieldX className="w-3.5 h-3.5" /> Block
                        </button>
                      ) : (
                        <button
                          onClick={() => manageUser.mutate({ action: "unblock", targetUserId: u.user_id })}
                          className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-2 rounded-xl text-xs font-medium"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Unblock
                        </button>
                      )}
                    </div>
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

export default AdminUsers;
