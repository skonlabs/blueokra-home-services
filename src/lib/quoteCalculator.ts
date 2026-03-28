import type { QuoteData } from "@/components/homeowner/AIIntakeChat";

// ---------------------------------------------------------------------------
// Intake form data — all variables needed to calculate any service quote
// ---------------------------------------------------------------------------

export interface IntakeFormData {
  serviceId: string;
  package: "standard" | "premium" | "ultimate";
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
  bonusRoomTypes?: string[];
  lastProfessionalCleaning?: "lt3months" | "gte3months" | "never";
  cleaningCondition?: "normal" | "heavy";

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

  // Fence
  linearFeet?: number;
  fenceHeight?: "standard" | "eight_ft";
  terrain?: "flat" | "steep" | "rocky";
  doorCount?: number;
  weatherproofCoating?: boolean;
}

// ---------------------------------------------------------------------------
// Economics helper
// Customer Price Range  → Provider %  → Margin %
// < $150               → 80%         → 20%
// $150 – $400          → 75%         → 25%
// > $400               → 70%         → 30%
// ---------------------------------------------------------------------------

function computeEconomics(customerPrice: number): {
  providerPayout: number;
  platformMargin: number;
  marginPercent: number;
} {
  const pct = customerPrice < 150 ? 0.80 : customerPrice <= 400 ? 0.75 : 0.70;
  const providerPayout = Math.round(customerPrice * pct);
  const platformMargin = customerPrice - providerPayout;
  const marginPercent = Math.round((platformMargin / customerPrice) * 100);
  return { providerPayout, platformMargin, marginPercent };
}

// ---------------------------------------------------------------------------
// Slot helper
// ---------------------------------------------------------------------------

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
  return {
    slots: Array.from({ length: 21 }, (_, i) => fmt(add(i + 2))),
    timeSlots: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"],
  };
}

// ---------------------------------------------------------------------------
// LAWN CARE
// ---------------------------------------------------------------------------

function calcLawn(d: IntakeFormData): QuoteData {
  // Base prices by yard size
  const basePrices: Record<string, number> = {
    lt1000: 65, lt1500: 80,  lt2000: 95,  lt3000: 120,
    lt4000: 140, lt5000: 160, lt10000: 210, gte10000: 320,
  };
  const yardLabels: Record<string, string> = {
    lt1000: "< 1,000", lt1500: "< 1,500", lt2000: "< 2,000", lt3000: "< 3,000",
    lt4000: "< 4,000", lt5000: "< 5,000", lt10000: "< 10,000", gte10000: "10,000+",
  };

  const yardKey = d.yardSize ?? "lt3000";
  const base = basePrices[yardKey];
  const yardLbl = `${yardLabels[yardKey]} sq ft`;
  const breakdown: { label: string; amount: string }[] = [];

  // Step 1: Base
  let subtotal = base;
  breakdown.push({ label: `Base mowing (${yardLbl})`, amount: `$${base}` });

  // Step 2: Grass height surcharge
  if (d.grassHeight === "medium") {
    const surcharge = Math.round(base * 0.40);
    breakdown.push({ label: "Overgrown surcharge (6–12 in, +40%)", amount: `$${surcharge}` });
    subtotal += surcharge;
  } else if (d.grassHeight === "tall") {
    const surcharge = Math.round(base * 0.80);
    breakdown.push({ label: "Very tall surcharge (>12 in, +80%)", amount: `$${surcharge}` });
    subtotal += surcharge;
  }

  // Step 3: Weed surcharge
  const weedAmounts: Record<string, number> = { few: 25, moderate: 50, lots: 100 };
  const weedAmt = weedAmounts[d.weedLevel ?? "none"] ?? 0;
  if (weedAmt) {
    const weedLabel = d.weedLevel === "few" ? "Light weeds" : d.weedLevel === "moderate" ? "Moderate weeds" : "Heavy weeds";
    breakdown.push({ label: `${weedLabel} (+$${weedAmt})`, amount: `$${weedAmt}` });
    subtotal += weedAmt;
  }

  // Step 4: Add-ons (fixed prices per new pricing table)
  const addOnPrices: Record<string, number> = { aeration: 180, overseeding: 140, fertilization: 120 };
  let addOnTotal = 0;
  for (const addOn of d.addOns ?? []) {
    if (addOn === "bush_trimming") {
      const bushAmt = (d.bushCount ?? 1) * 15;
      breakdown.push({ label: `Bush trimming (${d.bushCount ?? 1} bush${(d.bushCount ?? 1) !== 1 ? "es" : ""} × $15)`, amount: `$${bushAmt}` });
      addOnTotal += bushAmt;
    } else if (addOnPrices[addOn]) {
      const label = addOn.charAt(0).toUpperCase() + addOn.slice(1);
      breakdown.push({ label, amount: `$${addOnPrices[addOn]}` });
      addOnTotal += addOnPrices[addOn];
    }
  }
  subtotal += addOnTotal;

  // Step 5: Apply minimum charge
  const MINIMUM = 65;
  const total = Math.max(Math.round(subtotal), MINIMUM);
  if (total === MINIMUM && subtotal < MINIMUM) {
    breakdown.push({ label: "Minimum charge applied", amount: `$${MINIMUM}` });
  }

  // Recurring: subsequent visits are the same (no first-time surcharge for lawn)
  const isRecurring = d.frequency !== "one-time";
  const recurringVisitPrice = isRecurring ? total : undefined;

  const econ = computeEconomics(total);
  const recurringEcon = recurringVisitPrice !== undefined ? computeEconomics(recurringVisitPrice) : undefined;

  return {
    serviceId: "lawn", serviceName: "Lawn Care", type: "fixed",
    low: total, high: total, confidence: 92,
    breakdown,
    factors: isRecurring ? ["Same price applies to all visits"] : [],
    ...getSlots(d.urgency),
    frequency: isRecurring ? d.frequency : undefined,
    recurringVisitPrice,
    ...econ,
    recurringProviderPayout: recurringEcon?.providerPayout,
    recurringPlatformMargin: recurringEcon?.platformMargin,
  };
}

