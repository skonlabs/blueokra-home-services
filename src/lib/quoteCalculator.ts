import type { QuoteData } from "@/components/homeowner/AIIntakeChat";
import { getBulkDiscount } from "@/hooks/usePricing";

// ---------------------------------------------------------------------------
// Intake form data — all variables needed to calculate any service quote
// ---------------------------------------------------------------------------

export interface IntakeFormData {
  serviceId: string;
  package: "standard" | "premium" | "ultimate";
  urgency: "emergency" | "soon" | "flexible";
  frequency: "one-time" | "weekly" | "biweekly" | "monthly" | "quarterly";
  isFirstTime: boolean;

  // Lawn
  yardSize?: "lt1000" | "lt1500" | "lt2000" | "lt3000" | "lt4000" | "lt5000" | "lt10000" | "gte10000";
  grassHeight?: "normal" | "medium" | "tall";
  weedLevel?: "none" | "few" | "moderate" | "lots";
  addOns?: string[];
  bushCount?: number;

  // House Cleaning
  bedrooms?: number;
  bathrooms?: number;
  bonusRooms?: number;

  // Gutter
  stories?: 1 | 2 | 3;
  gutterCondition?: "clear" | "moderate" | "heavy" | "repair";

  // Roof
  roofSize?: "lt1500" | "s1500_2000" | "s2000_2500" | "s2500_4000" | "s4000_5000" | "gte5000";
  roofStories?: 1 | 2 | 3;
  mossLevel?: "none" | "light" | "moderate" | "heavy";
  algaeProtection?: boolean;

  // Pressure Washing / Electrical
  homeSize?: "lt1000" | "s1000_2000" | "s2000_3000" | "gte3000";

  // Duct
  ventCount?: number;
  dryerVent?: boolean;

  // Backwater
  deviceCount?: number;
  deviceRepair?: boolean;
  certFiling?: boolean;

  // Fence
  linearFeet?: number;
  fenceHeight?: "standard" | "eight_ft";
  terrain?: "flat" | "steep" | "rocky";
  doorCount?: number;
  isRepair?: boolean;
  weatherproofCoating?: boolean;
}

// ---------------------------------------------------------------------------
// Pricing tables (mirrors DB seed data)
// ---------------------------------------------------------------------------

const SERVICE_NAMES: Record<string, string> = {
  lawn: "Lawn Care",
  house_cleaning: "House Cleaning",
  gutter: "Gutter Cleaning",
  roof: "Roof Cleaning",
  pressure: "Pressure Washing",
  electrical: "Electrical",
  duct: "Duct Cleaning",
  backwater: "Backwater Testing",
  fence: "Fence Installation",
};

const FREQUENCY_SERVICES_PER_YEAR: Record<string, number> = {
  "one-time": 1,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
};

// Services that are exempt from bulk discount
const BULK_EXEMPT = new Set(["gutter", "roof", "fence"]);
// Services that are exempt from first-time surcharge
const FIRST_TIME_EXEMPT = new Set(["gutter", "roof", "electrical", "duct", "backwater", "fence"]);

function getSlots(urgency: string): string[] {
  if (urgency === "emergency") {
    return ["Today 10am", "Today 1pm", "Today 4pm", "Tomorrow 8am", "Tomorrow 11am", "Tomorrow 2pm"];
  }
  if (urgency === "soon") {
    return ["Tomorrow 9am", "Tomorrow 1pm", "Wed 9am", "Wed 1pm", "Thu 10am", "Fri 9am"];
  }
  return ["Sat 9am", "Sat 1pm", "Sun 10am", "Mon 9am", "Tue 10am", "Wed 9am"];
}

function applyBulkDiscount(total: number, serviceId: string, frequency: string): number {
  if (BULK_EXEMPT.has(serviceId)) return total;
  const qty = FREQUENCY_SERVICES_PER_YEAR[frequency] ?? 1;
  const discount = getBulkDiscount(qty);
  return total * (1 - discount);
}

