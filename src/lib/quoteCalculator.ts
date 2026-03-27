import type { QuoteData } from "@/components/homeowner/AIIntakeChat";

// ---------------------------------------------------------------------------
// Intake form data — all variables needed to calculate any service quote
// ---------------------------------------------------------------------------

export interface IntakeFormData {
  serviceId: string;
  package: "standard" | "premium" | "ultimate"; // always "standard" from form; kept for future tiers
  urgency: "emergency" | "soon" | "flexible";
  frequency: "one-time" | "weekly" | "biweekly" | "monthly" | "quarterly";

  // Address
  serviceAddress?: string;

  // Lawn
  yardSize?: "lt1000" | "lt1500" | "lt2000" | "lt3000" | "lt4000" | "lt5000" | "lt10000" | "gte10000";
  grassHeight?: "normal" | "medium" | "tall";
  weedLevel?: "none" | "few" | "moderate" | "lots";
  addOns?: string[];
  bushCount?: number;

  // House Cleaning
  bedrooms?: number;
  bathrooms?: number;
  bonusRoomTypes?: string[];   // each non-kitchen room = $15
  lastProfessionalCleaning?: "lt3months" | "gte3months" | "never";

  // Gutter
  stories?: 1 | 2 | 3;
  gutterCondition?: "clear" | "moderate" | "heavy" | "repair";

  // Roof
  roofSize?: "lt1500" | "s1500_2000" | "s2000_2500" | "s2500_4000" | "s4000_5000" | "gte5000";
  roofStories?: 1 | 2 | 3;
  mossLevel?: "none" | "light" | "moderate" | "heavy";
  algaeProtection?: boolean;
  roofType?: "asphalt" | "metal" | "tile" | "slate" | "other";

  // Pressure Washing
  homeSize?: "lt1000" | "s1000_2000" | "s2000_3000" | "gte3000";
  surfaces?: string[];
  pressureCondition?: "light" | "moderate" | "heavy" | "mold";

  // Duct
  ventCount?: number;
  dryerVent?: boolean;

  // Backwater
  deviceCount?: number;
  deviceRepair?: boolean;
  certFiling?: boolean;
  lastTested?: "lt1year" | "1_2years" | "gt2years" | "never";

  // Fence (repair is in addOns as "repair")
  linearFeet?: number;
  fenceHeight?: "standard" | "eight_ft";
  terrain?: "flat" | "steep" | "rocky";
  doorCount?: number;
  weatherproofCoating?: boolean;

  // Recurring scheduling
  recurringEndMonth?: number;
  recurringEndYear?: number;
  firstServiceDate?: string;
  firstServiceTimeSlots?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns available booking dates as ISO strings plus time options. */
function getSlots(urgency: string): { slots: string[]; timeSlots: string[] } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const add = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };

  if (urgency === "emergency") {
    return {
      slots: [fmt(today), fmt(add(1))],
      timeSlots: ["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"],
    };
  }
  if (urgency === "soon") {
    return {
      slots: Array.from({ length: 7 }, (_, i) => fmt(add(i + 1))),
      timeSlots: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"],
    };
  }
  // flexible
  return {
    slots: Array.from({ length: 21 }, (_, i) => fmt(add(i + 2))),
    timeSlots: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"],
  };
}

// ---------------------------------------------------------------------------
// Per-service calculators
// ---------------------------------------------------------------------------

