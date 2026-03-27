import { useState } from "react";
import { ChevronRight, Minus, Plus } from "lucide-react";
import type { IntakeFormData } from "@/lib/quoteCalculator";

interface ServiceIntakeFormProps {
  serviceId: string;
  onSubmit: (data: IntakeFormData) => void;
}

// ---------------------------------------------------------------------------
// Small reusable primitives
// ---------------------------------------------------------------------------

function ChipRow<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
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
  label, value, min = 0, max = 20, onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
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

function CheckList({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; price: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
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
}

// ---------------------------------------------------------------------------
// Service-specific form sections
// ---------------------------------------------------------------------------

const PACKAGE_OPTIONS = [
  { value: "standard" as const, label: "Standard" },
  { value: "premium" as const,  label: "Premium" },
  { value: "ultimate" as const, label: "Ultimate" },
];

const URGENCY_OPTIONS = [
  { value: "emergency" as const, label: "🚨 Same day" },
  { value: "soon" as const,      label: "⏰ This week" },
  { value: "flexible" as const,  label: "📅 Flexible" },
];

const FREQUENCY_OPTIONS = [
  { value: "one-time" as const, label: "One-time" },
  { value: "weekly" as const,   label: "Weekly" },
  { value: "biweekly" as const, label: "Bi-weekly" },
  { value: "monthly" as const,  label: "Monthly" },
  { value: "quarterly" as const,label: "Quarterly" },
];

// Services that don't benefit from recurring bulk discounts
const NO_FREQUENCY = new Set(["gutter", "roof", "fence", "backwater"]);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ServiceIntakeForm = ({ serviceId, onSubmit }: ServiceIntakeFormProps) => {
  const [pkg, setPkg] = useState<"standard" | "premium" | "ultimate">("standard");
  const [urgency, setUrgency] = useState<"emergency" | "soon" | "flexible">("flexible");
  const [frequency, setFrequency] = useState<"one-time" | "weekly" | "biweekly" | "monthly" | "quarterly">("one-time");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [addOns, setAddOns] = useState<string[]>([]);

  // Lawn
  const [yardSize, setYardSize] = useState<IntakeFormData["yardSize"]>("lt3000");
  const [grassHeight, setGrassHeight] = useState<"normal" | "medium" | "tall">("normal");
  const [weedLevel, setWeedLevel] = useState<"none" | "few" | "moderate" | "lots">("none");
  const [bushCount, setBushCount] = useState(0);

  // House Cleaning
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [bonusRooms, setBonusRooms] = useState(0);

  // Gutter
  const [stories, setStories] = useState<1 | 2 | 3>(1);
  const [gutterCondition, setGutterCondition] = useState<"clear" | "moderate" | "heavy" | "repair">("clear");

  // Roof
  const [roofSize, setRoofSize] = useState<IntakeFormData["roofSize"]>("s2000_2500");
  const [roofStories, setRoofStories] = useState<1 | 2 | 3>(1);
  const [mossLevel, setMossLevel] = useState<"none" | "light" | "moderate" | "heavy">("none");
  const [algaeProtection, setAlgaeProtection] = useState(false);

  // Pressure / Electrical
  const [homeSize, setHomeSize] = useState<IntakeFormData["homeSize"]>("s1000_2000");

  // Duct
  const [ventCount, setVentCount] = useState(10);
  const [dryerVent, setDryerVent] = useState(false);

  // Backwater
  const [deviceCount, setDeviceCount] = useState(1);
  const [deviceRepair, setDeviceRepair] = useState(false);
  const [certFiling, setCertFiling] = useState(false);

  // Fence
  const [linearFeet, setLinearFeet] = useState(50);
  const [fenceHeight, setFenceHeight] = useState<"standard" | "eight_ft">("standard");
  const [terrain, setTerrain] = useState<"flat" | "steep" | "rocky">("flat");
  const [doorCount, setDoorCount] = useState(0);
  const [isRepair, setIsRepair] = useState(false);
  const [weatherproofCoating, setWeatherproofCoating] = useState(false);

  const handleSubmit = () => {
    const base: IntakeFormData = { serviceId, package: pkg, urgency, frequency, isFirstTime, addOns };
    switch (serviceId) {
      case "lawn":
        onSubmit({ ...base, yardSize, grassHeight, weedLevel, bushCount: addOns.includes("bush_trimming") ? bushCount : 0 });
        break;
      case "house_cleaning":
        onSubmit({ ...base, bedrooms, bathrooms, bonusRooms });
        break;
      case "gutter":
        onSubmit({ ...base, stories, gutterCondition });
        break;
      case "roof":
        onSubmit({ ...base, roofSize, roofStories, mossLevel, algaeProtection });
        break;
      case "pressure":
      case "electrical":
        onSubmit({ ...base, homeSize });
        break;
      case "duct":
        onSubmit({ ...base, ventCount, dryerVent });
        break;
      case "backwater":
        onSubmit({ ...base, deviceCount, deviceRepair, certFiling });
        break;
      case "fence":
        onSubmit({ ...base, linearFeet, fenceHeight, terrain, doorCount, isRepair, weatherproofCoating });
        break;
      default:
        onSubmit(base);
    }
  };

  const renderServiceFields = () => {
    switch (serviceId) {
      case "lawn":
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
              { value: "aeration",      label: "Aeration",      price: "from $100" },
              { value: "overseeding",   label: "Overseeding",   price: "from $75" },
              { value: "fertilization", label: "Fertilization", price: "from $50" },
              { value: "bush_trimming", label: "Bush trimming", price: "$15/bush" },
            ]} />
            {addOns.includes("bush_trimming") && (
              <Stepper label="Number of bushes" value={bushCount} min={1} max={50} onChange={setBushCount} />
            )}
            <Toggle label="First-time customer?" sublabel="+50% surcharge on base" value={isFirstTime} onChange={setIsFirstTime} />
          </>
        );

      case "house_cleaning":
        return (
          <>
            <Stepper label="Bedrooms" value={bedrooms} min={1} max={10} onChange={setBedrooms} />
            <Stepper label="Bathrooms" value={bathrooms} min={1} max={8} onChange={setBathrooms} />
            <Stepper label="Bonus rooms (office, den…)" value={bonusRooms} min={0} max={6} onChange={setBonusRooms} />
            <CheckList label="Add-ons (optional)" values={addOns} onChange={setAddOns} options={[
              { value: "oven",         label: "Inside oven cleaning",    price: "$20" },
              { value: "fridge",       label: "Inside fridge cleaning",  price: "$25" },
              { value: "garage",       label: "Garage cleaning",         price: "$75" },
              { value: "carpet_stain", label: "Carpet stain removal",    price: "$50" },
            ]} />
            <Toggle label="First-time customer?" sublabel="+50% surcharge on base" value={isFirstTime} onChange={setIsFirstTime} />
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
              { value: "clear",    label: "Clear" },
              { value: "moderate", label: "Moderately clogged (+$25)" },
              { value: "heavy",    label: "Heavily clogged (+$50)" },
              { value: "repair",   label: "Needs repair (+$100)" },
            ]} />
            <CheckList label="Add-ons (optional)" values={addOns} onChange={setAddOns} options={[
              { value: "downspout",    label: "Downspout cleaning", price: "+$25" },
              { value: "gutter_guard", label: "Gutter guard install", price: "$100" },
              { value: "minor_repairs",label: "Minor repairs",      price: "+$75" },
            ]} />
          </>
        );

      case "roof":
        return (
          <>
            <ChipRow label="Roof size" value={roofSize} onChange={setRoofSize} options={[
              { value: "lt1500",     label: "< 1,500 sq ft" },
              { value: "s1500_2000", label: "1,500–2,000" },
              { value: "s2000_2500", label: "2,000–2,500" },
              { value: "s2500_4000", label: "2,500–4,000" },
              { value: "s4000_5000", label: "4,000–5,000" },
              { value: "gte5000",    label: "5,000+ sq ft" },
            ]} />
            <ChipRow label="Home stories (for premium gutter add-on)" value={String(roofStories) as "1" | "2" | "3"} onChange={(v) => setRoofStories(Number(v) as 1 | 2 | 3)} options={[
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
            <Toggle label="Algae protection treatment?" sublabel="+$50" value={algaeProtection} onChange={setAlgaeProtection} />
          </>
        );

      case "pressure":
        return (
          <>
            <ChipRow label="Home size" value={homeSize} onChange={setHomeSize} options={[
              { value: "lt1000",    label: "< 1,000 sq ft" },
              { value: "s1000_2000",label: "1,000–2,000" },
              { value: "s2000_3000",label: "2,000–3,000" },
              { value: "gte3000",   label: "3,000+ sq ft" },
            ]} />
            <Toggle label="First-time customer?" sublabel="+50% surcharge" value={isFirstTime} onChange={setIsFirstTime} />
          </>
        );

      case "electrical":
        return (
          <ChipRow label="Home size" value={homeSize} onChange={setHomeSize} options={[
            { value: "lt1000",    label: "< 1,000 sq ft" },
            { value: "s1000_2000",label: "1,000–2,000" },
            { value: "s2000_3000",label: "2,000–3,000" },
            { value: "gte3000",   label: "3,000+ sq ft" },
          ]} />
        );

      case "duct":
        return (
          <>
            <Stepper label="Number of vents" value={ventCount} min={1} max={40} onChange={setVentCount} />
            <p className="text-[11px] text-muted-foreground -mt-1">Base covers up to 10 vents. +$25 each after that.</p>
            <Toggle label="Add dryer vent cleaning?" sublabel="+$100" value={dryerVent} onChange={setDryerVent} />
          </>
        );

      case "backwater":
        return (
          <>
            <Stepper label="Number of backwater devices" value={deviceCount} min={1} max={5} onChange={setDeviceCount} />
            <p className="text-[11px] text-muted-foreground -mt-1">First device $100, each additional +$50.</p>
            <Toggle label="Any devices need repair?" sublabel="+$150 per device" value={deviceRepair} onChange={setDeviceRepair} />
            <Toggle label="Need certification filing?" sublabel="+$25" value={certFiling} onChange={setCertFiling} />
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
                  min={1}
                  max={2000}
                  onChange={(e) => setLinearFeet(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 bg-muted rounded-lg px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-xs text-muted-foreground">linear ft</span>
              </div>
            </div>
            <ChipRow label="Fence height" value={fenceHeight} onChange={setFenceHeight} options={[
              { value: "standard",  label: "Standard (6 ft)" },
              { value: "eight_ft",  label: "8 ft (+$10/ft)" },
            ]} />
            <ChipRow label="Terrain" value={terrain} onChange={setTerrain} options={[
              { value: "flat",   label: "Flat" },
              { value: "steep",  label: "Steep (+$10/ft)" },
              { value: "rocky",  label: "Rocky (+$20/ft)" },
            ]} />
            <Stepper label="Number of gates / doors" value={doorCount} min={0} max={10} onChange={setDoorCount} />
            <p className="text-[11px] text-muted-foreground -mt-1">+$50 per gate</p>
            <Toggle label="Repair job?" sublabel="50% discount on all costs" value={isRepair} onChange={setIsRepair} />
            <Toggle label="Weatherproof coating?" sublabel="+$100" value={weatherproofCoating} onChange={setWeatherproofCoating} />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
      {/* Package */}
      <ChipRow label="Package" value={pkg} onChange={setPkg} options={PACKAGE_OPTIONS} />

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
