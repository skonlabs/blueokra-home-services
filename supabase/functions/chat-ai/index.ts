import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal prompt — only service detection, no pricing tables
const SYSTEM_PROMPT = `You are a home services intake assistant for BlueOkra. Identify which service the homeowner needs and respond warmly in one sentence.

Available service IDs: lawn, house_cleaning, gutter, roof, pressure, electrical, duct, backwater, fence

Rules:
- lawn: mowing, grass, yard, garden, trimming
- house_cleaning: cleaning, maid, deep clean, move-out
- gutter: gutters, downspouts
- roof: roof, shingles, moss on roof
- pressure: pressure washing, power wash, driveway, patio, siding
- electrical: electrical, outlets, wiring, breaker, panel
- duct: ducts, vents, air quality, HVAC, AC, furnace, dryer vent
- backwater: backwater, backflow, sewer valve, flood device
- fence: fence, fencing, gate installation

If the user's message does NOT match any of the above services, set serviceId to null and reply explaining that we currently only offer those services.

Respond ONLY with valid JSON — no markdown, no extra text:
{"serviceId":"<id or null>","reply":"<one warm sentence>"}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ serviceId: null, reply: "I couldn't process your request right now. Please try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { message, hasImages } = await req.json() as { message: string; hasImages?: boolean };

    const userContent = hasImages
      ? `${message} [Customer also uploaded photos]`
      : message;

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const raw = (response.content[0] as { text: string }).text.trim();

    // Parse JSON — fall back gracefully if Claude adds extra text
    let parsed: { serviceId: string; reply: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { serviceId: null, reply: "I wasn't sure which service you need. Could you describe it differently?" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("chat-ai error:", err);
    return new Response(
      JSON.stringify({ serviceId: null, reply: "Something went wrong. Please try again or select a service from the menu." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
