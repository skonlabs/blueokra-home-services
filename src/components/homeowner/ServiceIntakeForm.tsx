import { useState, useEffect, forwardRef } from "react";
import { ChevronRight, Minus, Plus, MapPin } from "lucide-react";
import type { IntakeFormData } from "@/lib/quoteCalculator";
import AddressInput from "./AddressInput";
import { useUserHomes } from "@/hooks/useBookings";

interface ServiceIntakeFormProps {
  serviceId: string;
  onSubmit: (data: IntakeFormData) => void;
  initialValues?: Partial<IntakeFormData>;
}

// ---------------------------------------------------------------------------
// Small reusable primitives
// ---------------------------------------------------------------------------

const ChipRow = forwardRef<HTMLDivElement, {
  label: string;
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: ((v: string) => void);
}>(function ChipRow({ label, options, value, onChange }, ref) {
  return (
    <div ref={ref} className="space-y-1.5">
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
});

function Stepper({
  label, value, min = 0, max = 20, onChange, sublabel,
}: {
  label: string;
  sublabel?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full border border-border flex items-center justify-center active:scale-90 transition-transform"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-sm font-semibold w-6 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-full border border-border flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label, sublabel, value, onChange,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
      </div>
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

const CheckList = forwardRef<HTMLDivElement, {
  label: string;
  options: { value: string; label: string; price: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}>(function CheckList({ label, options, values, onChange }, ref) {
  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="space-y-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all active:scale-[0.98] ${
              values.includes(o.value)
                ? "bg-primary/10 border-primary/40 text-foreground"
                : "bg-card border-border text-foreground hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  values.includes(o.value) ? "bg-primary border-primary" : "border-border"
                }`}
              >
                {values.includes(o.value) && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {o.label}
            </div>
            <span className="text-muted-foreground font-medium">{o.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Pricing tables for add-on display (mirrors quoteCalculator.ts)
// ---------------------------------------------------------------------------

const LAWN_ADD_ON_PRICES: Record<string, { aeration: number; overseeding: number; fertilization: number }> = {
  lt1000:   { aeration: 100, overseeding: 75,  fertilization: 50  },
  lt1500:   { aeration: 125, overseeding: 100, fertilization: 75  },
  lt2000:   { aeration: 150, overseeding: 125, fertilization: 100 },
  lt3000:   { aeration: 200, overseeding: 150, fertilization: 125 },
  lt4000:   { aeration: 250, overseeding: 200, fertilization: 150 },
  lt5000:   { aeration: 300, overseeding: 250, fertilization: 175 },
  lt10000:  { aeration: 400, overseeding: 300, fertilization: 200 },
  gte10000: { aeration: 500, overseeding: 600, fertilization: 400 },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const URGENCY_OPTIONS = [
  { value: "emergency" as const, label: "🚨 Same day" },
  { value: "soon" as const,      label: "⏰ This week" },
  { value: "flexible" as const,  label: "📅 Flexible" },
];

const FREQUENCY_OPTIONS = [
  { value: "one-time" as const,  label: "One-time" },
  { value: "weekly" as const,    label: "Weekly" },
  { value: "biweekly" as const,  label: "Bi-weekly" },
  { value: "monthly" as const,   label: "Monthly" },
  { value: "quarterly" as const, label: "Quarterly" },
];

// Services that don't support recurring frequency
const NO_FREQUENCY = new Set(["gutter", "roof", "fence", "backwater"]);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ServiceIntakeForm = ({ serviceId, onSubmit, initialValues }: ServiceIntakeFormProps) => {
  const iv = initialValues ?? {};

  const [urgency,   setUrgency]   = useState<"emergency" | "soon" | "flexible">(iv.urgency   ?? "flexible");
  const [frequency, setFrequency] = useState<"one-time" | "weekly" | "biweekly" | "monthly" | "quarterly">(iv.frequency ?? "one-time");
  const [addOns,    setAddOns]    = useState<string[]>(iv.addOns ?? []);

  // Address
  const [serviceAddress, setServiceAddress] = useState(iv.serviceAddress ?? "");
  const [addressError,   setAddressError]   = useState(false);
  const [usingNewAddress, setUsingNewAddress] = useState(false);

  // Saved homes for address auto-fill
  const { data: homes } = useUserHomes();
  const primaryHome = homes?.find(h => h.is_primary) ?? homes?.[0];

  // Auto-fill address from primary home when homes load (only if no address set yet)
  useEffect(() => {
    if (primaryHome && !serviceAddress) {
      setServiceAddress(primaryHome.address);
    }
  }, [primaryHome?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // If returning with a previously entered address that isn't a saved home, show input mode
  useEffect(() => {
    if (iv.serviceAddress && homes && !homes.some(h => h.address === iv.serviceAddress)) {
      setUsingNewAddress(true);
    }
  }, [homes?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSavedHomeSelected = !usingNewAddress && !!serviceAddress &&
    !!homes?.some(h => h.address === serviceAddress);

  // Lawn
  const [yardSize,    setYardSize]    = useState<IntakeFormData["yardSize"]>(iv.yardSize    ?? "lt3000");
  const [grassHeight, setGrassHeight] = useState<"normal" | "medium" | "tall">(iv.grassHeight ?? "normal");
  const [weedLevel,   setWeedLevel]   = useState<"none" | "few" | "moderate" | "lots">(iv.weedLevel ?? "none");
  const [bushCount,   setBushCount]   = useState(iv.bushCount ?? 0);

  // House Cleaning
  const [bedrooms,              setBedrooms]              = useState(iv.bedrooms              ?? 3);
  const [bathrooms,             setBathrooms]             = useState(iv.bathrooms             ?? 2);
  const [bonusRoomTypes,        setBonusRoomTypes]        = useState<string[]>(iv.bonusRoomTypes ?? []);
  const [lastProfessionalCleaning, setLastProfessionalCleaning] = useState<IntakeFormData["lastProfessionalCleaning"]>(iv.lastProfessionalCleaning ?? "never");

  // Gutter
  const [stories,         setStories]         = useState<1 | 2 | 3>(iv.stories         ?? 1);
  const [gutterCondition, setGutterCondition] = useState<"clear" | "moderate" | "heavy" | "repair">(iv.gutterCondition ?? "clear");

  // Roof
  const [roofSize,        setRoofSize]        = useState<IntakeFormData["roofSize"]>(iv.roofSize        ?? "s2000_2500");
  const [roofStories,     setRoofStories]     = useState<1 | 2 | 3>(iv.roofStories     ?? 1);
  const [mossLevel,       setMossLevel]       = useState<"none" | "light" | "moderate" | "heavy">(iv.mossLevel ?? "none");
  const [algaeProtection, setAlgaeProtection] = useState(iv.algaeProtection ?? false);
  const [roofType,        setRoofType]        = useState<IntakeFormData["roofType"]>(iv.roofType ?? "asphalt");

  // Pressure Washing
  const [homeSize,          setHomeSize]          = useState<IntakeFormData["homeSize"]>(iv.homeSize          ?? "s1000_2000");
  const [surfaces,          setSurfaces]          = useState<string[]>(iv.surfaces          ?? []);
  const [pressureCondition, setPressureCondition] = useState<IntakeFormData["pressureCondition"]>(iv.pressureCondition ?? "light");

  // Duct
  const [ventCount, setVentCount] = useState(iv.ventCount ?? 10);
  const [dryerVent, setDryerVent] = useState(iv.dryerVent ?? false);

  // Backwater
  const [deviceCount,  setDeviceCount]  = useState(iv.deviceCount  ?? 1);
  const [deviceRepair, setDeviceRepair] = useState(iv.deviceRepair ?? false);
  const [certFiling,   setCertFiling]   = useState(iv.certFiling   ?? false);
  const [lastTested,   setLastTested]   = useState<IntakeFormData["lastTested"]>(iv.lastTested ?? "never");

  // Fence
  const [linearFeet,          setLinearFeet]          = useState(iv.linearFeet          ?? 50);
  const [fenceHeight,         setFenceHeight]         = useState<"standard" | "eight_ft">(iv.fenceHeight ?? "standard");
  const [terrain,             setTerrain]             = useState<"flat" | "steep" | "rocky">(iv.terrain ?? "flat");
  const [doorCount,           setDoorCount]           = useState(iv.doorCount           ?? 0);
  const [weatherproofCoating, setWeatherproofCoating] = useState(iv.weatherproofCoating ?? false);

  const handleSubmit = () => {
    if (!serviceAddress.trim()) {
      setAddressError(true);
      return;
    }
    setAddressError(false);

    const base: IntakeFormData = {
      serviceId,
      package: "standard",
      urgency,
      frequency,
      addOns,
      serviceAddress,
    };

    switch (serviceId) {
      case "lawn":
        onSubmit({ ...base, yardSize, grassHeight, weedLevel, bushCount: addOns.includes("bush_trimming") ? bushCount : 0 });
        break;
      case "house_cleaning":
        onSubmit({ ...base, bedrooms, bathrooms, bonusRoomTypes, lastProfessionalCleaning });
        break;
      case "gutter":
        onSubmit({ ...base, stories, gutterCondition });
        break;
      case "roof":
        onSubmit({ ...base, roofSize, roofStories, mossLevel, algaeProtection, roofType });
        break;
      case "pressure":
        onSubmit({ ...base, homeSize, surfaces, pressureCondition });
        break;
      case "duct":
        onSubmit({ ...base, ventCount, dryerVent });
        break;
      case "backwater":
        onSubmit({ ...base, deviceCount, deviceRepair, certFiling, lastTested });
        break;
      case "fence":
        onSubmit({ ...base, linearFeet, fenceHeight, terrain, doorCount, weatherproofCoating });
        break;
      default:
        onSubmit(base);
    }
  };

  const renderServiceFields = () => {
    switch (serviceId) {
      case "lawn": {
        const addOnP = LAWN_ADD_ON_PRICES[yardSize ?? "lt3000"];
        return (
          <>
            <ChipRow label="Yard size" value={yardSize} onChange={setYardSize} options={[
              { value: "lt1000",   label: "< 1,000 sq ft" },
              { value: "lt1500",   label: "< 1,500 sq ft" },
              { value: "lt2000",   label: "< 2,000 sq ft" },
              { value: "lt3000",   label: "< 3,000 sq ft" },
              { value: "lt4000",   label: "< 4,000 sq ft" },
              { value: "lt5000",   label: "< 5,000 sq ft" },
              { value: "lt10000",  label: "< 10,000 sq ft" },
              { value: "gte10000", label: "10,000+ sq ft" },
            ]} />
            <ChipRow label="Grass height" value={grassHeight} onChange={setGrassHeight} options={[
              { value: "normal", label: "Normal (< 6 in)" },
              { value: "medium", label: "Overgrown (6–12 in)" },
              { value: "tall",   label: "Very tall (12+ in)" },
            ]} />
            <ChipRow label="Weed level" value={weedLevel} onChange={setWeedLevel} options={[
              { value: "none",     label: "None" },
              { value: "few",      label: "A few (+$25)" },
              { value: "moderate", label: "Moderate (+$50)" },
              { value: "lots",     label: "Lots (+$100)" },
            ]} />
            <CheckList label="Add-ons (optional)" values={addOns} onChange={setAddOns} options={[
              { value: "aeration",      label: "Aeration",      price: `$${addOnP.aeration}` },
              { value: "overseeding",   label: "Overseeding",   price: `$${addOnP.overseeding}` },
              { value: "fertilization", label: "Fertilization", price: `$${addOnP.fertilization}` },
              { value: "bush_trimming", label: "Bush trimming",
                price: addOns.includes("bush_trimming") && bushCount > 0
                  ? `$${bushCount * 15}`
                  : "$15/bush" },
            ]} />
            {addOns.includes("bush_trimming") && (
              <Stepper label="Number of bushes" value={bushCount} min={1} max={50} onChange={setBushCount} />
            )}
            <p className="text-[11px] text-muted-foreground">
              A first-time setup fee (+50% of base) is applied automatically.
            </p>
          </>
        );
      }

      case "house_cleaning":
        return (
          <>
            <ChipRow label="Last professional cleaning" value={lastProfessionalCleaning} onChange={setLastProfessionalCleaning} options={[
              { value: "lt3months",  label: "< 3 months ago" },
              { value: "gte3months", label: "3+ months ago" },
              { value: "never",      label: "Never cleaned" },
            ]} />
            <p className="text-[11px] text-muted-foreground -mt-2">
              First-time setup fee (+50%) waived if cleaned within 3 months.
            </p>
            <Stepper label="Bedrooms" value={bedrooms} min={1} max={10} onChange={setBedrooms} />
            <Stepper label="Bathrooms" value={bathrooms} min={1} max={8} onChange={setBathrooms} />
            <p className="text-[11px] text-muted-foreground">
              Kitchen always included — $60
            </p>
            <CheckList label="Additional rooms ($15 each)" values={bonusRoomTypes} onChange={setBonusRoomTypes} options={[
              { value: "den",     label: "Den / family room", price: "$15" },
              { value: "office",  label: "Office / study",    price: "$15" },
              { value: "sunroom", label: "Sun room",          price: "$15" },
              { value: "other",   label: "Other room",        price: "$15" },
            ]} />
            <CheckList label="Extras (optional)" values={addOns} onChange={setAddOns} options={[
              { value: "oven",         label: "Inside oven cleaning",   price: "$20" },
              { value: "fridge",       label: "Inside fridge cleaning", price: "$25" },
              { value: "garage",       label: "Garage cleaning",        price: "$75" },
              { value: "basement",     label: "Basement cleaning",      price: "$50" },
              { value: "carpet_stain", label: "Carpet stain removal",   price: "$50" },
            ]} />
          </>
        );

      case "gutter":
        return (
          <>
            <ChipRow label="Home stories" value={String(stories) as "1" | "2" | "3"} onChange={(v) => setStories(Number(v) as 1 | 2 | 3)} options={[
              { value: "1", label: "1 story" },
              { value: "2", label: "2 stories" },
              { value: "3", label: "3 stories" },
            ]} />
            <ChipRow label="Gutter condition" value={gutterCondition} onChange={setGutterCondition} options={[
              { value: "clear",    label: "Good condition" },
              { value: "moderate", label: "Moderately clogged (+$25)" },
              { value: "heavy",    label: "Heavily clogged (+$50)" },
              { value: "repair",   label: "Needs repair (+$100)" },
            ]} />
            <CheckList label="Add-ons (optional)" values={addOns} onChange={setAddOns} options={[
              { value: "downspout",     label: "Downspout cleaning",       price: "$25" },
              { value: "gutter_guard",  label: "Gutter guard installation", price: "$100" },
              { value: "minor_repairs", label: "Minor repairs",            price: "$75" },
            ]} />
          </>
        );

      case "roof":
        return (
          <>
            <ChipRow label="Roof type" value={roofType} onChange={setRoofType} options={[
              { value: "asphalt", label: "Asphalt shingles" },
              { value: "metal",   label: "Metal" },
              { value: "tile",    label: "Tile" },
              { value: "slate",   label: "Slate" },
              { value: "other",   label: "Other" },
            ]} />
            <ChipRow label="Roof size" value={roofSize} onChange={setRoofSize} options={[
              { value: "lt1500",     label: "< 1,500 sq ft" },
              { value: "s1500_2000", label: "1,500–2,000" },
              { value: "s2000_2500", label: "2,000–2,500" },
              { value: "s2500_4000", label: "2,500–4,000" },
              { value: "s4000_5000", label: "4,000–5,000" },
              { value: "gte5000",    label: "5,000+ sq ft" },
            ]} />
            <ChipRow label="Home stories" value={String(roofStories) as "1" | "2" | "3"} onChange={(v) => setRoofStories(Number(v) as 1 | 2 | 3)} options={[
              { value: "1", label: "1 story" },
              { value: "2", label: "2 stories" },
              { value: "3", label: "3 stories" },
            ]} />
            <ChipRow label="Moss / algae level" value={mossLevel} onChange={setMossLevel} options={[
              { value: "none",     label: "None" },
              { value: "light",    label: "Light (+$50)" },
              { value: "moderate", label: "Moderate (+$100)" },
              { value: "heavy",    label: "Heavy (+$250)" },
            ]} />
            <Toggle label="Moss, algae & lichen protection?" sublabel="+$50" value={algaeProtection} onChange={setAlgaeProtection} />
          </>
        );

      case "pressure":
        return (
          <>
            <CheckList label="What needs washing?" values={surfaces} onChange={setSurfaces} options={[
              { value: "driveway",       label: "Driveway",       price: "" },
              { value: "sidewalks",      label: "Sidewalks",      price: "" },
              { value: "house_exterior", label: "House exterior", price: "" },
              { value: "deck_patio",     label: "Deck / Patio",   price: "" },
              { value: "fence",          label: "Fence",          price: "" },
              { value: "garage_floor",   label: "Garage floor",   price: "" },
            ]} />
            <ChipRow label="Area size" value={homeSize} onChange={setHomeSize} options={[
              { value: "lt1000",     label: "< 1,000 sq ft" },
              { value: "s1000_2000", label: "1,000–2,000" },
              { value: "s2000_3000", label: "2,000–3,000" },
              { value: "gte3000",    label: "3,000+ sq ft" },
            ]} />
            <ChipRow label="Surface condition" value={pressureCondition} onChange={setPressureCondition} options={[
              { value: "light",    label: "Light / normal" },
              { value: "moderate", label: "Moderate dirt (+15%)" },
              { value: "heavy",    label: "Heavy stains (+35%)" },
              { value: "mold",     label: "Mold / mildew (+50%)" },
            ]} />
          </>
        );

      case "duct":
        return (
          <>
            <Stepper label="Number of vents" value={ventCount} min={5} max={50} onChange={setVentCount} sublabel="Base covers up to 10 vents. +$25 each after that." />
            <Toggle label="Add dryer vent cleaning?" sublabel="+$100" value={dryerVent} onChange={setDryerVent} />
          </>
        );

      case "backwater":
        return (
          <>
            <div className="bg-muted rounded-xl px-3 py-2 space-y-1">
              <p className="text-xs text-muted-foreground">Property type: <span className="font-medium text-foreground">Residential</span></p>
              <p className="text-xs text-muted-foreground">Test type: <span className="font-medium text-foreground">Annual compliance testing</span></p>
            </div>
            <Stepper label="Number of backwater devices" value={deviceCount} min={1} max={20} onChange={setDeviceCount} sublabel="First device $100, each additional +$50." />
            <ChipRow label="Last tested" value={lastTested} onChange={setLastTested} options={[
              { value: "lt1year",  label: "< 1 year ago" },
              { value: "1_2years", label: "1–2 years ago" },
              { value: "gt2years", label: "2+ years ago" },
              { value: "never",    label: "Never tested" },
            ]} />
            <Toggle label="Any devices need repair?" sublabel="+$150" value={deviceRepair} onChange={setDeviceRepair} />
            <Toggle label="Need certification filing?" sublabel="+$25"  value={certFiling}   onChange={setCertFiling} />
          </>
        );

      case "fence":
        return (
          <>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Linear feet of fencing</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={linearFeet}
                  min={8}
                  max={1000}
                  onChange={(e) => setLinearFeet(Math.max(8, parseInt(e.target.value) || 8))}
                  className="w-24 bg-muted rounded-lg px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-xs text-muted-foreground">linear ft (incl. door widths)</span>
              </div>
            </div>
            <ChipRow label="Fence height" value={fenceHeight} onChange={setFenceHeight} options={[
              { value: "standard", label: "Standard (6 ft)" },
              { value: "eight_ft", label: "8 ft (+$10/ft)" },
            ]} />
            <ChipRow label="Terrain" value={terrain} onChange={setTerrain} options={[
              { value: "flat",  label: "Flat" },
              { value: "steep", label: "Steep (+$10/ft)" },
              { value: "rocky", label: "Rocky (+$20/ft)" },
            ]} />
            <Stepper label="Number of gates / doors" value={doorCount} min={0} max={10} onChange={setDoorCount} sublabel="+$50 per gate" />
            <CheckList label="Extras (optional)" values={addOns} onChange={setAddOns} options={[
              { value: "weatherproof", label: "Weatherproof coating",  price: "+$100" },
              { value: "repair",       label: "Fence repair",          price: "$50/linear ft" },
            ]} />
            {addOns.includes("repair") && (
              <p className="text-[11px] text-muted-foreground bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                Repair rate: $50/linear ft applied to the linear footage above. Height and terrain adders apply to new installation only.
              </p>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4">

      {/* Service address — required */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">
          Service address <span className="text-destructive">*</span>
        </p>

        {/* Saved home chips */}
        {homes && homes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {homes.map((home) => (
              <button
                key={home.id}
                type="button"
                onClick={() => {
                  setUsingNewAddress(false);
                  setServiceAddress(home.address);
                  setAddressError(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                  !usingNewAddress && serviceAddress === home.address
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-foreground border-border hover:border-primary/50"
                }`}
              >
                {home.nickname || home.address.split(",")[0]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setUsingNewAddress(true); setServiceAddress(""); setAddressError(false); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                usingNewAddress
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-foreground border-border hover:border-primary/50"
              }`}
            >
              + New address
            </button>
          </div>
        )}

        {/* Static display for saved home, or AddressInput for new */}
        {isSavedHomeSelected ? (
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate">{serviceAddress}</span>
          </div>
        ) : (
          <AddressInput
            value={serviceAddress}
            onChange={(addr) => {
              setServiceAddress(addr);
              if (addr.trim()) setAddressError(false);
            }}
            placeholder="Enter the address where service is needed"
            hasError={addressError}
          />
        )}

        {addressError && (
          <p className="text-xs text-destructive">Please enter a service address to continue.</p>
        )}
      </div>

      {/* Service-specific fields */}
      {renderServiceFields()}

      {/* Urgency */}
      <ChipRow label="How urgent?" value={urgency} onChange={setUrgency} options={URGENCY_OPTIONS} />

      {/* Frequency (only for applicable services) */}
      {!NO_FREQUENCY.has(serviceId) && (
        <ChipRow label="How often?" value={frequency} onChange={setFrequency} options={FREQUENCY_OPTIONS} />
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mt-2"
      >
        Get Quote
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ServiceIntakeForm;
