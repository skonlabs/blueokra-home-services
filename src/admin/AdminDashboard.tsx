import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, ClipboardList, DollarSign, AlertTriangle, TrendingUp, Clock, Loader2 } from "lucide-react";

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
  <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalServices },
        { count: pendingServices },
        { count: openDisputes },
        { data: payments },
        { count: pendingProviders },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("booking_service").select("*", { count: "exact", head: true }),
        supabase.from("booking_service").select("*", { count: "exact", head: true }).eq("booking_status", "purchased"),
        supabase.from("disputes").select("*", { count: "exact", head: true }).eq("dispute_status", "open"),
        supabase.from("payment_transaction").select("total_amount, payment_status"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
      ]);

      const totalRevenue = (payments || [])
        .filter((p: any) => p.payment_status === "completed" || p.payment_status === "paid")
        .reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0);

      const pendingPayments = (payments || [])
        .filter((p: any) => p.payment_status === "pending")
        .length;

      return {
        totalUsers: totalUsers || 0,
        totalServices: totalServices || 0,
        pendingServices: pendingServices || 0,
        openDisputes: openDisputes || 0,
        totalRevenue,
        pendingPayments,
        pendingProviders: pendingProviders || 0,
      };
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} color="bg-primary/10 text-primary" />
        <StatCard label="Total Services" value={stats?.totalServices || 0} icon={ClipboardList} color="bg-secondary/10 text-secondary" />
        <StatCard label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} color="bg-green-100 text-green-600" />
        <StatCard label="Open Disputes" value={stats?.openDisputes || 0} icon={AlertTriangle} color="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Pending Services" value={stats?.pendingServices || 0} icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Pending Payments" value={stats?.pendingPayments || 0} icon={TrendingUp} color="bg-blue-100 text-blue-600" />
        <StatCard label="Pending Providers" value={stats?.pendingProviders || 0} icon={Users} color="bg-purple-100 text-purple-600" />
      </div>
    </div>
  );
};

export default AdminDashboard;
