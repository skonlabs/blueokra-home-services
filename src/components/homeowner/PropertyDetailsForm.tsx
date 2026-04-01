import { useState } from "react";
import { Minus, Plus, X, Check, Loader2, MapPin, Map, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PropertyDetails {
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  lot_size_sqft?: number | null;
  house_type?: string | null;
  flooring?: string | null;
  has_basement?: boolean | null;
  has_fireplace?: boolean | null;
  heating_type?: string | null;
  parcel_number?: string | null;
  roof_type?: string | null;
}

interface PropertyDetailsFormProps {
  homeId: string;
  address: string;
  initialData?: PropertyDetails;
  onSaved: () => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Local form primitives (same patterns as ServiceIntakeForm)
// ---------------------------------------------------------------------------

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
              value === o.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  step = 1,
  min = 0,
  max = 20,
  format,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, Math.round((value - step) * 10) / 10));
  const inc = () => onChange(Math.min(max, Math.round((value + step) * 10) / 10));
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          className="w-7 h-7 rounded-full border border-border flex items-center justify-center active:scale-90 transition-transform"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-sm font-semibold w-8 text-center">
          {format ? format(value) : value}
        </span>
        <button
          type="button"
          onClick={inc}
          className="w-7 h-7 rounded-full border border-border flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full transition-colors relative ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Google Maps image URL helpers