// ---------------------------------------------------------------------------
// HOUSE CLEANING
// ---------------------------------------------------------------------------

function calcHouseCleaning(d: IntakeFormData): QuoteData {
  const bedrooms  = d.bedrooms  ?? 3;
  const bathrooms = d.bathrooms ?? 2;
  const bonusRooms = d.bonusRoomTypes?.length ?? 0;

  // Step 1: Base room total
  const roomTotal =
    bedrooms   * 40 +
    bathrooms  * 60 +
    bonusRooms * 35 +
    85; // kitchen always included

  const breakdown: { label: string; amount: string }[] = [
    { label: `${bedrooms} bedroom${bedrooms !== 1 ? "s" : ""} × $40`, amount: `$${bedrooms * 40}` },
    { label: `${bathrooms} bathroom${bathrooms !== 1 ? "s" : ""} × $60`, amount: `$${bathrooms * 60}` },
    { label: "Kitchen", amount: "$85" },
  ];
  if (bonusRooms > 0) {
    breakdown.push({ label: `${bonusRooms} additional room${bonusRooms !== 1 ? "s" : ""} × $35`, amount: `$${bonusRooms * 35}` });
  }

  let subtotal = roomTotal;

  // Step 2: Heavy condition surcharge
  if (d.cleaningCondition === "heavy") {
    const heavySurcharge = Math.round(roomTotal * 0.25);
    breakdown.push({ label: "Heavy condition surcharge (+25%)", amount: `$${heavySurcharge}` });
    subtotal += heavySurcharge;
  }

  // Step 3: First-time surcharge (+40%, waived if cleaned within last 3 months)
  const applyFirstTime = d.lastProfessionalCleaning !== "lt3months";
  const isRecurring = d.frequency !== "one-time";
  let firstTimeSurcharge = 0;
  if (applyFirstTime) {
    firstTimeSurcharge = Math.round(subtotal * 0.40);
    breakdown.push({
      label: "First-time setup fee (+40%, first visit only)",
      amount: `$${firstTimeSurcharge}`,
    });
  }

  // Step 4: Add-ons
  const addOnPrices: Record<string, number> = { oven: 40, fridge: 40, garage: 100, carpet_stain: 75, basement: 50 };
  const addOnLabels: Record<string, string> = {
    oven: "Inside oven cleaning", fridge: "Inside fridge cleaning",
    garage: "Garage cleaning", basement: "Basement cleaning", carpet_stain: "Carpet stain removal",
  };
  let addOnTotal = 0;
  for (const addOn of d.addOns ?? []) {
    if (addOnPrices[addOn]) {
      breakdown.push({ label: addOnLabels[addOn], amount: `$${addOnPrices[addOn]}` });
      addOnTotal += addOnPrices[addOn];
    }
  }

  const total = Math.max(Math.round(subtotal + firstTimeSurcharge + addOnTotal), 150);
  if (total === 150 && (subtotal + firstTimeSurcharge + addOnTotal) < 150) {
    breakdown.push({ label: "Minimum charge applied", amount: "$150" });
  }

  // Recurring: 2nd+ visits don't include first-time surcharge
  const recurringTotal = (isRecurring && applyFirstTime)
    ? Math.max(Math.round(subtotal + addOnTotal), 150)
    : undefined;

  const econ = computeEconomics(total);
  const recurringEcon = recurringTotal !== undefined ? computeEconomics(recurringTotal) : undefined;

  return {
    serviceId: "house_cleaning", serviceName: "House Cleaning", type: "fixed",
    low: total, high: total, confidence: 95,
    breakdown,
    factors: applyFirstTime && isRecurring ? ["First-time setup fee applies to first visit only"] : [],
    ...getSlots(d.urgency),
    frequency: isRecurring ? d.frequency : undefined,
    recurringVisitPrice: recurringTotal,
    ...econ,
    recurringProviderPayout: recurringEcon?.providerPayout,
    recurringPlatformMargin: recurringEcon?.platformMargin,
  };
}

