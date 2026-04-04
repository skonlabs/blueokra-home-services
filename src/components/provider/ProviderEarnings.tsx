import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, Trophy, Star, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useProviderEarnings } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfWeek, endOfWeek, isWithinInterval, subWeeks } from "date-fns";

interface ProviderEarningsProps {
  onViewHistory?: () => void;
}

const ProviderEarnings = ({ onViewHistory }: ProviderEarningsProps) => {
  const { profile } = useAuth();
  const { data: earnings, isLoading } = useProviderEarnings();
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);
  const lastWeekEnd = subWeeks(thisWeekEnd, 1);

  const stats = useMemo(() => {
    const txns = earnings || [];
    const completedTxns = txns.filter(t => (t.payment_status === "completed" || t.payment_status === "paid") && t.is_admin_approved === true);
    const pendingApprovalTxns = txns.filter(t => t.is_admin_approved !== true);
    const pendingTxns = txns.filter(t => t.payment_status === "pending");

    const thisWeekEarnings = completedTxns
      .filter(t => { try { return isWithinInterval(new Date(t.created_at), { start: thisWeekStart, end: thisWeekEnd }); } catch { return false; } })
      .reduce((s, t) => s + (t.provider_amount || t.total_amount || 0), 0);

    const lastWeekEarnings = completedTxns
      .filter(t => { try { return isWithinInterval(new Date(t.created_at), { start: lastWeekStart, end: lastWeekEnd }); } catch { return false; } })
      .reduce((s, t) => s + (t.provider_amount || t.total_amount || 0), 0);

    const thisMonthEarnings = completedTxns
      .filter(t => { try { const d = new Date(t.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; } })
      .reduce((s, t) => s + (t.provider_amount || t.total_amount || 0), 0);

    const totalEarned = completedTxns.reduce((s, t) => s + (t.provider_amount || t.total_amount || 0), 0);
    const pendingAmount = pendingTxns.reduce((s, t) => s + (t.provider_amount || t.total_amount || 0), 0);

    const weekPctChange = lastWeekEarnings > 0 ? Math.round(((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100) : 0;

    // Build daily chart for this week
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyData = dayNames.map((day, i) => {
      const dayDate = new Date(thisWeekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dayTotal = completedTxns
        .filter(t => { try { const d = new Date(t.created_at); return d.toDateString() === dayDate.toDateString(); } catch { return false; } })
        .reduce((s, t) => s + (t.provider_amount || t.total_amount || 0), 0);
      return { day, amount: dayTotal };
    });

    const awaitingApproval = pendingApprovalTxns.reduce((s, t) => s + (t.provider_amount || t.total_amount || 0), 0);

    return { thisWeekEarnings, lastWeekEarnings, thisMonthEarnings, totalEarned, pendingAmount, weekPctChange, weeklyData, jobCount: completedTxns.length, awaitingApproval };
  }, [earnings, thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd, now]);

  const recentPayouts = useMemo(() => {
    return (earnings || [])
      .filter(t => t.payment_status === "completed" || t.payment_status === "paid")
      .slice(0, 3)
      .map(t => ({
        date: (() => { try { return format(new Date(t.created_at), "MMM d"); } catch { return "N/A"; } })(),
        amount: `$${(t.provider_amount || t.total_amount || 0).toFixed(0)}`,
        status: "Deposited",
      }));
  }, [earnings]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const venmoConfigured = !!profile?.venmo_phone;

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Venmo warning */}
      {!venmoConfigured && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3 text-xs text-destructive font-medium">
          ⚠️ Venmo phone not set. Go to Profile → Account Settings to add it so you can receive payouts.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">${stats.thisWeekEarnings.toFixed(0)}</p>
          {stats.weekPctChange !== 0 && (
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className={`w-3 h-3 ${stats.weekPctChange > 0 ? "text-secondary" : "text-destructive rotate-90"}`} />
              <span className={`text-xs font-medium ${stats.weekPctChange > 0 ? "text-secondary" : "text-destructive"}`}>
                {stats.weekPctChange > 0 ? "+" : ""}{stats.weekPctChange}% vs last week
              </span>
            </div>
          )}
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">This Month</p>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">${stats.thisMonthEarnings.toFixed(0)}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Jobs</p>
          <p className="text-lg font-bold text-foreground">{stats.jobCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Avg Job</p>
          <p className="text-lg font-bold text-foreground">${stats.jobCount > 0 ? Math.round(stats.totalEarned / stats.jobCount) : 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-lg font-bold text-foreground">${stats.pendingAmount.toFixed(0)}</p>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-semibold text-sm text-foreground mb-4">Weekly Earnings</h3>
        <ResponsiveContainer width="100%" height={128}>
          <BarChart data={stats.weeklyData} barCategoryGap="30%">
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              formatter={(value: number) => [`$${value}`, "Earnings"]}
            />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} minPointSize={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent payouts */}
      {recentPayouts.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Recent Payouts</h3>
          {recentPayouts.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">{p.amount}</p>
                <p className="text-xs text-muted-foreground">{p.date}</p>
              </div>
              <span className="text-[11px] bg-okra-50 text-okra-600 px-2 py-0.5 rounded-full font-medium">{p.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Payout info */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <h3 className="font-semibold text-sm text-foreground mb-2">How Payouts Work</h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>1. Customer pays BlueOkra directly after service completion</p>
          <p>2. Admin reviews and approves the payment</p>
          <p>3. Your earnings are sent to your Venmo ({profile?.venmo_phone || "not set"})</p>
        </div>
      </div>

      {/* Service History link */}
      {onViewHistory && (
        <button
          onClick={onViewHistory}
          className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-foreground">Service History</p>
              <p className="text-xs text-muted-foreground">View all completed services &amp; payments by year</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export default ProviderEarnings;
