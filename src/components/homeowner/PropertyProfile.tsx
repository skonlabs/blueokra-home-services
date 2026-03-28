import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Plus, Wrench, Calendar, Thermometer, Shield, Loader2, X, Check, Trash2, AlertCircle } from "lucide-react";
import { useUserHomes, usePropertyAppliances, usePropertyWarranties, useBookings } from "@/hooks/useBookings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import AddressInput from "./AddressInput";
import type { AddressParts } from "./AddressInput";

const PropertyProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"details" | "appliances" | "history" | "warranties">("details");
  const { data: homes, isLoading: homesLoading } = useUserHomes();
  const [selectedHomeIdx, setSelectedHomeIdx] = useState(0);
  const primaryHome = homes?.[selectedHomeIdx] ?? homes?.[0];
  const { data: appliances, isLoading: appliancesLoading } = usePropertyAppliances(primaryHome?.id);
  const { data: warranties, isLoading: warrantiesLoading } = usePropertyWarranties(primaryHome?.id);
  const { data: bookings } = useBookings();

  // Add property form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newZip, setNewZip] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const completedBookings = (bookings || [])
    .filter((b) => b.booking_status === "completed")
    .slice(0, 10);

  const inputCls = "w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent";

  const handleSaveProperty = async () => {
    if (!newAddress.trim()) { setAddError("Please enter an address."); return; }
    if (!user) return;
    setAddError("");
    setAddSaving(true);
    try {
      const { error: insertError } = await supabase.from("user_homes").insert({
        user_id: user.id,
        address: newAddress,
        nickname: newNickname.trim() || null,
        city: newCity || null,
        state: newState || null,
        zip_code: newZip || null,
        is_primary: !homes || homes.length === 0,
      });
      if (insertError) throw insertError;
      await queryClient.invalidateQueries({ queryKey: ["user-homes", user.id] });
      setShowAddForm(false);
      setNewNickname("");
      setNewAddress("");
      setNewCity("");
      setNewState("");
      setNewZip("");
    } catch (err) {
      const pgErr = err as { message?: string };
      setAddError(pgErr?.message ?? "Failed to save. Please try again.");
      console.error(err);
    } finally {
      setAddSaving(false);
    }
  };

  const handleDeleteProperty = async (homeId: string, homeAddress: string) => {
    if (!user) return;
    setDeleteError(null);
    setDeletingId(homeId);
    try {
      // Check if any bookings reference this address
      const { data: relatedBookings } = await supabase
        .from("booking_service")
        .select("id")
        .eq("customer_user_id", user.id)
        .eq("notes", homeAddress)
        .limit(1);

      if (relatedBookings && relatedBookings.length > 0) {
        setDeleteError("This address has existing bookings and cannot be deleted.");
        setDeletingId(null);
        return;
      }

      const { error } = await supabase
        .from("user_homes")
        .delete()
        .eq("id", homeId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Adjust selected index if needed
      if (selectedHomeIdx >= (homes?.length ?? 1) - 1) {
        setSelectedHomeIdx(Math.max(0, (homes?.length ?? 1) - 2));
      }
      await queryClient.invalidateQueries({ queryKey: ["user-homes", user.id] });
    } catch (err) {
      setDeleteError("Failed to delete property.");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (homesLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Property selector chips */}
      {homes && homes.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {homes.map((home, i) => (
            <button
              key={home.id}
              onClick={() => { setSelectedHomeIdx(i); setDeleteError(null); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedHomeIdx === i
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-foreground border-border"
              }`}
            >
              {home.nickname || home.address.split(",")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Delete error */}
      {deleteError && (
        <div className="flex items-center gap-2 bg-destructive/10 rounded-xl p-3 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{deleteError}</p>
          <button onClick={() => setDeleteError(null)} className="ml-auto">
            <X className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}

      {/* Property card */}
      {primaryHome ? (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{primaryHome.nickname || "My Home"}</h3>
              <p className="text-xs text-muted-foreground truncate">{primaryHome.address}</p>
            </div>
            {/* Delete button */}
            <button
              onClick={() => handleDeleteProperty(primaryHome.id, primaryHome.address)}
              disabled={deletingId === primaryHome.id}
              className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 shrink-0"
              title="Delete property"
            >
              {deletingId === primaryHome.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />
              }
            </button>
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
          <p className="text-xs text-muted-foreground mt-1">Add your home to get started</p>
        </div>
      )}

      {/* Add property button / form */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-muted rounded-2xl py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Another Property
        </button>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Add New Property</p>
            <button onClick={() => { setShowAddForm(false); setAddError(""); }} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Property name / nickname</label>
            <input
              className={inputCls}
              placeholder="e.g. Main Home, Rental, Cabin"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Address <span className="text-destructive">*</span></label>
            <AddressInput
              value={newAddress}
              onChange={(addr, _isWA, parts?: AddressParts) => {
                setNewAddress(addr);
                if (parts) {
                  setNewCity(parts.city ?? "");
                  setNewState(parts.state ?? "");
                  setNewZip(parts.zip ?? "");
                }
                setAddError("");
              }}
              placeholder="Start typing your address…"
              hasError={!!addError && !newAddress}
            />
          </div>

          {/* Show parsed fields */}
          {(newCity || newState || newZip) && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "City", value: newCity, set: setNewCity },
                { label: "State", value: newState, set: setNewState },
                { label: "ZIP", value: newZip, set: setNewZip },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="block text-[10px] text-muted-foreground mb-1">{label}</label>
                  <input
                    className="w-full bg-muted rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/30"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
          )}

          {addError && <p className="text-xs text-destructive">{addError}</p>}

          <button
            onClick={handleSaveProperty}
            disabled={addSaving || !newAddress.trim()}
            className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {addSaving ? "Saving…" : "Save Property"}
          </button>
        </div>
      )}

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
                  { label: "Name", value: primaryHome.nickname || "—" },
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