// ---------------------------------------------------------------------------
// GUTTER CLEANING
// ---------------------------------------------------------------------------

function calcGutter(d: IntakeFormData): QuoteData {
  const basePrices: Record<number, number> = { 1: 140, 2: 200, 3: 300 };
  const stories = d.stories ?? 1;
  const base = basePrices[stories];

  const breakdown: { label: string; amount: string }[] = [
    { label: `${stories}-story gutter cleaning`, amount: `$${base}` },
  ];

  let total = base;

  // Condition surcharge
  const conditionSurcharges: Record<string, number> = { moderate: 25, heavy: 50, repair: 100 };
  const condAmt = conditionSurcharges[d.gutterCondition ?? "clear"] ?? 0;
  if (condAmt) {
    const condLabel = d.gutterCondition === "repair" ? "Repair needed (+$100)" : `Condition surcharge — ${d.gutterCondition} (+$${condAmt})`;
    breakdown.push({ label: condLabel, amount: `$${condAmt}` });
    total += condAmt;
  }

  // Add-ons
  for (const addOn of d.addOns ?? []) {
    if (addOn === "downspout") {
      breakdown.push({ label: "Downspout cleaning", amount: "$30" });
      total += 30;
    }
    if (addOn === "gutter_guard") {
      // Estimate linear feet by stories: 1-story ~100 ft, 2-story ~140 ft, 3-story ~180 ft
      const estFt = stories === 1 ? 100 : stories === 2 ? 140 : 180;
      const guardAmt = estFt * 10;
      breakdown.push({ label: `Gutter guard installation (~${estFt} linear ft × $10/ft)`, amount: `$${guardAmt}` });
      total += guardAmt;
    }
    if (addOn === "minor_repairs") {
      breakdown.push({ label: "Minor repairs", amount: "$75" });
      total += 75;
    }
  }

  const econ = computeEconomics(total);

  return {
    serviceId: "gutter", serviceName: "Gutter Cleaning", type: "fixed",
    low: total, high: total, confidence: 90,
    breakdown,
    factors: ["Final scope confirmed on arrival"],
    ...getSlots(d.urgency),
    ...econ,
  };
}

// ---------------------------------------------------------------------------
// ROOF CLEANING
// ---------------------------------------------------------------------------