function calcLawn(d: IntakeFormData): QuoteData {
  const basePrices: Record<string, number> = {
    lt1000: 75,   lt1500: 100,  lt2000: 125,  lt3000: 150,
    lt4000: 175,  lt5000: 200,  lt10000: 250, gte10000: 400,
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
  const yardLabels: Record<string, string> = {
    lt1000: "< 1,000", lt1500: "< 1,500", lt2000: "< 2,000", lt3000: "< 3,000",
    lt4000: "< 4,000", lt5000: "< 5,000", lt10000: "< 10,000", gte10000: "10,000+",
  };

  const yardKey = d.yardSize ?? "lt3000";
  const base = basePrices[yardKey];
  const yardLbl = `${yardLabels[yardKey]} sq ft`;

  const breakdown: { label: string; amount: string }[] = [];

  // Grass height surcharge applied to base
  let grassTotal = base;
  if (d.grassHeight === "medium") {
    grassTotal = base * 1.5;
    breakdown.push({ label: `Base mowing (${yardLbl})`, amount: `$${base}` });
    breakdown.push({ label: "Overgrown surcharge (6–12 in, +50%)", amount: `$${Math.round(base * 0.5)}` });
  } else if (d.grassHeight === "tall") {
    grassTotal = base * 2;
    breakdown.push({ label: `Base mowing (${yardLbl})`, amount: `$${base}` });
    breakdown.push({ label: "Very tall surcharge (12+ in, +100%)", amount: `$${base}` });
  } else {
    breakdown.push({ label: `Base mowing (${yardLbl})`, amount: `$${base}` });
  }

  // Weed surcharge
  const weedAmounts: Record<string, number> = { few: 25, moderate: 50, lots: 100 };
  const weedAmt = weedAmounts[d.weedLevel ?? "none"] ?? 0;
  if (weedAmt) {
    breakdown.push({ label: `Weed surcharge (${d.weedLevel})`, amount: `$${weedAmt}` });
  }

  // First-time surcharge — always applied for lawn
  const firstTimeSurcharge = Math.round(base * 0.5);
  const isRecurringAllInstances = d.frequency === "monthly" || d.frequency === "quarterly";
  breakdown.push({
    label: isRecurringAllInstances
      ? "First-time setup fee (+50% on base, applies every visit)"
      : "First-time setup fee (+50% on base)",
    amount: `$${firstTimeSurcharge}`,
  });

  // Add-ons
  let addOnTotal = 0;
  const yardAddOns = addOnPrices[yardKey];
  for (const addOn of d.addOns ?? []) {
    if (addOn === "bush_trimming") {
      const bushAmt = (d.bushCount ?? 1) * 15;
      breakdown.push({ label: `Bush trimming (${d.bushCount ?? 1} bush${(d.bushCount ?? 1) !== 1 ? "es" : ""})`, amount: `$${bushAmt}` });
      addOnTotal += bushAmt;
    } else if (yardAddOns[addOn]) {
      const label = addOn.charAt(0).toUpperCase() + addOn.slice(1);
      breakdown.push({ label, amount: `$${yardAddOns[addOn]}` });
      addOnTotal += yardAddOns[addOn];
    }
  }

  const total = Math.round(grassTotal + weedAmt + firstTimeSurcharge + addOnTotal);

  const factors: string[] = [];
  if (isRecurringAllInstances) {
    factors.push("First-time setup fee applies to every visit for monthly/quarterly plans");
  }

  return {
    serviceId: "lawn", serviceName: "Lawn Care", type: "fixed",
    low: total, high: total, confidence: 92,
    breakdown, factors,
    ...getSlots(d.urgency),
    frequency: d.frequency !== "one-time" ? d.frequency : undefined,
  };
}

function calcHouseCleaning(d: IntakeFormData): QuoteData {
  const rates = { bedroom: 15, bathroom: 25, bonus_room: 15, kitchen: 60 };

  const bedrooms  = d.bedrooms  ?? 3;
  const bathrooms = d.bathrooms ?? 2;
  const bonusRooms = d.bonusRoomTypes?.length ?? 0;

  const roomTotal =
    bedrooms   * rates.bedroom    +
    bathrooms  * rates.bathroom   +
    bonusRooms * rates.bonus_room +
    rates.kitchen;

  const breakdown: { label: string; amount: string }[] = [
    { label: `${bedrooms} bedroom${bedrooms !== 1 ? "s" : ""} × $${rates.bedroom}`, amount: `$${bedrooms * rates.bedroom}` },
    { label: `${bathrooms} bathroom${bathrooms !== 1 ? "s" : ""} × $${rates.bathroom}`, amount: `$${bathrooms * rates.bathroom}` },
    { label: "Kitchen", amount: `$${rates.kitchen}` },
  ];
  if (bonusRooms > 0) {
    breakdown.push({ label: `${bonusRooms} additional room${bonusRooms !== 1 ? "s" : ""} × $${rates.bonus_room}`, amount: `$${bonusRooms * rates.bonus_room}` });
  }

  // First-time surcharge — waived only if cleaned within last 3 months
  const applyFirstTime = d.lastProfessionalCleaning !== "lt3months";
  let firstTimeSurcharge = 0;
  if (applyFirstTime) {
    firstTimeSurcharge = Math.round(roomTotal * 0.5);
    const isRecurringAllInstances = d.frequency === "monthly" || d.frequency === "quarterly";
    breakdown.push({
      label: isRecurringAllInstances
        ? "First-time setup fee (+50% on base, applies every visit)"
        : "First-time setup fee (+50% on base)",
      amount: `$${firstTimeSurcharge}`,
    });
  }

  // Add-ons
  const addOnPrices: Record<string, number> = { oven: 20, fridge: 25, garage: 75, carpet_stain: 50 };
  const addOnLabels: Record<string, string> = {
    oven: "Inside oven cleaning", fridge: "Inside fridge cleaning",
    garage: "Garage cleaning", carpet_stain: "Carpet stain removal",
  };
  let addOnTotal = 0;
  for (const addOn of d.addOns ?? []) {
    if (addOnPrices[addOn]) {
      breakdown.push({ label: addOnLabels[addOn], amount: `$${addOnPrices[addOn]}` });
      addOnTotal += addOnPrices[addOn];
    }
  }

  const total = Math.round(roomTotal + firstTimeSurcharge + addOnTotal);

  const factors: string[] = [];
  if ((d.frequency === "monthly" || d.frequency === "quarterly") && applyFirstTime) {
    factors.push("First-time setup fee applies to every visit for monthly/quarterly plans");
  }

  return {
    serviceId: "house_cleaning", serviceName: "House Cleaning", type: "fixed",
    low: total, high: total, confidence: 95,
    breakdown, factors,
    ...getSlots(d.urgency),
    frequency: d.frequency !== "one-time" ? d.frequency : undefined,
  };
}

function calcGutter(d: IntakeFormData): QuoteData {
  const basePrices: Record<number, number> = { 1: 125, 2: 150, 3: 200 };

  const stories = d.stories ?? 1;
  const base = basePrices[stories];
  const breakdown: { label: string; amount: string }[] = [
    { label: `${stories}-story gutter cleaning`, amount: `$${base}` },
  ];

  let total = base;
  const conditionSurcharges: Record<string, number> = { moderate: 25, heavy: 50, repair: 100 };
  const condAmt = conditionSurcharges[d.gutterCondition ?? "clear"] ?? 0;
  if (condAmt) {
    const condLabel = d.gutterCondition === "repair" ? "Needs repair surcharge" : `Condition surcharge (${d.gutterCondition})`;
    breakdown.push({ label: condLabel, amount: `$${condAmt}` });
    total += condAmt;
  }

  for (const addOn of d.addOns ?? []) {
    if (addOn === "downspout")    { breakdown.push({ label: "Downspout cleaning",         amount: "$25"  }); total += 25; }
    if (addOn === "gutter_guard") { breakdown.push({ label: "Gutter guard installation",  amount: "$100" }); total += 100; }
    if (addOn === "minor_repairs"){ breakdown.push({ label: "Minor repairs",              amount: "$75"  }); total += 75; }
  }

  return {
    serviceId: "gutter", serviceName: "Gutter Cleaning", type: "fixed",
    low: total, high: total, confidence: 90,
    breakdown, factors: ["Final scope confirmed on arrival"], ...getSlots(d.urgency),
  };
}

function calcRoof(d: IntakeFormData): QuoteData {
  const basePrices: Record<string, number> = {
    lt1500: 150, s1500_2000: 200, s2000_2500: 250,
    s2500_4000: 300, s4000_5000: 350, gte5000: 500,
  };
  const roofSizeLabels: Record<string, string> = {
    lt1500: "< 1,500", s1500_2000: "1,500–2,000", s2000_2500: "2,000–2,500",
    s2500_4000: "2,500–4,000", s4000_5000: "4,000–5,000", gte5000: "5,000+",
  };
  const roofTypeLabels: Record<string, string> = {
    asphalt: "Asphalt shingles", metal: "Metal", tile: "Tile",
    slate: "Slate", other: "Other",
  };

  const roofKey = d.roofSize ?? "s2000_2500";
  const base = basePrices[roofKey];
  const breakdown: { label: string; amount: string }[] = [];

  if (d.roofType) {
    breakdown.push({ label: `Roof type: ${roofTypeLabels[d.roofType] ?? d.roofType}`, amount: "—" });
  }
  breakdown.push({ label: `Base cleaning (${roofSizeLabels[roofKey]} sq ft)`, amount: `$${base}` });

  let total = base;

  const mossAmounts: Record<string, number> = { light: 50, moderate: 100, heavy: 250 };
  const mossAmt = mossAmounts[d.mossLevel ?? "none"] ?? 0;
  if (mossAmt) {
    breakdown.push({ label: `Moss/algae removal (${d.mossLevel})`, amount: `$${mossAmt}` });
    total += mossAmt;
  }

  if (d.algaeProtection) {
    breakdown.push({ label: "Algae & lichen protection treatment", amount: "$50" });
    total += 50;
  }

  const factors = ["Roof access complexity assessed on-site"];
  if (d.mossLevel === "heavy") factors.push("Heavy moss may require additional treatment");

  return {
    serviceId: "roof", serviceName: "Roof Cleaning", type: "fixed",
    low: total, high: total, confidence: 85,
    breakdown, factors, ...getSlots(d.urgency),
  };
}

function calcPressure(d: IntakeFormData): QuoteData {
  const base = 180;
  const multipliers: Record<string, number> = { lt1000: 0.8, s1000_2000: 1.0, s2000_3000: 1.3, gte3000: 1.6 };
  const homeSizeLabels: Record<string, string> = {
    lt1000: "< 1,000 sq ft", s1000_2000: "1,000–2,000", s2000_3000: "2,000–3,000", gte3000: "3,000+ sq ft",
  };
  const surfaceLabels: Record<string, string> = {
    driveway: "Driveway", sidewalks: "Sidewalks", house_exterior: "House exterior",
    deck_patio: "Deck/Patio", fence: "Fence", garage_floor: "Garage floor",
  };
  const conditionMultipliers: Record<string, number> = { light: 1.0, moderate: 1.15, heavy: 1.35, mold: 1.5 };

  const mult = multipliers[d.homeSize ?? "s1000_2000"];
  const baseTotal = Math.round(base * mult);

  const breakdown: { label: string; amount: string }[] = [
    { label: `Base rate (${homeSizeLabels[d.homeSize ?? "s1000_2000"]}, ×${mult})`, amount: `$${baseTotal}` },
  ];

  // Surface selections (informational, included in base for now)
  if (d.surfaces && d.surfaces.length > 0) {
    const surfaceList = d.surfaces.map(s => surfaceLabels[s] ?? s).join(", ");
    breakdown.push({ label: `Surfaces: ${surfaceList}`, amount: "included" });
  }

  // Condition multiplier
  const condMult = conditionMultipliers[d.pressureCondition ?? "light"];
  let conditionTotal = Math.round(baseTotal * condMult);
  if (condMult > 1.0) {
    const condLabel = d.pressureCondition === "mold"
      ? "Mold/mildew surcharge (+50%)"
      : d.pressureCondition === "heavy"
      ? "Heavy stains surcharge (+35%)"
      : "Moderate dirt surcharge (+15%)";
    breakdown.push({ label: condLabel, amount: `$${conditionTotal - baseTotal}` });
  } else {
    conditionTotal = baseTotal;
  }

  const total = conditionTotal;

  return {
    serviceId: "pressure", serviceName: "Pressure Washing", type: "fixed",
    low: total, high: total, confidence: 88,
    breakdown,
    factors: ["Final scope determined on-site"],
    ...getSlots(d.urgency),
    frequency: d.frequency !== "one-time" ? d.frequency : undefined,
  };
}

function calcDuct(d: IntakeFormData): QuoteData {
  const vents = d.ventCount ?? 10;
  let ventTotal = 200;
  const breakdown: { label: string; amount: string }[] = [
    { label: "Base (up to 10 vents)", amount: "$200" },
  ];

  if (vents > 10) {
    const extra = (vents - 10) * 25;
    breakdown.push({ label: `${vents - 10} additional vent${vents - 10 !== 1 ? "s" : ""} × $25`, amount: `$${extra}` });
    ventTotal += extra;
  }

  if (d.dryerVent) {
    breakdown.push({ label: "Dryer vent cleaning", amount: "$100" });
    ventTotal += 100;
  }

  const total = ventTotal;

  return {
    serviceId: "duct", serviceName: "Duct Cleaning", type: "fixed",
    low: total, high: total, confidence: 95,
    breakdown,
    factors: [],
    ...getSlots(d.urgency),
    frequency: d.frequency !== "one-time" ? d.frequency : undefined,
  };
}

function calcBackwater(d: IntakeFormData): QuoteData {
  const lastTestedLabels: Record<string, string> = {
    lt1year: "Less than 1 year ago", "1_2years": "1–2 years ago",
    gt2years: "2+ years ago", never: "Never tested",
  };

  const devices = d.deviceCount ?? 1;
  let total = 100 + (devices - 1) * 50;
  const breakdown: { label: string; amount: string }[] = [
    { label: `Device testing (${devices} device${devices !== 1 ? "s" : ""})`, amount: `$${total}` },
  ];

  if (d.lastTested) {
    breakdown.push({ label: `Last tested: ${lastTestedLabels[d.lastTested] ?? d.lastTested}`, amount: "—" });
  }

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
    breakdown, factors: [], ...getSlots(d.urgency),
  };
}