function bulkDiscountLabel(serviceId: string, frequency: string): string | null {
  if (BULK_EXEMPT.has(serviceId)) return null;
  const qty = FREQUENCY_SERVICES_PER_YEAR[frequency] ?? 1;
  const pct = getBulkDiscount(qty) * 100;
  if (pct === 0) return null;
  return `${pct}% recurring discount (${frequency})`;
}

// ---------------------------------------------------------------------------
// Per-service calculators
// ---------------------------------------------------------------------------

function calcLawn(d: IntakeFormData): QuoteData {
  const basePrices: Record<string, Record<string, number>> = {
    lt1000:   { standard: 75,  premium: 125, ultimate: 200 },
    lt1500:   { standard: 100, premium: 150, ultimate: 225 },
    lt2000:   { standard: 125, premium: 175, ultimate: 250 },
    lt3000:   { standard: 150, premium: 200, ultimate: 275 },
    lt4000:   { standard: 175, premium: 225, ultimate: 300 },
    lt5000:   { standard: 200, premium: 250, ultimate: 325 },
    lt10000:  { standard: 250, premium: 300, ultimate: 375 },
    gte10000: { standard: 400, premium: 450, ultimate: 500 },
  };
  const addOnPrices: Record<string, Record<string, number>> = {
    lt1000:   { aeration: 100, overseeding: 75,  fertilization: 50  },
    lt1500:   { aeration: 125, overseeding: 100, fertilization: 75  },
    lt2000:   { aeration: 150, overseeding: 125, fertilization: 100 },
    lt3000:   { aeration: 200, overseeding: 150, fertilization: 125 },
    lt4000:   { aeration: 250, overseeding: 200, fertilization: 150 },
    lt5000:   { aeration: 300, overseeding: 250, fertilization: 175 },
    lt10000:  { aeration: 400, overseeding: 300, fertilization: 200 },
    gte10000: { aeration: 500, overseeding: 600, fertilization: 400 },
  };

  const yardKey = d.yardSize ?? "lt3000";
  const base = basePrices[yardKey][d.package];

  const breakdown: { label: string; amount: string }[] = [];
  const factors: string[] = ["Upfront payment saves 5% at checkout"];

  // Grass height surcharge on base
  let adjusted = base;
  if (d.grassHeight === "medium") {
    adjusted = base * 1.5;
    breakdown.push({ label: `Base (${yardKey.replace("lt","<").replace("gte","≥")} sq ft, ${d.package})`, amount: `$${base}` });
    breakdown.push({ label: "Grass height surcharge (6–12 in, +50%)", amount: `$${base * 0.5}` });
  } else if (d.grassHeight === "tall") {
    adjusted = base * 2;
    breakdown.push({ label: `Base (${yardKey.replace("lt","<").replace("gte","≥")} sq ft, ${d.package})`, amount: `$${base}` });
    breakdown.push({ label: "Grass height surcharge (12+ in, +100%)", amount: `$${base}` });
  } else {
    breakdown.push({ label: `Base mowing (${yardKey.replace("lt","<").replace("gte","≥")} sq ft, ${d.package})`, amount: `$${base}` });
  }

  // Weed surcharge
  const weedAmounts: Record<string, number> = { few: 25, moderate: 50, lots: 100 };
  const weedAmt = weedAmounts[d.weedLevel ?? "none"] ?? 0;
  if (weedAmt) {
    adjusted += weedAmt;
    breakdown.push({ label: `Weed surcharge (${d.weedLevel})`, amount: `$${weedAmt}` });
  }

  // First-time surcharge
  if (d.isFirstTime && !FIRST_TIME_EXEMPT.has("lawn")) {
    const surcharge = base * 0.5;
    adjusted += surcharge;
    breakdown.push({ label: "First-time surcharge (+50% on base)", amount: `$${surcharge}` });
  }

  // Add-ons
  let addOnTotal = 0;
  const yardAddOns = addOnPrices[yardKey];
  for (const addOn of d.addOns ?? []) {
    if (addOn === "bush_trimming") {
      const bushAmt = (d.bushCount ?? 1) * 15;
      breakdown.push({ label: `Bush trimming (${d.bushCount ?? 1} bushes)`, amount: `$${bushAmt}` });
      addOnTotal += bushAmt;
    } else if (yardAddOns[addOn]) {
      breakdown.push({ label: `${addOn.charAt(0).toUpperCase() + addOn.slice(1)}`, amount: `$${yardAddOns[addOn]}` });
      addOnTotal += yardAddOns[addOn];
    }
  }

  let total = adjusted + addOnTotal;
  const discountLabel = bulkDiscountLabel("lawn", d.frequency);
  if (discountLabel) {
    const discountAmt = Math.round(total * getBulkDiscount(FREQUENCY_SERVICES_PER_YEAR[d.frequency]));
    breakdown.push({ label: discountLabel, amount: `-$${discountAmt}` });
    total = applyBulkDiscount(total, "lawn", d.frequency);
  }

  total = Math.round(total);
  return {
    serviceId: "lawn", serviceName: "Lawn Care", type: "fixed",
    low: total, high: total, confidence: 92,
    breakdown, factors, slots: getSlots(d.urgency),
  };
}