function calcRoof(d: IntakeFormData): QuoteData {
  const basePrices: Record<string, number> = {
    lt1500: 320, s1500_2000: 420, s2000_2500: 520,
    s2500_4000: 680, s4000_5000: 850, gte5000: 1050,
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

  // Moss level
  const mossAmounts: Record<string, number> = { light: 120, moderate: 280, heavy: 450 };
  const mossAmt = mossAmounts[d.mossLevel ?? "none"] ?? 0;
  if (mossAmt) {
    breakdown.push({ label: `Moss/algae removal — ${d.mossLevel} (+$${mossAmt})`, amount: `$${mossAmt}` });
    total += mossAmt;
  }

  // Protection treatment
  if (d.algaeProtection) {
    breakdown.push({ label: "Algae & lichen protection treatment", amount: "$150" });
    total += 150;
  }

  const econ = computeEconomics(total);

  return {
    serviceId: "roof", serviceName: "Roof Cleaning", type: "fixed",
    low: total, high: total, confidence: 85,
    breakdown,
    factors: ["Roof access complexity assessed on-site"],
    ...getSlots(d.urgency),
    ...econ,
  };
}

// ---------------------------------------------------------------------------
// PRESSURE WASHING
// ---------------------------------------------------------------------------

function calcPressure(d: IntakeFormData): QuoteData {
  const BASE = 250;
  // homeSize maps to wash area multiplier
  const multipliers: Record<string, number> = {
    lt1000: 0.8,   // < 500 wash area
    s1000_2000: 1.0, // 500–1,000 wash area
    s2000_3000: 1.3, // 1,000–2,000 wash area
    gte3000: 1.6,   // > 2,000 wash area
  };
  const homeSizeLabels: Record<string, string> = {
    lt1000: "< 1,000 sq ft home",
    s1000_2000: "1,000–2,000 sq ft home",
    s2000_3000: "2,000–3,000 sq ft home",
    gte3000: "3,000+ sq ft home",
  };
  const surfaceLabels: Record<string, string> = {
    driveway: "Driveway", sidewalks: "Sidewalks", house_exterior: "House exterior",
    deck_patio: "Deck/Patio", fence: "Fence", garage_floor: "Garage floor",
  };

  const mult = multipliers[d.homeSize ?? "s1000_2000"];
  const baseTotal = Math.round(BASE * mult);

  const breakdown: { label: string; amount: string }[] = [
    { label: `Base rate (${homeSizeLabels[d.homeSize ?? "s1000_2000"]}, ×${mult})`, amount: `$${baseTotal}` },
  ];

  if (d.surfaces && d.surfaces.length > 0) {
    const surfaceList = d.surfaces.map(s => surfaceLabels[s] ?? s).join(", ");
    breakdown.push({ label: `Surfaces: ${surfaceList}`, amount: "included" });
  }

  // Condition surcharge (additive percentage on base)
  const conditionPcts: Record<string, number> = { moderate: 0.20, heavy: 0.40, mold: 0.60 };
  const condPct = conditionPcts[d.pressureCondition ?? "light"] ?? 0;
  let total = baseTotal;
  if (condPct > 0) {
    const condAmt = Math.round(baseTotal * condPct);
    const condLabel = d.pressureCondition === "mold"
      ? "Mold/mildew surcharge (+60%)"
      : d.pressureCondition === "heavy"
      ? "Heavy stains surcharge (+40%)"
      : "Moderate dirt surcharge (+20%)";
    breakdown.push({ label: condLabel, amount: `$${condAmt}` });
    total += condAmt;
  }

  const isRecurring = d.frequency !== "one-time";
  const econ = computeEconomics(total);

  return {
    serviceId: "pressure", serviceName: "Pressure Washing", type: "fixed",
    low: total, high: total, confidence: 88,
    breakdown,
    factors: ["Final scope determined on-site"],
    ...getSlots(d.urgency),
    frequency: isRecurring ? d.frequency : undefined,
    ...econ,
  };
}

// ---------------------------------------------------------------------------
// DUCT CLEANING
// ---------------------------------------------------------------------------

function calcDuct(d: IntakeFormData): QuoteData {
  const BASE = 300; // up to 10 vents
  const PER_EXTRA_VENT = 30;
  const DRYER_VENT = 125;

  const vents = d.ventCount ?? 10;
  let total = BASE;
  const breakdown: { label: string; amount: string }[] = [
    { label: "Base (up to 10 vents)", amount: `$${BASE}` },
  ];

  if (vents > 10) {
    const extra = (vents - 10) * PER_EXTRA_VENT;
    breakdown.push({ label: `${vents - 10} additional vent${vents - 10 !== 1 ? "s" : ""} × $${PER_EXTRA_VENT}`, amount: `$${extra}` });
    total += extra;
  }

  if (d.dryerVent) {
    breakdown.push({ label: "Dryer vent cleaning", amount: `$${DRYER_VENT}` });
    total += DRYER_VENT;
  }

  const econ = computeEconomics(total);

  return {
    serviceId: "duct", serviceName: "Duct Cleaning", type: "fixed",
    low: total, high: total, confidence: 95,
    breakdown, factors: [],
    ...getSlots(d.urgency),
    frequency: d.frequency !== "one-time" ? d.frequency : undefined,
    ...econ,
  };
}

// ---------------------------------------------------------------------------
// BACKWATER TESTING
// ---------------------------------------------------------------------------

function calcBackwater(d: IntakeFormData): QuoteData {
  const FIRST_DEVICE = 125;
  const ADDITIONAL_DEVICE = 65;
  const lastTestedLabels: Record<string, string> = {
    lt1year: "Less than 1 year ago", "1_2years": "1–2 years ago",
    gt2years: "2+ years ago", never: "Never tested",
  };

  const devices = d.deviceCount ?? 1;
  let total = FIRST_DEVICE + (devices - 1) * ADDITIONAL_DEVICE;
  const breakdown: { label: string; amount: string }[] = [
    { label: `First device testing`, amount: `$${FIRST_DEVICE}` },
  ];
  if (devices > 1) {
    const addl = (devices - 1) * ADDITIONAL_DEVICE;
    breakdown.push({ label: `${devices - 1} additional device${devices - 1 !== 1 ? "s" : ""} × $${ADDITIONAL_DEVICE}`, amount: `$${addl}` });
  }

  if (d.lastTested) {
    breakdown.push({ label: `Last tested: ${lastTestedLabels[d.lastTested] ?? d.lastTested}`, amount: "—" });
  }

  if (d.deviceRepair) {
    breakdown.push({ label: "Device repair", amount: "$200" });
    total += 200;
  }
  if (d.certFiling) {
    breakdown.push({ label: "Certification filing", amount: "$25" });
    total += 25;
  }
  if (d.urgency === "emergency") {
    breakdown.push({ label: "Emergency same-day service", amount: "$125" });
    total += 125;
  }

  const econ = computeEconomics(total);

  return {
    serviceId: "backwater", serviceName: "Backwater Testing", type: "fixed",
    low: total, high: total, confidence: 95,
    breakdown, factors: [],
    ...getSlots(d.urgency),
    ...econ,
  };
}

// ---------------------------------------------------------------------------
// FENCE INSTALLATION
// ---------------------------------------------------------------------------

function calcFence(d: IntakeFormData): QuoteData {
  const linearFeet = d.linearFeet ?? 50;
  const isRepair = d.addOns?.includes("repair") ?? false;
  const breakdown: { label: string; amount: string }[] = [];
  let total = 0;

  if (isRepair) {
    // Repair: $40/ft
    const repairBase = linearFeet * 40;
    breakdown.push({ label: `${linearFeet} linear ft repair × $40/ft`, amount: `$${repairBase}` });
    total = repairBase;
  } else {
    // Installation: $45/ft base + height and terrain adders
    const BASE_PER_FT = 45;
    let perFtTotal = BASE_PER_FT;
    if (d.fenceHeight === "eight_ft") perFtTotal += 8;
    if (d.terrain === "steep")  perFtTotal += 5;
    if (d.terrain === "rocky")  perFtTotal += 10;

    const perFtDesc = [
      `$${BASE_PER_FT}/ft base`,
      d.fenceHeight === "eight_ft" ? "+$8 (8 ft height)" : null,
      d.terrain === "steep"  ? "+$5 (steep terrain)" : null,
      d.terrain === "rocky"  ? "+$10 (rocky terrain)" : null,
    ].filter(Boolean).join(", ");

    const subtotal = linearFeet * perFtTotal;
    breakdown.push({ label: `${linearFeet} linear ft × $${perFtTotal}/ft (${perFtDesc})`, amount: `$${subtotal}` });
    total = subtotal;
  }

  // Gates
  const doors = d.doorCount ?? 0;
  if (doors > 0) {
    const doorAmt = doors * 200;
    breakdown.push({ label: `${doors} gate${doors !== 1 ? "s" : ""} × $200`, amount: `$${doorAmt}` });
    total += doorAmt;
  }

  // Weatherproof coating
  if (d.weatherproofCoating) {
    breakdown.push({ label: "Weatherproof coating", amount: "$150" });
    total += 150;
  }

  const econ = computeEconomics(Math.round(total * 1.0));

  return {
    serviceId: "fence", serviceName: "Fence Installation", type: "range",
    low: Math.round(total * 0.9), high: Math.round(total * 1.1), confidence: 78,
    breakdown,
    factors: isRepair
      ? ["Final measurements confirmed on-site"]
      : ["Final measurements confirmed on-site", "Terrain may affect scope"],
    ...getSlots(d.urgency),
    ...econ,
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