function calcFence(d: IntakeFormData): QuoteData {
  const linearFeet = d.linearFeet ?? 50;
  const isRepair = d.addOns?.includes("repair") ?? false;
  const breakdown: { label: string; amount: string }[] = [];
  let total = 0;

  if (isRepair) {
    // Repair: $50 per linear ft
    const repairBase = linearFeet * 50;
    breakdown.push({ label: `${linearFeet} linear ft repair × $50/ft`, amount: `$${repairBase}` });
    total = repairBase;
    if (d.fenceHeight || d.terrain) {
      breakdown.push({ label: "Height/terrain modifiers", amount: "n/a for repair" });
    }
  } else {
    // Installation: base $50/ft + height and terrain adders
    const ratePerFt = 50;
    let perFtTotal = ratePerFt;
    if (d.fenceHeight === "eight_ft") perFtTotal += 10;
    if (d.terrain === "steep")  perFtTotal += 10;
    if (d.terrain === "rocky")  perFtTotal += 20;

    const perFtDesc = [
      `$${ratePerFt}/ft base`,
      d.fenceHeight === "eight_ft" ? "+$10 (8 ft height)" : null,
      d.terrain === "steep"  ? "+$10 (steep terrain)" : null,
      d.terrain === "rocky"  ? "+$20 (rocky terrain)" : null,
    ].filter(Boolean).join(", ");

    const subtotal = linearFeet * perFtTotal;
    breakdown.push({ label: `${linearFeet} linear ft × $${perFtTotal}/ft (${perFtDesc})`, amount: `$${subtotal}` });
    total = subtotal;
  }

  const doors = d.doorCount ?? 0;
  if (doors > 0) {
    const doorAmt = doors * 50;
    breakdown.push({ label: `${doors} gate${doors !== 1 ? "s" : ""} × $50`, amount: `$${doorAmt}` });
    total += doorAmt;
  }

  if (d.weatherproofCoating) {
    breakdown.push({ label: "Weatherproof coating", amount: "$100" });
    total += 100;
  }

  const factors = isRepair
    ? ["Final measurements confirmed on-site"]
    : ["Final measurements confirmed on-site", "Terrain may affect scope"];

  return {
    serviceId: "fence", serviceName: "Fence Installation", type: "range",
    low: Math.round(total * 0.9), high: Math.round(total * 1.1), confidence: 78,
    breakdown, factors, ...getSlots(d.urgency),
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function calculateQuote(data: IntakeFormData): QuoteData {
  switch (data.serviceId) {
    case "lawn":           return calcLawn(data);
    case "house_cleaning": return calcHouseCleaning(data);
    case "gutter":         return calcGutter(data);
    case "roof":           return calcRoof(data);
    case "pressure":       return calcPressure(data);
    case "duct":           return calcDuct(data);
    case "backwater":      return calcBackwater(data);
    case "fence":          return calcFence(data);
    default:               return calcLawn(data);
  }
}
