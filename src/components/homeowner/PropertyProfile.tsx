import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Plus, Wrench, Calendar, Thermometer, Droplets, Zap, Shield, Loader2 } from "lucide-react";
import { useUserHomes, usePropertyAppliances, usePropertyWarranties, useBookings } from "@/hooks/useBookings";
import { format } from "date-fns";

const PropertyProfile = () => {
  const [activeTab, setActiveTab] = useState<"details" | "appliances" | "history" | "warranties">("details");
  const { data: homes, isLoading: homesLoading } = useUserHomes();
  const primaryHome = homes?.[0];
  const { data: appliances, isLoading: appliancesLoading } = usePropertyAppliances(primaryHome?.id);
  const { data: warranties, isLoading: warrantiesLoading } = usePropertyWarranties(primaryHome?.id);
  const { data: bookings } = useBookings();

  const completedBookings = (bookings || [])
    .filter((b) => b.booking_status === "completed")
    .slice(0, 10);

  if (homesLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Property card */}
      {primaryHome ? (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{primaryHome.nickname || "My Home"}</h3>
              <p className="text-xs text-muted-foreground">{primaryHome.address}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted rounded-xl p-2.5 text-center">
              <p className="text-xs text-muted-foreground">City</p>
              <p className="text-sm font-medium text-foreground">{primaryHome.city || "—"}</p>
            </div>
            <div className="bg-muted rounded-xl p-2.5 text-center">
              <p className="text-xs text-muted-foreground">State</p>
              <p className="text-sm font-medium text-foreground">{primaryHome.state || "—"}</p>
            </div>
            <div className="bg-muted rounded-xl p-2.5 text-center">
              <p className="text-xs text-muted-foreground">ZIP</p>
              <p className="text-sm font-medium text-foreground">{primaryHome.zip_code || "—"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <Home className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No property added yet</p>
        </div>
      )}

      <button className="w-full flex items-center justify-center gap-2 bg-muted rounded-2xl py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Plus className="w-4 h-4" /> Add Another Property
      </button>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
        {(["details", "appliances", "history", "warranties"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap px-2 ${
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Appliances */}
      {activeTab === "appliances" && (
        <div className="space-y-3">
          {appliancesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : (appliances || []).length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No appliances added yet</div>
          ) : (
            (appliances || []).map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                    <Thermometer className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{app.appliance_name}</p>
                    <p className="text-xs text-muted-foreground">{app.brand} {app.model}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      {app.installed_date && <span>Installed: {app.installed_date}</span>}
                      {app.next_service_date && <span>Next service: {app.next_service_date}</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <button className="w-full flex items-center justify-center gap-2 bg-muted rounded-2xl py-3 text-sm text-muted-foreground">
            <Plus className="w-4 h-4" /> Add Appliance
          </button>
        </div>
      )}

      {/* History - from real bookings */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {completedBookings.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No service history yet</div>
          ) : (
            completedBookings.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.package_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.completed_at || item.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                {item.revenue && <span className="text-sm font-medium text-foreground">${item.revenue}</span>}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Details */}
      {activeTab === "details" && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Property Details</h3>
            {primaryHome ? (
              <>
                {[
                  { label: "Address", value: primaryHome.address },
                  { label: "City", value: primaryHome.city || "—" },
                  { label: "State", value: primaryHome.state || "—" },
                  { label: "ZIP Code", value: primaryHome.zip_code || "—" },
                ].map((d) => (
                  <div key={d.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-medium text-foreground">{d.value}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Add a property to see details</p>
            )}
          </div>
          <div className="bg-okra-50 rounded-2xl p-3 border border-okra-100 flex items-start gap-2">
            <Calendar className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Maintenance timeline</p>
              <p className="text-[11px] text-muted-foreground">Service history is tracked automatically</p>
            </div>
          </div>
        </div>
      )}

      {/* Warranties */}
      {activeTab === "warranties" && (
        <div className="space-y-3">
          {warrantiesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : (warranties || []).length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No warranties tracked yet</div>
          ) : (
            (warranties || []).map((w) => (
              <div key={w.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-foreground">{w.item_name}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    w.warranty_status === "active" ? "bg-okra-50 text-okra-600" : "bg-muted text-muted-foreground"
                  }`}>
                    {w.warranty_status}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {w.warranty_provider && <span>Provider: {w.warranty_provider}</span>}
                  {w.expiry_date && <span>Expires: {w.expiry_date}</span>}
                </div>
              </div>
            ))
          )}
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">All warranties are stored and tracked automatically</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyProfile;
