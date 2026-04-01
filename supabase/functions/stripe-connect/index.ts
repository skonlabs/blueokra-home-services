import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { action } = await req.json();

    if (action === "create_account") {
      // Check if provider already has a Connect account stored
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("company_name, first_name, last_name, phone")
        .eq("user_id", userId)
        .single();

      // Search for existing Connect account by metadata
      const existingAccounts = await stripe.accounts.list({ limit: 100 });
      let account = existingAccounts.data.find(
        (a) => a.metadata?.blueokra_user_id === userId
      );

      if (!account) {
        // Create a new Express Connect account
        account = await stripe.accounts.create({
          type: "express",
          metadata: { blueokra_user_id: userId },
          business_profile: {
            name: profile?.company_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || undefined,
          },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
      }

      // Generate onboarding link
      const origin = req.headers.get("origin") || "https://blueokra.com";
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${origin}/?stripe_connect=refresh`,
        return_url: `${origin}/?stripe_connect=complete`,
        type: "account_onboarding",
      });

      return new Response(
        JSON.stringify({
          url: accountLink.url,
          accountId: account.id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === "check_status") {
      // Find the Connect account for this user
      const existingAccounts = await stripe.accounts.list({ limit: 100 });
      const account = existingAccounts.data.find(
        (a) => a.metadata?.blueokra_user_id === userId
      );

      if (!account) {
        return new Response(
          JSON.stringify({ status: "not_created", connected: false }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      const isComplete =
        account.details_submitted &&
        account.charges_enabled &&
        account.payouts_enabled;

      return new Response(
        JSON.stringify({
          status: isComplete ? "active" : "pending",
          connected: isComplete,
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          accountId: account.id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
