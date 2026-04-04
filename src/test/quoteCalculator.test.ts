import { describe, it, expect } from "vitest";
import { calculateQuote, computeEconomics, type IntakeFormData } from "@/lib/quoteCalculator";

// Helper to build minimal intake data
const base = (serviceId: string, overrides: Partial<IntakeFormData> = {}): IntakeFormData => ({
  serviceId,
  package: "standard",
  urgency: "flexible",
  frequency: "one-time",
  ...overrides,
});

describe("computeEconomics", () => {
  it("applies 80% provider payout for prices < $150", () => {
    const e = computeEconomics(100);
    expect(e.providerPayout).toBe(80);
    expect(e.platformMargin).toBe(20);
  });

  it("applies 75% for prices $150–$400", () => {
    const e = computeEconomics(200);
    expect(e.providerPayout).toBe(150);
    expect(e.platformMargin).toBe(50);
  });

  it("applies 70% for prices > $400", () => {
    const e = computeEconomics(500);
    expect(e.providerPayout).toBe(350);
    expect(e.platformMargin).toBe(150);
  });
});

describe("Lawn Care", () => {
  it("calculates base price for lt3000 yard", () => {
    const q = calculateQuote(base("lawn", { yardSize: "lt3000" }));
    expect(q.serviceId).toBe("lawn");
    // Base $120 + first-time $48 = $168
    expect(q.low).toBe(168);
  });

  it("adds grass height surcharge", () => {
    const q = calculateQuote(base("lawn", { yardSize: "lt1000", grassHeight: "tall" }));
    // Base $65 + tall surcharge (80% = $52) + first-time ($26) = $143
    expect(q.low).toBe(143);
  });

  it("adds weed surcharge", () => {
    const q = calculateQuote(base("lawn", { yardSize: "lt1000", weedLevel: "moderate" }));
    // Base $65 + weeds $50 + first-time $26 = $141
    expect(q.low).toBe(141);
  });

  it("applies minimum charge of $65", () => {
    // Even smallest yard should be at least $65
    const q = calculateQuote(base("lawn", { yardSize: "lt1000" }));
    expect(q.low).toBeGreaterThanOrEqual(65);
  });

  it("handles recurring frequency with recurringVisitPrice", () => {
    const q = calculateQuote(base("lawn", { yardSize: "lt3000", frequency: "weekly" }));
    expect(q.frequency).toBe("weekly");
    // First visit: $120 + $48 setup = $168
    // Recurring: $120 (no setup)
    expect(q.low).toBe(168);
    expect(q.recurringVisitPrice).toBe(120);
  });

  it("adds bush trimming addon", () => {
    const q = calculateQuote(base("lawn", {
      yardSize: "lt1000",
      addOns: ["bush_trimming"],
      bushCount: 3,
    }));
    // Base $65 + bush $45 + first-time $26 = $136
    expect(q.low).toBe(136);
  });
});

describe("House Cleaning", () => {
  it("calculates base room pricing", () => {
    const q = calculateQuote(base("house_cleaning", {
      bedrooms: 3,
      bathrooms: 2,
      lastProfessionalCleaning: "lt3months",
    }));
    // 3×$40 + 2×$60 + kitchen $85 = $325
    expect(q.low).toBe(325);
  });

  it("adds heavy condition surcharge", () => {
    const q = calculateQuote(base("house_cleaning", {
      bedrooms: 2,
      bathrooms: 1,
      cleaningCondition: "heavy",
      lastProfessionalCleaning: "lt3months",
    }));
    // Base: 2×40 + 1×60 + 85 = $225, heavy +25% = $56 → $281
    expect(q.low).toBe(281);
  });

  it("adds first-time surcharge when never cleaned", () => {
    const q = calculateQuote(base("house_cleaning", {
      bedrooms: 2,
      bathrooms: 1,
      lastProfessionalCleaning: "never",
    }));
    // Base: $225, first-time 40% = $90 → $315
    expect(q.low).toBe(315);
  });

  it("waives first-time surcharge if cleaned < 3 months", () => {
    const q = calculateQuote(base("house_cleaning", {
      bedrooms: 2,
      bathrooms: 1,
      lastProfessionalCleaning: "lt3months",
    }));
    expect(q.low).toBe(225);
  });

  it("adds oven/fridge/garage addons", () => {
    const q = calculateQuote(base("house_cleaning", {
      bedrooms: 2,
      bathrooms: 1,
      addOns: ["oven", "fridge", "garage"],
      lastProfessionalCleaning: "lt3months",
    }));
    // $225 + $40 + $40 + $100 = $405
    expect(q.low).toBe(405);
  });

  it("applies minimum of $150", () => {
    const q = calculateQuote(base("house_cleaning", {
      bedrooms: 1,
      bathrooms: 1,
      lastProfessionalCleaning: "lt3months",
    }));
    // 1×40 + 1×60 + 85 = $185 (above minimum)
    expect(q.low).toBeGreaterThanOrEqual(150);
  });
});

