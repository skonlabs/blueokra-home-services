import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Plus, ChevronRight, Wrench, Calendar, Thermometer, Droplets, Zap, Shield } from "lucide-react";

const properties = [
  {
    id: "1",
    name: "Main Home",
    address: "123 Main Street, Seattle, WA 98101",
    type: "Single Family",
    sqft: "2,400",
    lotSize: "0.25 acres",
    yearBuilt: "2005",
  },
];

const appliances = [
  { name: "HVAC System", brand: "Carrier", model: "Infinity 24", installed: "2019", icon: Thermometer, nextService: "Jun 2024" },
  { name: "Water Heater", brand: "Rheem", model: "Performance Plus", installed: "2021", icon: Droplets, nextService: "Sep 2024" },
  { name: "Electrical Panel", brand: "Square D", model: "200A Main", installed: "2005", icon: Zap, nextService: "Dec 2024" },
];

const maintenanceHistory = [
  { date: "Mar 15, 2024", service: "Lawn Mowing", provider: "Mike's Lawn Care", cost: "$185" },
  { date: "Feb 28, 2024", service: "HVAC Tune-up", provider: "Cool Air Pros", cost: "$150" },
  { date: "Jan 10, 2024", service: "Plumbing Repair", provider: "QuickFix", cost: "$275" },
  { date: "Nov 5, 2023", service: "Gutter Cleaning", provider: "Roof Pros NW", cost: "$180" },
  { date: "Sep 20, 2023", service: "Electrical Inspection", provider: "SafeWire", cost: "$120" },
];

const PropertyProfile = () => {
  const [activeTab, setActiveTab] = useState<"details" | "appliances" | "history" | "warranties">("details");
  const prop = properties[0];

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Property card */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{prop.name}</h3>
            <p className="text-xs text-muted-foreground">{prop.address}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted rounded-xl p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="text-sm font-medium text-foreground">{prop.type}</p>
          </div>
          <div className="bg-muted rounded-xl p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Size</p>
            <p className="text-sm font-medium text-foreground">{prop.sqft} sqft</p>
          </div>
          <div className="bg-muted rounded-xl p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Lot</p>
            <p className="text-sm font-medium text-foreground">{prop.lotSize}</p>
          </div>
        </div>
      </div>

      {/* Add property button */}
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

      {/* Content */}
      {activeTab === "appliances" && (
        <div className="space-y-3">
          {appliances.map((app, i) => (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <app.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{app.name}</p>
                  <p className="text-xs text-muted-foreground">{app.brand} {app.model}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Installed: {app.installed}</span>
                    <span>Next service: {app.nextService}</span>
                  </div>
                </div>
                <button className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                  Schedule
                </button>
              </div>
            </motion.div>
          ))}
          <button className="w-full flex items-center justify-center gap-2 bg-muted rounded-2xl py-3 text-sm text-muted-foreground">
            <Plus className="w-4 h-4" /> Add Appliance
          </button>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-2">
          {maintenanceHistory.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.service}</p>
                <p className="text-xs text-muted-foreground">{item.provider} · {item.date}</p>
              </div>
              <span className="text-sm font-medium text-foreground">{item.cost}</span>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "details" && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Property Details</h3>
            {[
              { label: "Year Built", value: prop.yearBuilt },
              { label: "Roof Type", value: "Composition Shingle" },
              { label: "Heating", value: "Forced Air / Gas" },
              { label: "Cooling", value: "Central AC" },
              { label: "Water", value: "City Water / Sewer" },
              { label: "Garage", value: "2-Car Attached" },
            ].map((d) => (
              <div key={d.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-medium text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-okra-50 rounded-2xl p-3 border border-okra-100 flex items-start gap-2">
            <Calendar className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Maintenance timeline</p>
              <p className="text-[11px] text-muted-foreground">Next recommended: Gutter cleaning (April)</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "warranties" && (
        <div className="space-y-3">
          {[
            { item: "HVAC System", provider: "Carrier", expires: "Dec 2029", status: "Active" },
            { item: "Roof", provider: "GAF", expires: "Aug 2035", status: "Active" },
            { item: "Water Heater", provider: "Rheem", expires: "Mar 2031", status: "Active" },
          ].map((w, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm text-foreground">{w.item}</p>
                <span className="text-[11px] bg-okra-50 text-okra-600 px-2 py-0.5 rounded-full font-medium">{w.status}</span>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Provider: {w.provider}</span>
                <span>Expires: {w.expires}</span>
              </div>
            </div>
          ))}
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
