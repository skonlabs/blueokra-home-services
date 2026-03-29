import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Save, Check } from "lucide-react";
import { toast } from "sonner";

const AdminSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .order("key");
      if (error) throw error;
      return data || [];
    },
  });

  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("platform_settings")
        .upsert({ key, value, updated_by: user!.id }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Setting saved");
    },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-1">Platform Settings</h2>
        <p className="text-sm text-muted-foreground">Manage global platform configuration</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (settings || []).length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-muted-foreground text-sm">No platform settings configured yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Settings will be added as they are needed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(settings || []).map((s: any) => (
            <div key={s.key} className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">{s.key}</p>
                  {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  value={editValues[s.key] ?? JSON.stringify(s.value)}
                  onChange={(e) => setEditValues({ ...editValues, [s.key]: e.target.value })}
                />
                <button
                  onClick={() => {
                    try {
                      const val = JSON.parse(editValues[s.key] ?? JSON.stringify(s.value));
                      updateSetting.mutate({ key: s.key, value: val });
                    } catch {
                      toast.error("Invalid JSON value");
                    }
                  }}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Last updated: {s.updated_at ? new Date(s.updated_at).toLocaleString() : "Never"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
