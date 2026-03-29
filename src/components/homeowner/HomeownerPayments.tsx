import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, Calendar, Loader2, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useBookings } from "@/hooks/useBookings";
import { format, startOfWeek, endOfWeek, isWithinInterval, subWeeks } from "date-fns";

const HomeownerPayments = () => {
  const { data: rawBookings, isLoading } = useBookings();

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);
  const lastWeekEnd = subWeeks(thisWeekEnd, 1);

  const stats = useMemo(() => {
    const bookings = rawBookings || [];
    const allPayments = bookings
      .filter(b => b.revenue && b.revenue > 0)
      .map(b => ({ amount: b.revenue || 0, date: b.created_at, status: b.booking_status }));

    const completedPayments = allPayments.filter(p => p.status === "completed");
    const pendingPayments = allPayments.filter(p => p.status !== "completed" && p.status !== "cancelled");

    const totalSpent = completedPayments.reduce((s, p) => s + p.amount, 0);
    const pendingAmount = pendingPayments.reduce((s, p) => s + p.amount, 0);

    const thisWeekSpent = completedPayments
      .filter(p => { try { return isWithinInterval(new Date(p.date), { start: thisWeekStart, end: thisWeekEnd }); } catch { return false; } })
      .reduce((s, p) => s + p.amount, 0);

    const lastWeekSpent = completedPayments
      .filter(p => { try { return isWithinInterval(new Date(p.date), { start: lastWeekStart, end: lastWeekEnd }); } catch { return false; } })
      .reduce((s, p) => s + p.amount, 0);

    const thisMonthSpent = completedPayments
      .filter(p => { try { const d = new Date(p.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); } catch { return false; } })
      .reduce((s, p) => s + p.amount, 0);

    const weekPctChange = lastWeekSpent > 0 ? Math.round(((thisWeekSpent - lastWeekSpent) / lastWeekSpent) * 100) : 0;

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyData = dayNames.map((day, i) => {
      const dayDate = new Date(thisWeekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dayTotal = completedPayments
        .filter(p => { try { return new Date(p.date).toDateString() === dayDate.toDateString(); } catch { return false; } })
        .reduce((s, p) => s + p.amount, 0);
      return { day, amount: dayTotal };
    });

    return { thisWeekSpent, thisMonthSpent, totalSpent, pendingAmount, weekPctChange, weeklyData, serviceCount: completedPayments.length };
  }, [rawBookings, thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd, now]);

  const recentPayments = useMemo(() => {
    return (rawBookings || [])
      .filter(b => b.revenue && b.revenue > 0)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(b => ({
        service: b.package_name || b.service_type,
        date: (() => { try { return format(new Date(b.created_at), "MMM d"); } catch { return "N/A"; } })(),
        amount: b.revenue || 0,
        status: b.booking_status,
      }));
  }, [rawBookings]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">${stats.thisWeekSpent.toFixed(0)}</p>
          {stats.weekPctChange !== 0 && (
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className={`w-3 h-3 ${stats.weekPctChange > 0 ? "text-destructive" : "text-success rotate-90"}`} />
              <span className={`text-xs font-medium ${stats.weekPctChange > 0 ? "text-destructive" : "text-success"}`}>
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
          <p className="font-display text-2xl font-bold text-foreground">${stats.thisMonthSpent.toFixed(0)}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Services</p>
          <p className="text-lg font-bold text-foreground">{stats.serviceCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Avg Cost</p>
          <p className="text-lg font-bold text-foreground">${stats.serviceCount > 0 ? Math.round(stats.totalSpent / stats.serviceCount) : 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-lg font-bold text-foreground">${stats.pendingAmount.toFixed(0)}</p>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-semibold text-sm text-foreground mb-4">Weekly Spending</h3>
        <ResponsiveContainer width="100%" height={128}>
          <BarChart data={stats.weeklyData} barCategoryGap="30%">
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
              formatter={(value: number) => [`$${value}`, "Spent"]}
            />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} minPointSize={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent payments */}
      {recentPayments.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Recent Payments</h3>
          {recentPayments.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">{p.service}</p>
                <p className="text-xs text-muted-foreground">{p.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">${p.amount}</p>
                <span className={`text-[10px] font-medium ${p.status === "completed" ? "text-success" : "text-warm-500"}`}>
                  {p.status === "completed" ? "Paid" : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <h3 className="font-semibold text-sm text-foreground mb-2">How Payments Work</h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>1. You book a service and receive a quote</p>
          <p>2. After service is completed and verified, you'll be charged</p>
          <p>3. Payment is processed via your saved payment method</p>
        </div>
      </div>
    </div>
  );
};

export default HomeownerPayments;
