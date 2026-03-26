import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Plus, Wrench, Calendar, Thermometer, Droplets, Zap, Shield, X, RotateCcw } from "lucide-react";

const currentYear = new Date().getFullYear();

// Compute the next upcoming month name (next month relative to today)
const getNextUpcomingMonth = (offsetMonths: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return d.toLocaleString("default", { month: "short" }) + " " + d.getFullYear();
};

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  sqft: string;
  lotSize: string;
  yearBuilt: string;
}

interface Appliance {
  name: string;
  brand: string;
  model: string;
  installed: string;
  icon: React.ElementType;
  nextService: string;
}

interface HistoryItem {
  id: string;
  date: string;
  service: string;
  provider: string;
  cost: string;
}

interface PropertyProfileProps {
  onScheduleService: (applianceName: string) => void;
  onRebook: (serviceId: string) => void;
}

const initialProperties: Property[] = [
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

const initialAppliances: Appliance[] = [
  { name: "HVAC System", brand: "Carrier", model: "Infinity 24", installed: "2019", icon: Thermometer, nextService: getNextUpcomingMonth(1) },
  { name: "Water Heater", brand: "Rheem", model: "Performance Plus", installed: "2021", icon: Droplets, nextService: getNextUpcomingMonth(3) },
  { name: "Electrical Panel", brand: "Square D", model: "200A Main", installed: "2005", icon: Zap, nextService: getNextUpcomingMonth(5) },
];

const initialHistory: HistoryItem[] = [
  { id: "h1", date: `Mar 15, ${currentYear}`, service: "Lawn Mowing", provider: "Mike's Lawn Care", cost: "$185" },
  { id: "h2", date: `Feb 28, ${currentYear}`, service: "HVAC Tune-up", provider: "Cool Air Pros", cost: "$150" },
  { id: "h3", date: `Jan 10, ${currentYear}`, service: "Plumbing Repair", provider: "QuickFix", cost: "$275" },
  { id: "h4", date: `Nov 5, ${currentYear - 1}`, service: "Gutter Cleaning", provider: "Roof Pros NW", cost: "$180" },
  { id: "h5", date: `Sep 20, ${currentYear - 1}`, service: "Electrical Inspection", provider: "SafeWire", cost: "$120" },
];

const PROPERTY_TYPES = ["Single Family", "Condo", "Townhouse", "Multi-Family"] as const;

const PropertyProfile = ({ onScheduleService, onRebook }: PropertyProfileProps) => {
  const [activeTab, setActiveTab] = useState<"details" | "appliances" | "history" | "warranties">("details");

  // Properties state
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [activePropIndex, setActivePropIndex] = useState(0);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newProp, setNewProp] = useState({
    address: "",
    type: "Single Family",
    sqft: "",
    yearBuilt: "",
  });

  // Appliances state
  const [appliances, setAppliances] = useState<Appliance[]>(initialAppliances);
  const [showAddAppliance, setShowAddAppliance] = useState(false);
  const [newAppliance, setNewAppliance] = useState({
    name: "",
    brand: "",
    model: "",
    yearInstalled: "",
  });

  // History state
  const [history] = useState<HistoryItem[]>(initialHistory);

  const prop = properties[activePropIndex];

  const handleSaveProperty = () => {
    if (!newProp.address.trim()) return;
    const id = String(Date.now());
    const label = newProp.address.split(",")[0].trim() || `Property ${properties.length + 1}`;
    setProperties((prev) => [
      ...prev,
      {
        id,
        name: label,
        address: newProp.address.trim(),
        type: newProp.type,
        sqft: newProp.sqft.trim() || "—",
        lotSize: "—",
        yearBuilt: newProp.yearBuilt.trim() || "—",
      },
    ]);
    setNewProp({ address: "", type: "Single Family", sqft: "", yearBuilt: "" });
    setShowAddProperty(false);
    setActivePropIndex(properties.length);
  };

  const handleSaveAppliance = () => {
    if (!newAppliance.name.trim()) return;
    setAppliances((prev) => [
      ...prev,
      {
        name: newAppliance.name.trim(),
        brand: newAppliance.brand.trim() || "—",
        model: newAppliance.model.trim() || "—",
        installed: newAppliance.yearInstalled.trim() || String(currentYear),
        icon: Wrench,
        nextService: getNextUpcomingMonth(6),
      },
    ]);
    setNewAppliance({ name: "", brand: "", model: "", yearInstalled: "" });
    setShowAddAppliance(false);
  };

  const inputCls = "w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 border border-transparent";
  const selectCls = "w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 border border-transparent";

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Property selector tabs (if multiple) */}
      {properties.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {properties.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActivePropIndex(i)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activePropIndex === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

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

      {/* Add Another Property */}
      <AnimatePresence>
        {showAddProperty ? (
          <motion.div
            key="add-prop-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm text-foreground">Add Property</h3>
                <button
                  onClick={() => setShowAddProperty(false)}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                className={inputCls}
                placeholder="Address (e.g. 456 Oak Ave, Seattle, WA 98102)"
                value={newProp.address}
                onChange={(e) => setNewProp((p) => ({ ...p, address: e.target.value }))}
              />

              <select
                className={selectCls}
                value={newProp.type}
                onChange={(e) => setNewProp((p) => ({ ...p, type: e.target.value }))}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputCls}
                  placeholder="Square footage"
                  type="number"
                  value={newProp.sqft}
                  onChange={(e) => setNewProp((p) => ({ ...p, sqft: e.target.value }))}
                />
                <input
                  className={inputCls}
                  placeholder="Year built"
                  type="number"
                  value={newProp.yearBuilt}
                  onChange={(e) => setNewProp((p) => ({ ...p, yearBuilt: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveProperty}
                  disabled={!newProp.address.trim()}
                  className="flex-1 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-xl disabled:opacity-50 active:scale-[0.97] transition-transform"
                >
                  Save Property
                </button>
                <button
                  onClick={() => setShowAddProperty(false)}
                  className="px-4 bg-muted text-muted-foreground text-sm font-medium py-2.5 rounded-xl active:scale-[0.97] transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="add-prop-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddProperty(true)}
            className="w-full flex items-center justify-center gap-2 bg-muted rounded-2xl py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Another Property
          </motion.button>
        )}
      </AnimatePresence>

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
              key={app.name + i}
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
                <button
                  onClick={() => onScheduleService(app.name)}
                  className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium active:scale-[0.97] transition-transform"
                >
                  Schedule
                </button>
              </div>
            </motion.div>
          ))}

          {/* Add Appliance form */}
          <AnimatePresence>
            {showAddAppliance ? (
              <motion.div
                key="add-app-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm text-foreground">Add Appliance</h3>
                    <button
                      onClick={() => setShowAddAppliance(false)}
                      className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    className={inputCls}
                    placeholder="Appliance name (e.g. Dishwasher)"
                    value={newAppliance.name}
                    onChange={(e) => setNewAppliance((a) => ({ ...a, name: e.target.value }))}
                  />
                  <input
                    className={inputCls}
                    placeholder="Brand (e.g. Bosch)"
                    value={newAppliance.brand}
                    onChange={(e) => setNewAppliance((a) => ({ ...a, brand: e.target.value }))}
                  />
                  <input
                    className={inputCls}
                    placeholder="Model (optional)"
                    value={newAppliance.model}
                    onChange={(e) => setNewAppliance((a) => ({ ...a, model: e.target.value }))}
                  />
                  <input
                    className={inputCls}
                    placeholder="Year installed"
                    type="number"
                    value={newAppliance.yearInstalled}
                    onChange={(e) => setNewAppliance((a) => ({ ...a, yearInstalled: e.target.value }))}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveAppliance}
                      disabled={!newAppliance.name.trim()}
                      className="flex-1 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-xl disabled:opacity-50 active:scale-[0.97] transition-transform"
                    >
                      Save Appliance
                    </button>
                    <button
                      onClick={() => setShowAddAppliance(false)}
                      className="px-4 bg-muted text-muted-foreground text-sm font-medium py-2.5 rounded-xl active:scale-[0.97] transition-transform"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="add-app-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddAppliance(true)}
                className="w-full flex items-center justify-center gap-2 bg-muted rounded-2xl py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Appliance
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-2">
          {history.map((item, i) => (
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
                <p className="text-sm font-medium text-foreground">{item.service}</p>
                <p className="text-xs text-muted-foreground">{item.provider} · {item.date}</p>
              </div>
              <span className="text-sm font-medium text-foreground">{item.cost}</span>
              <button
                onClick={() => onRebook(item.id)}
                className="ml-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium active:scale-[0.97] transition-transform flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Rebook
              </button>
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