function calcHouseCleaning(d: IntakeFormData): QuoteData {
  const rates: Record<string, Record<string, number>> = {
    bedroom:    { standard: 15, premium: 18.75, ultimate: 22.50 },
    bathroom:   { standard: 25, premium: 31.25, ultimate: 37.50 },
    bonus_room: { standard: 15, premium: 18.75, ultimate: 22.50 },
    kitchen:    { standard: 60, premium: 75,    ultimate: 90    },
  };

  const bedrooms = d.bedrooms ?? 3;
  const bathrooms = d.bathrooms ?? 2;
  const bonusRooms = d.bonusRooms ?? 0;
  const r = rates;
  const pkg = d.package;

  let base = bedrooms * r.bedroom[pkg] + bathrooms * r.bathroom[pkg] + bonusRooms * r.bonus_room[pkg] + r.kitchen[pkg];

  const breakdown: { label: string; amount: string }[] = [
    { label: `${bedrooms} bedroom${bedrooms !== 1 ? "s" : ""} × $${r.bedroom[pkg]}`, amount: `$${bedrooms * r.bedroom[pkg]}` },
    { label: `${bathrooms} bathroom${bathrooms !== 1 ? "s" : ""} × $${r.bathroom[pkg]}`, amount: `$${bathrooms * r.bathroom[pkg]}` },
    { label: `Kitchen`, amount: `$${r.kitchen[pkg]}` },
  ];
  if (bonusRooms > 0) {
    breakdown.push({ label: `${bonusRooms} bonus room${bonusRooms !== 1 ? "s" : ""} × $${r.bonus_room[pkg]}`, amount: `$${bonusRooms * r.bonus_room[pkg]}` });
  }

  if (d.isFirstTime) {
    const surcharge = Math.round(base * 0.5);
    breakdown.push({ label: "First-time surcharge (+50% on base)", amount: `$${surcharge}` });
    base = base * 1.5;
  }

  const addOnPrices: Record<string, number> = { oven: 20, fridge: 25, garage: 75, carpet_stain: 50 };
  let addOnTotal = 0;
  for (const addOn of d.addOns ?? []) {
    if (addOnPrices[addOn]) {
      const label = addOn === "oven" ? "Inside oven cleaning" : addOn === "fridge" ? "Inside fridge cleaning" : addOn === "garage" ? "Garage cleaning" : "Carpet stain removal";
      breakdown.push({ label, amount: `$${addOnPrices[addOn]}` });
      addOnTotal += addOnPrices[addOn];
    }
  }

  let total = base + addOnTotal;
  const discountLabel = bulkDiscountLabel("house_cleaning", d.frequency);
  if (discountLabel) {
    const discountAmt = Math.round(total * getBulkDiscount(FREQUENCY_SERVICES_PER_YEAR[d.frequency]));
    breakdown.push({ label: discountLabel, amount: `-$${discountAmt}` });
    total = applyBulkDiscount(total, "house_cleaning", d.frequency);
  }

  total = Math.round(total);
  return {
    serviceId: "house_cleaning", serviceName: "House Cleaning", type: "fixed",
    low: total, high: total, confidence: 95,
    breakdown, factors: ["Upfront payment saves 5% at checkout"], slots: getSlots(d.urgency),
  };
}

