import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, Star, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

const ProviderEarnings = () => {
  const weeklyData = [
    { day: "Mon", amount: 320 },
    { day: "Tue", amount: 485 },
    { day: "Wed", amount: 210 },
    { day: "Thu", amount: 395 },
    { day: "Fri", amount: 520 },
    { day: "Sat", amount: 680 },
    { day: "Sun", amount: 0 },
  ];
  const maxAmount = Math.max(...weeklyData.map((d) => d.amount));

  const recentPayouts = [
    { date: "Mar 22", amount: "$1,680", status: "Deposited" },
    { date: "Mar 15", amount: "$2,140", status: "Deposited" },
    { date: "Mar 8", amount: "$1,920", status: "Deposited" },
  ];

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">$2,610</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3 text-secondary" />
            <span className="text-xs text-secondary font-medium">+12% vs last week</span>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">This Month</p>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">$8,940</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3 text-secondary" />
            <span className="text-xs text-secondary font-medium">+8% vs last month</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Jobs</p>
          <p className="text-lg font-bold text-foreground">18</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Avg Job</p>
          <p className="text-lg font-bold text-foreground">$145</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="text-lg font-bold text-foreground">4.9⭐</p>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-semibold text-sm text-foreground mb-4">Weekly Earnings</h3>
        <div className="flex items-end gap-2 h-32">
          {weeklyData.map((d, i) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.amount / maxAmount) * 100}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`w-full rounded-lg ${d.amount > 0 ? "bg-primary" : "bg-muted"}`}
                style={{ minHeight: d.amount > 0 ? "8px" : "4px" }}
              />
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent payouts */}
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

      {/* Fee transparency */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <h3 className="font-semibold text-sm text-foreground mb-2">Fee Breakdown</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gross earnings</span>
            <span className="font-medium">$2,610</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee (12%)</span>
            <span className="font-medium text-destructive">-$313</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment processing (2.9%)</span>
            <span className="font-medium text-destructive">-$76</span>
          </div>
          <div className="border-t border-border pt-1.5 flex justify-between font-semibold">
            <span>Net earnings</span>
            <span>$2,221</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderEarnings;
