import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, Trophy, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";

const THIS_WEEK_GROSS = 2610;
const NET_EARNINGS = 2221;
const PAYOUT_AMOUNT = "$2,221";
const BANK_LAST4 = "4832";

interface ProviderEarningsProps {
  onViewHistory?: () => void;
}

const ProviderEarnings = ({ onViewHistory }: ProviderEarningsProps) => {
  const { toast } = useToast();
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const weeklyData = [
    { day: "Mon", amount: 320 },
    { day: "Tue", amount: 485 },
    { day: "Wed", amount: 210 },
    { day: "Thu", amount: 395 },
    { day: "Fri", amount: 520 },
    { day: "Sat", amount: 680 },
    { day: "Sun", amount: 0 },
  ];

  const lastWeekTotal = 2330; // This week ($2,610) > last week → show Top Provider badge
  const isTopProvider = THIS_WEEK_GROSS > lastWeekTotal;

  const recentPayouts = [
    { date: "Mar 22", amount: "$1,680", status: "Deposited" },
    { date: "Mar 15", amount: "$2,140", status: "Deposited" },
    { date: "Mar 8", amount: "$1,920", status: "Deposited" },
  ];

  const performanceMetrics = [
    { label: "Response rate", value: 94 },
    { label: "Completion rate", value: 98 },
    { label: "Repeat customer rate", value: 67 },
  ];

  const handleConfirmPayout = () => {
    setShowPayoutModal(false);
    toast({
      title: `Payout of ${PAYOUT_AMOUNT} requested. Arrives in 1-2 business days.`,
    });
  };

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Top Provider badge */}
      {isTopProvider && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 flex items-center gap-2"
        >
          <Trophy className="w-5 h-5 text-amber-600" />
          <p className="text-sm font-semibold text-amber-700 font-display">Top Provider This Week</p>
        </motion.div>
      )}

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
          <p className="text-lg font-bold text-foreground flex items-center gap-1">4.9 <Star className="w-4 h-4 text-amber-500 fill-amber-500" /></p>
        </div>
      </div>

      {/* Weekly chart — recharts */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="font-semibold text-sm text-foreground mb-4">Weekly Earnings</h3>
        <ResponsiveContainer width="100%" height={128}>
          <BarChart data={weeklyData} barCategoryGap="30%">
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
            <Bar dataKey="amount" fill="hsl(195, 72%, 37%)" radius={[6, 6, 0, 0]} minPointSize={4} />
          </BarChart>
        </ResponsiveContainer>
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

        {/* Request Payout button */}
        <div className="mt-4">
          {NET_EARNINGS >= 100 ? (
            <button
              onClick={() => setShowPayoutModal(true)}
              className="bg-primary text-primary-foreground rounded-2xl py-3 w-full font-medium text-sm active:scale-[0.98] transition-transform"
            >
              Request Payout
            </button>
          ) : (
            <button
              disabled
              className="bg-muted text-muted-foreground rounded-2xl py-3 w-full font-medium text-sm cursor-not-allowed"
            >
              Minimum $100 required
            </button>
          )}
        </div>
      </div>

      {/* Performance section */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
        <h3 className="font-display font-semibold text-sm text-foreground">Your Performance</h3>
        <div className="space-y-3">
          {performanceMetrics.map((m) => (
            <div key={m.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className="text-xs font-semibold text-foreground">{m.value}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>
          ))}
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

      {/* Payout confirmation modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm space-y-4"
          >
            <h3 className="font-display font-semibold text-base text-foreground">Confirm Payout</h3>
            <p className="text-sm text-muted-foreground">
              Payout {PAYOUT_AMOUNT} to Bank ••{BANK_LAST4}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 bg-muted text-foreground rounded-xl py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayout}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProviderEarnings;