function calcGutter(d: IntakeFormData): QuoteData {
  const basePrices: Record<number, Record<string, number>> = {
    1: { standard: 125, premium: 225, ultimate: 300 },
    2: { standard: 150, premium: 300, ultimate: 400 },
    3: { standard: 200, premium: 400, ultimate: 500 },
  };

  const stories = d.stories ?? 1;
  const base = basePrices[stories][d.package];
  const breakdown: { label: string; amount: string }[] = [
    { label: `${stories}-story cleaning (${d.package})`, amount: `$${base}` },
  ];

  let total = base;
  const conditionSurcharges: Record<string, number> = { moderate: 25, heavy: 50, repair: 100 };
  const condAmt = conditionSurcharges[d.gutterCondition ?? "clear"] ?? 0;
  if (condAmt) {
    breakdown.push({ label: `Condition surcharge (${d.gutterCondition})`, amount: `$${condAmt}` });
    total += condAmt;
  }

  for (const addOn of d.addOns ?? []) {
    if (addOn === "downspout") { breakdown.push({ label: "Downspout cleaning", amount: "$25" }); total += 25; }
    if (addOn === "gutter_guard") { breakdown.push({ label: "Gutter guard installation", amount: "$100" }); total += 100; }
    if (addOn === "minor_repairs") { breakdown.push({ label: "Minor repairs", amount: "$75" }); total += 75; }
  }

  return {
    serviceId: "gutter", serviceName: "Gutter Cleaning", type: "fixed",
    low: total, high: total, confidence: 90,
    breakdown, factors: ["Final scope confirmed on arrival"], slots: getSlots(d.urgency),
  };
}

function calcRoof(d: IntakeFormData): QuoteData {
  const basePrices: Record<string, number> = {
    lt1500: 150, s1500_2000: 200, s2000_2500: 250,
    s2500_4000: 300, s4000_5000: 350, gte5000: 500,
  };

  const roofKey = d.roofSize ?? "s2000_2500";
  let base = basePrices[roofKey];
  const breakdown: { label: string; amount: string }[] = [
    { label: `Base cleaning (${roofKey.replace("lt","<").replace("gte","≥").replace("s","").replace("_","–")} sq ft)`, amount: `$${base}` },
  ];
  let total = base;

  // Premium adds gutter cleaning
  if (d.package === "premium" || d.package === "ultimate") {
    const gutterBase: Record<number, number> = { 1: 225, 2: 300, 3: 400 };
    const gBase = gutterBase[d.roofStories ?? 1];
    breakdown.push({ label: `Gutter cleaning included (${d.package})`, amount: `$${gBase}` });
    total += gBase;
  }

  const mossAmounts: Record<string, number> = { light: 50, moderate: 100, heavy: 250 };
  const mossAmt = mossAmounts[d.mossLevel ?? "none"] ?? 0;
  if (mossAmt) {
    breakdown.push({ label: `Moss/algae removal (${d.mossLevel})`, amount: `$${mossAmt}` });
    total += mossAmt;
  }

  if (d.algaeProtection) {
    breakdown.push({ label: "Algae protection treatment", amount: "$50" });
    total += 50;
  }

  const factors = ["Roof access complexity assessed on-site"];
  if (d.mossLevel === "heavy") factors.push("Heavy moss may require additional treatment");

  return {
    serviceId: "roof", serviceName: "Roof Cleaning", type: "fixed",
    low: total, high: total, confidence: 85,
    breakdown, factors, slots: getSlots(d.urgency),
  };
}

