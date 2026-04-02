import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home, Plus, Wrench, Calendar, Thermometer, Shield,
  Loader2, X, Check, Trash2, AlertCircle, Pencil, Camera, Map,
} from "lucide-react";
import {
  useUserHomes,
  usePropertyAppliances,
  usePropertyWarranties,
  useBookings,
} from "@/hooks/useBookings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import AddressInput from "./AddressInput";
import type { AddressParts } from "./AddressInput";
import PropertyDetailsForm from "./PropertyDetailsForm";

// ---------------------------------------------------------------------------
// Google Maps static URL helpers
// ---------------------------------------------------------------------------

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function mkStreetViewUrl(address: string) {
  if (!GMAPS_KEY) return null;
  return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(address)}&key=${GMAPS_KEY}`;
}

function mkSatelliteUrl(address: string) {
  if (!GMAPS_KEY) return null;
  return (
    `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}` +
    `&zoom=18&size=600x400&maptype=satellite&markers=color:red%7C${encodeURIComponent(address)}&key=${GMAPS_KEY}`
  );
}

// House type display labels
const HOUSE_TYPE_LABELS: Record<string, string> = {
  single_family: "Single Family",
  townhouse: "Townhouse",
  condo: "Condo",
  duplex: "Duplex",
  mobile: "Mobile Home",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PropertyProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"details" | "appliances" | "history" | "warranties">("details");
  const { data: homes, isLoading: homesLoading } = useUserHomes();
  const [selectedHomeIdx, setSelectedHomeIdx] = useState(0);
  const primaryHome = homes?.[selectedHomeIdx] ?? homes?.[0];
  const {
    data: appliances,
    isLoading: appliancesLoading,
    isError: appliancesError,
  } = usePropertyAppliances(primaryHome?.id);
  const {
    data: warranties,
    isLoading: warrantiesLoading,
    isError: warrantiesError,
  } = usePropertyWarranties(primaryHome?.id);
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
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  // Property details form (shown after adding address or via Edit)
  const [showDetailsFormForId, setShowDetailsFormForId] = useState<string | null>(null);
  const [showDetailsFormAddress, setShowDetailsFormAddress] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add appliance form state
  const [showApplianceForm, setShowApplianceForm] = useState(false);
  const [appName, setAppName] = useState("");
  const [appBrand, setAppBrand] = useState("");
  const [appModel, setAppModel] = useState("");
  const [appSaving, setAppSaving] = useState(false);
  const [appError, setAppError] = useState("");

  // Street View / Satellite image failure tracking per home
  const [streetFailed, setStreetFailed] = useState(false);
  const [satFailed, setSatFailed] = useState(false);

  // Lightbox state for zoomed map images
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxLabel, setLightboxLabel] = useState("");

  const completedBookings = (bookings || [])
    .filter((b) => b.booking_status === "completed")
    .slice(0, 10);

  const inputCls =
    "w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent";

  const handleSaveProperty = async () => {
    if (!newAddress.trim()) { setAddError("Please enter an address."); return; }
    if (!addressConfirmed) { setAddError("Please select an address from the dropdown."); return; }
    if (!user) return;
    setAddError("");
    setAddSaving(true);
    try {
      const { data: inserted, error: insertError } = await supabase
        .from("user_homes")
        .insert({
          user_id: user.id,
          address: newAddress,
          nickname: newNickname.trim() || null,
          city: newCity || null,
          state: newState || null,
          zip_code: newZip || null,
          is_primary: !homes || homes.length === 0,
        })
        .select("id, address")
        .single();

      if (insertError) throw insertError;
      await queryClient.invalidateQueries({ queryKey: ["user-homes", user.id] });
      setShowAddForm(false);
      setNewNickname("");
      setNewAddress("");
      setNewCity("");
      setNewState("");
      setNewZip("");
      // Auto-open property details form for the new home
      if (inserted) {
        setShowDetailsFormForId(inserted.id);
        setShowDetailsFormAddress(inserted.address);
      }
    } catch (err) {
      const pgErr = err as { message?: string };
      setAddError(pgErr?.message ?? "Failed to save. Please try again.");
    } finally {
      setAddSaving(false);
    }
  };

  const handleDeleteProperty = async (homeId: string, homeAddress: string) => {
    if (!user) return;
    setDeleteError(null);
    setDeletingId(homeId);
    try {
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

      if (selectedHomeIdx >= (homes?.length ?? 1) - 1) {
        setSelectedHomeIdx(Math.max(0, (homes?.length ?? 1) - 2));
      }
      await queryClient.invalidateQueries({ queryKey: ["user-homes", user.id] });
    } catch {
      setDeleteError("Failed to delete property.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveAppliance = async () => {
    if (!appName.trim() || !user || !primaryHome) return;
    setAppSaving(true);
    setAppError("");
    try {
      const { error } = await supabase.from("property_appliances").insert({
        user_id: user.id,
        home_id: primaryHome.id,
        appliance_name: appName.trim(),
        brand: appBrand.trim() || null,
        model: appModel.trim() || null,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["appliances", user.id, primaryHome.id] });
      setShowApplianceForm(false);
      setAppName(""); setAppBrand(""); setAppModel("");
    } catch (err: any) {
      setAppError(err?.message ?? "Failed to save.");
    } finally {
      setAppSaving(false);
    }
  };

  if (homesLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Reset image failure state when selected home changes
  const handleSelectHome = (i: number) => {
    setSelectedHomeIdx(i);
    setDeleteError(null);
    setStreetFailed(false);
    setSatFailed(false);
  };

  // If showing the property details form overlay
  if (showDetailsFormForId) {
    const formHome = homes?.find((h) => h.id === showDetailsFormForId);
    return (
      <div className="px-4 py-4 pb-24">
        <PropertyDetailsForm
          homeId={showDetailsFormForId}
          address={showDetailsFormAddress || formHome?.address || ""}
          initialData={formHome ? {
            bedrooms:      formHome.bedrooms,
            bathrooms:     formHome.bathrooms ? Number(formHome.bathrooms) : undefined,
            sqft:          formHome.sqft,
            lot_size_sqft: formHome.lot_size_sqft,
            house_type:    formHome.house_type,
            flooring:      formHome.flooring,
            has_basement:  formHome.has_basement,
            has_fireplace: formHome.has_fireplace,
            heating_type:  formHome.heating_type,
            parcel_number: formHome.parcel_number,
            roof_type:     formHome.roof_type,
          } : undefined}
          onSaved={() => setShowDetailsFormForId(null)}
          onCancel={() => setShowDetailsFormForId(null)}
        />
      </div>
    );
  }

  const svUrl  = primaryHome ? mkStreetViewUrl(primaryHome.address)  : null;
  const satUrl = primaryHome ? mkSatelliteUrl(primaryHome.address)   : null;

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Property selector chips */}
      {homes && homes.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {homes.map((home, i) => (
            <button
              key={home.id}
              onClick={() => handleSelectHome(i)}
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
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Google Maps images */}
          {GMAPS_KEY && (
            <div className="grid grid-cols-2 border-b border-border">
              {/* Street View */}
              {svUrl && !streetFailed ? (
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    const hiRes = svUrl.replace("size=600x400", "size=1200x800");
                    setLightboxUrl(hiRes);
                    setLightboxLabel("Street View");
                  }}
                >
                  <img
                    src={svUrl}
                    alt="Street view"
                    className="w-full h-32 object-cover"
                    onError={() => setStreetFailed(true)}
                  />
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/50 rounded px-1.5 py-0.5">
                    <Camera className="w-2.5 h-2.5 text-white" />
                    <span className="text-[9px] text-white font-medium">Street View</span>
                  </div>
                </div>
              ) : (
                <div className="h-32 bg-muted/50 flex flex-col items-center justify-center gap-1">
                  <Camera className="w-5 h-5 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground">Street View</span>
                </div>
              )}

              {/* Satellite */}
              {satUrl && !satFailed ? (
                <div
                  className="relative border-l border-border cursor-pointer"
                  onClick={() => {
                    const hiRes = satUrl.replace("size=600x400", "size=1200x800");
                    setLightboxUrl(hiRes);
                    setLightboxLabel("Satellite");
                  }}
                >
                  <img
                    src={satUrl}
                    alt="Satellite view"
                    className="w-full h-32 object-cover"
                    onError={() => setSatFailed(true)}
                  />
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/50 rounded px-1.5 py-0.5">
                    <Map className="w-2.5 h-2.5 text-white" />
                    <span className="text-[9px] text-white font-medium">Satellite</span>
                  </div>
                </div>
              ) : (
                <div className="h-32 bg-muted/50 flex flex-col items-center justify-center gap-1 border-l border-border">
                  <Map className="w-5 h-5 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground">Satellite</span>
                </div>
              )}
            </div>
          )}

          {/* Fallback home icon when no API key */}
          {!GMAPS_KEY && (
            <div className="h-24 bg-primary/5 flex flex-col items-center justify-center gap-1 border-b border-border">
              <Home className="w-8 h-8 text-primary/30" />
              <p className="text-[10px] text-muted-foreground">Add VITE_GOOGLE_MAPS_API_KEY for property photos</p>
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{primaryHome.nickname || "My Home"}</h3>
                <p className="text-xs text-muted-foreground truncate">{primaryHome.address}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Edit details button */}
                <button
                  onClick={() => {
                    setShowDetailsFormForId(primaryHome.id);
                    setShowDetailsFormAddress(primaryHome.address);
                  }}
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors shrink-0"
                  title="Edit property details"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
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
            </div>

            {/* City / State / ZIP */}
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

            {/* Property stats row */}
            {(primaryHome.bedrooms != null || primaryHome.bathrooms != null || primaryHome.sqft != null || primaryHome.house_type) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {primaryHome.bedrooms != null && (
                  <span className="px-2.5 py-1 bg-primary/8 text-primary text-xs font-medium rounded-full border border-primary/20">
                    {primaryHome.bedrooms} bed{primaryHome.bedrooms !== 1 ? "s" : ""}
                  </span>
                )}
                {primaryHome.bathrooms != null && (
                  <span className="px-2.5 py-1 bg-primary/8 text-primary text-xs font-medium rounded-full border border-primary/20">
                    {primaryHome.bathrooms} bath{Number(primaryHome.bathrooms) !== 1 ? "s" : ""}
                  </span>
                )}
                {primaryHome.sqft != null && (
                  <span className="px-2.5 py-1 bg-muted text-foreground text-xs font-medium rounded-full border border-border">
                    {primaryHome.sqft.toLocaleString()} sqft
                  </span>
                )}
                {primaryHome.lot_size_sqft != null && (
                  <span className="px-2.5 py-1 bg-muted text-foreground text-xs font-medium rounded-full border border-border">
                    {primaryHome.lot_size_sqft.toLocaleString()} lot sqft
                  </span>
                )}
                {primaryHome.house_type && (
                  <span className="px-2.5 py-1 bg-muted text-foreground text-xs font-medium rounded-full border border-border">
                    {HOUSE_TYPE_LABELS[primaryHome.house_type] ?? primaryHome.house_type}
                  </span>
                )}
              </div>
            )}
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

      {/* Appliances tab */}
      {activeTab === "appliances" && (
        <div className="space-y-3">
          {appliancesError && (
            <div className="flex items-center gap-2 bg-destructive/10 rounded-xl p-3 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">Failed to load appliances. Please try again.</p>
            </div>
          )}
          {appliancesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : !appliancesError && (appliances || []).length === 0 ? (
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

          {/* Add appliance */}
          {showApplianceForm ? (
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Add Appliance</p>
                <button onClick={() => { setShowApplianceForm(false); setAppError(""); }} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                className={inputCls}
                placeholder="Appliance name *"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="Brand (optional)"
                value={appBrand}
                onChange={(e) => setAppBrand(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="Model (optional)"
                value={appModel}
                onChange={(e) => setAppModel(e.target.value)}
              />
              {appError && <p className="text-xs text-destructive">{appError}</p>}
              <button
                onClick={handleSaveAppliance}
                disabled={appSaving || !appName.trim()}
                className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {appSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {appSaving ? "Saving…" : "Save Appliance"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowApplianceForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-muted rounded-2xl py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Appliance
            </button>
          )}
        </div>
      )}

      {/* History tab */}
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

      {/* Details tab */}
      {activeTab === "details" && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Property Details</h3>
            {primaryHome ? (
              <>
                {[
                  { label: "Name",       value: primaryHome.nickname || "—" },
                  { label: "Address",    value: primaryHome.address },
                  { label: "City",       value: primaryHome.city || "—" },
                  { label: "State",      value: primaryHome.state || "—" },
                  { label: "ZIP Code",   value: primaryHome.zip_code || "—" },
                  { label: "House Type", value: primaryHome.house_type ? (HOUSE_TYPE_LABELS[primaryHome.house_type] ?? primaryHome.house_type) : "—" },
                  { label: "Bedrooms",   value: primaryHome.bedrooms != null ? String(primaryHome.bedrooms) : "—" },
                  { label: "Bathrooms",  value: primaryHome.bathrooms != null ? String(primaryHome.bathrooms) : "—" },
                  { label: "Sq Ft",      value: primaryHome.sqft != null ? primaryHome.sqft.toLocaleString() : "—" },
                  { label: "Lot Size",   value: primaryHome.lot_size_sqft != null ? `${primaryHome.lot_size_sqft.toLocaleString()} sqft` : "—" },
                  { label: "Flooring",   value: primaryHome.flooring ? primaryHome.flooring.charAt(0).toUpperCase() + primaryHome.flooring.slice(1) : "—" },
                  { label: "Heating",    value: primaryHome.heating_type ? primaryHome.heating_type.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) : "—" },
                  { label: "Roof Type",  value: primaryHome.roof_type ? primaryHome.roof_type.charAt(0).toUpperCase() + primaryHome.roof_type.slice(1) : "—" },
                  { label: "Basement",   value: primaryHome.has_basement == null ? "—" : primaryHome.has_basement ? "Yes" : "No" },
                  { label: "Fireplace",  value: primaryHome.has_fireplace == null ? "—" : primaryHome.has_fireplace ? "Yes" : "No" },
                  { label: "Parcel #",   value: primaryHome.parcel_number || "—" },
                ].map((d) => (
                  <div key={d.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-medium text-foreground text-right">{d.value}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Add a property to see details</p>
            )}
          </div>

          {/* Edit / add details button */}
          {primaryHome && (
            <button
              onClick={() => {
                setShowDetailsFormForId(primaryHome.id);
                setShowDetailsFormAddress(primaryHome.address);
              }}
              className="w-full flex items-center justify-center gap-2 bg-muted rounded-2xl py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-4 h-4" />
              {primaryHome.bedrooms != null ? "Edit Property Details" : "Add Property Details"}
            </button>
          )}

          <div className="bg-okra-50 rounded-2xl p-3 border border-okra-100 flex items-start gap-2">
            <Calendar className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Maintenance timeline</p>
              <p className="text-[11px] text-muted-foreground">Service history is tracked automatically</p>
            </div>
          </div>
        </div>
      )}

      {/* Warranties tab */}
      {activeTab === "warranties" && (
        <div className="space-y-3">
          {warrantiesError && (
            <div className="flex items-center gap-2 bg-destructive/10 rounded-xl p-3 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">Failed to load warranties. Please try again.</p>
            </div>
          )}
          {warrantiesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : !warrantiesError && (warranties || []).length === 0 ? (
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
      {/* Lightbox overlay */}
      {lightboxUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {lightboxLabel && (
            <span className="absolute top-5 left-4 text-white/80 text-sm font-medium">{lightboxLabel}</span>
          )}
          <img
            src={lightboxUrl}
            alt={lightboxLabel}
            className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </div>
  );
};

export default PropertyProfile;