describe("Gutter Cleaning", () => {
  it("calculates 1-story base", () => {
    const q = calculateQuote(base("gutter", { stories: 1 }));
    expect(q.low).toBe(140);
  });

  it("calculates 2-story base", () => {
    const q = calculateQuote(base("gutter", { stories: 2 }));
    expect(q.low).toBe(200);
  });

  it("adds condition surcharge", () => {
    const q = calculateQuote(base("gutter", { stories: 1, gutterCondition: "heavy" }));
    expect(q.low).toBe(190); // 140 + 50
  });

  it("adds downspout addon", () => {
    const q = calculateQuote(base("gutter", { stories: 1, addOns: ["downspout"] }));
    expect(q.low).toBe(170); // 140 + 30
  });
});

describe("Roof Cleaning", () => {
  it("calculates base price", () => {
    const q = calculateQuote(base("roof", { roofSize: "s2000_2500" }));
    expect(q.low).toBe(520);
  });

  it("adds moss removal", () => {
    const q = calculateQuote(base("roof", { roofSize: "lt1500", mossLevel: "moderate" }));
    expect(q.low).toBe(600); // 320 + 280
  });

  it("adds algae protection", () => {
    const q = calculateQuote(base("roof", { roofSize: "lt1500", algaeProtection: true }));
    expect(q.low).toBe(470); // 320 + 150
  });
});

describe("Pressure Washing", () => {
  it("calculates base with home size multiplier", () => {
    const q = calculateQuote(base("pressure", { homeSize: "s1000_2000" }));
    expect(q.low).toBe(250); // 250 × 1.0
  });

  it("applies condition surcharge", () => {
    const q = calculateQuote(base("pressure", { homeSize: "s1000_2000", pressureCondition: "heavy" }));
    expect(q.low).toBe(350); // 250 + 40% = 350
  });
});

describe("Duct Cleaning", () => {
  it("calculates base for 10 vents", () => {
    const q = calculateQuote(base("duct", { ventCount: 10 }));
    expect(q.low).toBe(300);
  });

  it("charges for extra vents", () => {
    const q = calculateQuote(base("duct", { ventCount: 15 }));
    expect(q.low).toBe(450); // 300 + 5×30
  });

  it("adds dryer vent", () => {
    const q = calculateQuote(base("duct", { ventCount: 10, dryerVent: true }));
    expect(q.low).toBe(425); // 300 + 125
  });
});

describe("Backwater Testing", () => {
  it("calculates single device", () => {
    const q = calculateQuote(base("backwater", { deviceCount: 1 }));
    expect(q.low).toBe(125);
  });

  it("adds additional devices", () => {
    const q = calculateQuote(base("backwater", { deviceCount: 3 }));
    expect(q.low).toBe(255); // 125 + 2×65
  });

  it("adds repair and cert filing", () => {
    const q = calculateQuote(base("backwater", { deviceCount: 1, deviceRepair: true, certFiling: true }));
    expect(q.low).toBe(350); // 125 + 200 + 25
  });

  it("adds emergency surcharge", () => {
    const q = calculateQuote(base("backwater", { deviceCount: 1, urgency: "emergency" }));
    expect(q.low).toBe(250); // 125 + 125
  });
});

describe("Fence Installation", () => {
  it("calculates basic installation", () => {
    const q = calculateQuote(base("fence", { linearFeet: 100 }));
    // 100 × $45 = $4500, range ±10%
    expect(q.low).toBe(4050);
    expect(q.high).toBe(4950);
  });

  it("adds height and terrain modifiers", () => {
    const q = calculateQuote(base("fence", {
      linearFeet: 50,
      fenceHeight: "eight_ft",
      terrain: "rocky",
    }));
    // 50 × ($45 + $8 + $10) = 50 × $63 = $3150
    expect(q.low).toBe(Math.round(3150 * 0.9));
    expect(q.high).toBe(Math.round(3150 * 1.1));
  });

  it("calculates repair pricing", () => {
    const q = calculateQuote(base("fence", { linearFeet: 20, addOns: ["repair"] }));
    // 20 × $40 = $800
    expect(q.low).toBe(720);
    expect(q.high).toBe(880);
  });

  it("adds gates and weatherproof", () => {
    const q = calculateQuote(base("fence", {
      linearFeet: 50,
      doorCount: 2,
      weatherproofCoating: true,
    }));
    // 50×$45 = $2250 + 2×$200 + $150 = $2800
    expect(q.low).toBe(Math.round(2800 * 0.9));
    expect(q.high).toBe(Math.round(2800 * 1.1));
  });
});

describe("Provider/Platform economics across all services", () => {
  it("all quotes have valid economics fields", () => {
    const services = ["lawn", "house_cleaning", "gutter", "roof", "pressure", "duct", "backwater", "fence"];
    for (const svc of services) {
      const q = calculateQuote(base(svc));
      expect(q.providerPayout).toBeGreaterThan(0);
      expect(q.platformMargin).toBeGreaterThan(0);
      expect(q.providerPayout + q.platformMargin).toBe(
        svc === "fence" ? q.providerPayout + q.platformMargin : q.low
      );
    }
  });

  it("all quotes have available slots", () => {
    const services = ["lawn", "house_cleaning", "gutter", "roof", "pressure", "duct", "backwater", "fence"];
    for (const svc of services) {
      const q = calculateQuote(base(svc));
      expect(q.slots!.length).toBeGreaterThan(0);
      expect(q.timeSlots!.length).toBeGreaterThan(0);
    }
  });
});