function calcPressure(d: IntakeFormData): QuoteData {
  const basePrices: Record<string, number> = { standard: 180, premium: 280, ultimate: 400 };
  const multipliers: Record<string, number> = { lt1000: 0.8, s1000_2000: 1.0, s2000_3000: 1.3, gte3000: 1.6 };

  const base = basePrices[d.package];
  const mult = multipliers[d.homeSize ?? "s1000_2000"];
  let total = base * mult;

  const breakdown: { label: string; amount: string }[] = [
    { label: `Base (${d.package})`, amount: `$${base}` },
    { label: `Size multiplier (${mult}×)`, amount: `= $${Math.round(total)}` },
  ];

  if (d.isFirstTime) {
    const surcharge = Math.round(total * 0.5);
    breakdown.push({ label: "First-time surcharge (+50%)", amount: `$${surcharge}` });
    total *= 1.5;
  }

  const discountLabel = bulkDiscountLabel("pressure", d.frequency);
  if (discountLabel) {
    const discountAmt = Math.round(total * getBulkDiscount(FREQUENCY_SERVICES_PER_YEAR[d.frequency]));
    breakdown.push({ label: discountLabel, amount: `-$${discountAmt}` });
    total = applyBulkDiscount(total, "pressure", d.frequency);
  }

  total = Math.round(total);
  return {
    serviceId: "pressure", serviceName: "Pressure Washing", type: "fixed",
    low: total, high: total, confidence: 88,
    breakdown, factors: ["Upfront payment saves 5% at checkout"], slots: getSlots(d.urgency),
  };
}

function calcElectrical(d: IntakeFormData): QuoteData {
  const basePrices: Record<string, number> = { standard: 150, premium: 250, ultimate: 400 };
  const multipliers: Record<string, number> = { lt1000: 0.8, s1000_2000: 1.0, s2000_3000: 1.3, gte3000: 1.6 };

  const base = basePrices[d.package];
  const mult = multipliers[d.homeSize ?? "s1000_2000"];
  const total = Math.round(base * mult);

  return {
    serviceId: "electrical", serviceName: "Electrical", type: "range",
    low: Math.round(base * 0.8), high: Math.round(base * 1.6), confidence: 72,
    breakdown: [
      { label: `Base (${d.package})`, amount: `$${base}` },
      { label: `Size multiplier (${mult}×)`, amount: `$${total}` },
    ],
    factors: ["Full scope determined after on-site assessment", "Permits may add cost"],
    slots: getSlots(d.urgency),
  };
}

function calcDuct(d: IntakeFormData): QuoteData {
  const vents = d.ventCount ?? 10;
  let total = 200;
  const breakdown: { label: string; amount: string }[] = [
    { label: "Base (up to 10 vents)", amount: "$200" },
  ];

  if (vents > 10) {
    const extra = (vents - 10) * 25;
    breakdown.push({ label: `${vents - 10} additional vents × $25`, amount: `$${extra}` });
    total += extra;
  }

  if (d.dryerVent) {
    breakdown.push({ label: "Dryer vent cleaning", amount: "$100" });
    total += 100;
  }

  const discountLabel = bulkDiscountLabel("duct", d.frequency);
  if (discountLabel) {
    const discountAmt = Math.round(total * getBulkDiscount(FREQUENCY_SERVICES_PER_YEAR[d.frequency]));
    breakdown.push({ label: discountLabel, amount: `-$${discountAmt}` });
    total = Math.round(applyBulkDiscount(total, "duct", d.frequency));
  }

  return {
    serviceId: "duct", serviceName: "Duct Cleaning", type: "fixed",
    low: total, high: total, confidence: 95,
    breakdown, factors: ["Upfront payment saves 5% at checkout"], slots: getSlots(d.urgency),
  };
}