// ---------------------------------------------------------------------------

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function streetViewUrl(address: string) {
  if (!GMAPS_KEY) return null;
  return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(address)}&key=${GMAPS_KEY}`;
}

function satelliteUrl(address: string) {
  if (!GMAPS_KEY) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=18&size=600x400&maptype=satellite&markers=color:red%7C${encodeURIComponent(address)}&key=${GMAPS_KEY}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const PropertyDetailsForm = ({ homeId, address, initialData, onSaved, onCancel }: PropertyDetailsFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const d = initialData ?? {};

  const [houseType,    setHouseType]    = useState<string>(d.house_type    ?? "");
  const [bedrooms,     setBedrooms]     = useState<number>(d.bedrooms      ?? 0);
  const [bathrooms,    setBathrooms]    = useState<number>(d.bathrooms     ?? 0);
  const [sqft,         setSqft]         = useState<string>(d.sqft          ? String(d.sqft) : "");
  const [lotSizeSqft,  setLotSizeSqft]  = useState<string>(d.lot_size_sqft ? String(d.lot_size_sqft) : "");
  const [flooring,     setFlooring]     = useState<string>(d.flooring      ?? "");
  const [heatingType,  setHeatingType]  = useState<string>(d.heating_type  ?? "");
  const [roofType,     setRoofType]     = useState<string>(d.roof_type     ?? "");
  const [hasBasement,  setHasBasement]  = useState<boolean>(d.has_basement  ?? false);
  const [hasFireplace, setHasFireplace] = useState<boolean>(d.has_fireplace ?? false);
  const [parcelNumber, setParcelNumber] = useState<string>(d.parcel_number  ?? "");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Image load failure tracking
  const [streetFailed, setStreetFailed] = useState(false);
  const [satFailed,    setSatFailed]    = useState(false);

  const svUrl  = streetViewUrl(address);
  const satUrl = satelliteUrl(address);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    try {
      const { error } = await supabase
        .from("user_homes")
        .update({
          house_type:    houseType    || null,
          bedrooms:      bedrooms     || null,
          bathrooms:     bathrooms    || null,
          sqft:          sqft         ? parseInt(sqft, 10)         : null,
          lot_size_sqft: lotSizeSqft  ? parseInt(lotSizeSqft, 10) : null,
          flooring:      flooring     || null,
          heating_type:  heatingType  || null,
          roof_type:     roofType     || null,
          has_basement:  hasBasement,
          has_fireplace: hasFireplace,
          parcel_number: parcelNumber || null,
        } as any)
        .eq("id", homeId)
        .eq("user_id", user.id);

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["user-homes", user.id] });
      onSaved();
    } catch (err: any) {
      setSaveError(err?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent";

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground">Property Details</p>
        <button
          onClick={onCancel}
          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Address preview */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground truncate">{address}</p>
      </div>

      {/* Google Maps images */}
      {GMAPS_KEY && (
        <div className="grid grid-cols-2 gap-0 border-b border-border">
          {/* Street View */}
          {svUrl && !streetFailed ? (
            <div className="relative">
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
            <div className="h-32 bg-muted flex flex-col items-center justify-center gap-1">
              <Camera className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Street View</span>
            </div>
          )}

          {/* Satellite */}
          {satUrl && !satFailed ? (
            <div className="relative border-l border-border">
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
            <div className="h-32 bg-muted flex flex-col items-center justify-center gap-1 border-l border-border">
              <Map className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Satellite</span>
            </div>
          )}
        </div>
      )}

      {/* Form fields */}
      <div className="p-4 space-y-4">
        <ChipRow
          label="House type"
          value={houseType}
          onChange={setHouseType}
          options={[
            { value: "single_family", label: "Single Family" },
            { value: "townhouse",     label: "Townhouse" },
            { value: "condo",         label: "Condo" },
            { value: "duplex",        label: "Duplex" },
            { value: "mobile",        label: "Mobile" },
          ]}
        />

        <div className="space-y-2">
          <Stepper label="Bedrooms" value={bedrooms} min={0} max={10} onChange={setBedrooms} />
          <Stepper
            label="Bathrooms"
            value={bathrooms}
            step={0.5}
            min={0}
            max={10}
            format={(v) => (v % 1 === 0 ? String(v) : v.toFixed(1))}
            onChange={setBathrooms}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Sq Ft
            </label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 2400"
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Lot Size (sq ft)
            </label>
            <input
              type="number"
              className={inputCls}
              placeholder="e.g. 8000"
              value={lotSizeSqft}
              onChange={(e) => setLotSizeSqft(e.target.value)}
              min={0}
            />
          </div>
        </div>

        <ChipRow
          label="Flooring"
          value={flooring}
          onChange={setFlooring}
          options={[
            { value: "hardwood", label: "Hardwood" },
            { value: "carpet",   label: "Carpet" },
            { value: "tile",     label: "Tile" },
            { value: "laminate", label: "Laminate" },
            { value: "mixed",    label: "Mixed" },
          ]}
        />

        <ChipRow
          label="Heating"
          value={heatingType}
          onChange={setHeatingType}
          options={[
            { value: "forced_air", label: "Forced Air" },
            { value: "radiant",    label: "Radiant" },
            { value: "heat_pump",  label: "Heat Pump" },
            { value: "baseboard",  label: "Baseboard" },
            { value: "none",       label: "None" },
          ]}
        />

        <ChipRow
          label="Roof type"
          value={roofType}
          onChange={setRoofType}
          options={[
            { value: "asphalt", label: "Asphalt" },
            { value: "metal",   label: "Metal" },
            { value: "tile",    label: "Tile" },
            { value: "slate",   label: "Slate" },
            { value: "flat",    label: "Flat" },
          ]}
        />

        <div className="bg-muted/40 rounded-xl p-3 space-y-1">
          <Toggle label="Basement" value={hasBasement} onChange={setHasBasement} />
          <Toggle label="Fireplace" value={hasFireplace} onChange={setHasFireplace} />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Parcel number <span className="font-normal">(optional)</span>
          </label>
          <input
            type="text"
            className={inputCls}
            placeholder="From county records"
            value={parcelNumber}
            onChange={(e) => setParcelNumber(e.target.value)}
          />
        </div>

        {saveError && (
          <p className="text-xs text-destructive">{saveError}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 bg-muted text-foreground font-medium py-2.5 rounded-xl text-sm active:scale-[0.97] transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.97] transition-transform"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Save Details"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsForm;