function calcBackwater(d: IntakeFormData): QuoteData {
  const devices = d.deviceCount ?? 1;
  let total = 100 + (devices - 1) * 50;
  const breakdown: { label: string; amount: string }[] = [
    { label: `Device testing (${devices} device${devices !== 1 ? "s" : ""})`, amount: `$${total}` },
  ];

  if (d.deviceRepair) {
    breakdown.push({ label: "Device repair", amount: "$150" });
    total += 150;
  }
  if (d.certFiling) {
    breakdown.push({ label: "Certification filing", amount: "$25" });
    total += 25;
  }
  if (d.urgency === "emergency") {
    breakdown.push({ label: "Emergency same-day service", amount: "$100" });
    total += 100;
  }

  return {
    serviceId: "backwater", serviceName: "Backwater Testing", type: "fixed",
    low: total, high: total, confidence: 95,
    breakdown, factors: [], slots: getSlots(d.urgency),
  };
}

function calcFence(d: IntakeFormData): QuoteData {
  const ratePerFt: Record<string, number> = { standard: 50, premium: 75, ultimate: 100 };
  const linearFeet = d.linearFeet ?? 50;
  const rate = ratePerFt[d.package];

  let perFtTotal = rate;
  const breakdown: { label: string; amount: string }[] = [];
  const surchargeLines: { label: string; amount: string }[] = [];

  if (d.fenceHeight === "eight_ft") perFtTotal += 10;
  if (d.terrain === "steep") perFtTotal += 10;
  if (d.terrain === "rocky") perFtTotal += 20;

  let lineTotal = linearFeet * perFtTotal;

  breakdown.push({ label: `${linearFeet} linear ft × $${perFtTotal}/ft (${d.package}${d.fenceHeight === "eight_ft" ? " + 8ft" : ""}${d.terrain !== "flat" && d.terrain ? ` + ${d.terrain}` : ""})`, amount: `$${lineTotal}` });

  const doors = d.doorCount ?? 0;
  if (doors > 0) {
    const doorAmt = doors * 50;
    breakdown.push({ label: `${doors} gate${doors !== 1 ? "s" : ""} × $50`, amount: `$${doorAmt}` });
    lineTotal += doorAmt;
  }

  if (d.isRepair) {
    const saved = Math.round(lineTotal * 0.5);
    surchargeLines.push({ label: "Repair job discount (−50%)", amount: `-$${saved}` });
    lineTotal = lineTotal * 0.5;
  }

  let total = lineTotal;

  if (d.weatherproofCoating) {
    breakdown.push({ label: "Weatherproof coating", amount: "$100" });
    total += 100;
  }

  [...surchargeLines].forEach(l => breakdown.push(l));

  total = Math.round(total);
  return {
    serviceId: "fence", serviceName: "Fence Installation", type: "range",
    low: Math.round(total * 0.9), high: Math.round(total * 1.1), confidence: 78,
    breakdown,
    factors: ["Final measurements confirmed on-site", "Terrain may affect scope"],
    slots: getSlots(d.urgency),
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function calculateQuote(data: IntakeFormData): QuoteData {
  switch (data.serviceId) {
    case "lawn":          return calcLawn(data);
    case "house_cleaning": return calcHouseCleaning(data);
    case "gutter":        return calcGutter(data);
    case "roof":          return calcRoof(data);
    case "pressure":      return calcPressure(data);
    case "electrical":    return calcElectrical(data);
    case "duct":          return calcDuct(data);
    case "backwater":     return calcBackwater(data);
    case "fence":         return calcFence(data);
    default:              return calcLawn(data);
  }
}
