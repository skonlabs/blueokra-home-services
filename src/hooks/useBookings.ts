import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Real-time helper: subscribe to a table and invalidate a React Query key
// ---------------------------------------------------------------------------
function useRealtimeInvalidation(
  table: string,
  filterColumn: string,
  filterValue: string | undefined,
  queryKey: string[],
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!filterValue) return;

    const channel = supabase
      .channel(`${table}-${filterValue}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `${filterColumn}=eq.${filterValue}` },
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filterColumn, filterValue, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ---------------------------------------------------------------------------
// Homeowner bookings
// ---------------------------------------------------------------------------
export const useBookings = () => {
  const { user } = useAuth();

  // Real-time: auto-refresh when booking data changes
  useRealtimeInvalidation("booking_service", "customer_user_id", user?.id, ["bookings", user?.id ?? ""]);
  useRealtimeInvalidation("booking_appointment", "customer_user_id", user?.id, ["bookings", user?.id ?? ""]);

  return useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_service")
        .select(`
          id, service_type, package_name, booking_status, created_at,
          frequency, notes, revenue, customizations, completed_at,
          booking_appointment (
            id, appointment_date, appointment_status,
            provider_user_id, customer_status, provider_status
          )
        `)
        .eq("customer_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Batch-fetch provider profiles for all appointments (fixes N+1 / missing provider info)
      const providerIds = [
        ...new Set(
          (data || [])
            .flatMap((b: any) => (b.booking_appointment || []).map((a: any) => a.provider_user_id))
            .filter(Boolean) as string[]
        ),
      ];

      let providerProfileMap: Record<string, any> = {};
      if (providerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, first_name, last_name, profile_photo_url, phone, address, city, state")
          .in("user_id", providerIds);
        providerProfileMap = Object.fromEntries(
          (profiles || []).map((p) => [p.user_id, p])
        );
      }

      // Attach provider profiles to each booking
      return (data || []).map((b: any) => ({
        ...b,
        provider_profiles: providerProfileMap,
      }));
    },
  });
};

// ---------------------------------------------------------------------------
// Provider leads
// ---------------------------------------------------------------------------
export const useProviderLeads = () => {
  const { user } = useAuth();

  useRealtimeInvalidation("booking_lead", "provider_user_id", user?.id, ["provider-leads", user?.id ?? ""]);

  return useQuery({
    queryKey: ["provider-leads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_lead")
        .select(`
          id, service_id, lead_status, created_at,
          booking_service (
            id, service_type, package_name, customer_user_id, revenue, frequency, notes, customizations, created_at
          )
        `)
        .eq("provider_user_id", user!.id)
        .eq("lead_status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Batch-fetch all customer profiles in one query (fixes N+1)
      const customerIds = [
        ...new Set(
          (data || [])
            .map((lead: any) => lead.booking_service?.customer_user_id)
            .filter(Boolean) as string[]
        ),
      ];

      let profileMap: Record<string, any> = {};
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, first_name, last_name, address, city, state, profile_photo_url")
          .in("user_id", customerIds);
        profileMap = Object.fromEntries(
          (profiles || []).map((p) => [p.user_id, p])
        );
      }

      return (data || []).map((lead: any) => ({
        ...lead,
        customer_profile: profileMap[lead.booking_service?.customer_user_id] || null,
      }));
    },
  });
};

// ---------------------------------------------------------------------------
// Provider jobs (appointments)
// ---------------------------------------------------------------------------
export const useProviderJobs = () => {
  const { user } = useAuth();

  useRealtimeInvalidation("booking_appointment", "provider_user_id", user?.id, ["provider-jobs", user?.id ?? ""]);

  return useQuery({
    queryKey: ["provider-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_appointment")
        .select(`
          id, appointment_date, appointment_status, customer_user_id,
          provider_user_id, customer_status, provider_status, notes,
          service_id,
          booking_service!inner (
            id, service_type, package_name, customer_user_id, revenue, notes, customizations, frequency
          )
        `)
        .eq("provider_user_id", user!.id)
        .order("appointment_date", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Batch-fetch customer profiles (fixes N+1)
      const customerIds = [
        ...new Set(
          (data || [])
            .map((j: any) => j.customer_user_id || j.booking_service?.customer_user_id)
            .filter(Boolean) as string[]
        ),
      ];

      let customerProfileMap: Record<string, any> = {};
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, first_name, last_name, address, city, state, profile_photo_url, phone")
          .in("user_id", customerIds);
        customerProfileMap = Object.fromEntries(
          (profiles || []).map((p) => [p.user_id, p])
        );
      }

      return (data || []).map((j: any) => ({
        ...j,
        customer_profile: customerProfileMap[j.customer_user_id || j.booking_service?.customer_user_id] || null,
      }));
    },
  });
};

// ---------------------------------------------------------------------------
// Provider earnings
// ---------------------------------------------------------------------------
export const useProviderEarnings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["provider-earnings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transaction")
        .select("id, total_amount, provider_amount, payment_status, payment_method_type, created_at, is_admin_approved")
        .eq("provider_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
};

// ---------------------------------------------------------------------------
// User homes
// ---------------------------------------------------------------------------
export const useUserHomes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-homes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_homes")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
};

// ---------------------------------------------------------------------------
// Property appliances
// ---------------------------------------------------------------------------
export const usePropertyAppliances = (homeId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["appliances", user?.id, homeId],
    enabled: !!user && !!homeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_appliances")
        .select("id, home_id, appliance_name, brand, model, installed_date, next_service_date, notes")
        .eq("user_id", user!.id)
        .eq("home_id", homeId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// ---------------------------------------------------------------------------
// Property warranties
// ---------------------------------------------------------------------------
export const usePropertyWarranties = (homeId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["warranties", user?.id, homeId],
    enabled: !!user && !!homeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_warranties")
        .select("id, home_id, item_name, warranty_provider, warranty_status, expiry_date, coverage_type, start_date")
        .eq("user_id", user!.id)
        .eq("home_id", homeId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// ---------------------------------------------------------------------------
// Notifications (with real-time)
// ---------------------------------------------------------------------------
export const useNotifications = () => {
  const { user } = useAuth();

  useRealtimeInvalidation("booking_notification", "recipient_user_id", user?.id, ["notifications", user?.id ?? ""]);

  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_notification")
        .select("id, notification_type, title, message, is_read, created_at, metadata")
        .eq("recipient_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
};

// ---------------------------------------------------------------------------
// Batch property homes (used by provider side)
// ---------------------------------------------------------------------------
export const usePropertyHomesByIds = (homeIds: string[]) => {
  const uniqueIds = [...new Set(homeIds.filter(Boolean))];

  return useQuery({
    queryKey: ["property-homes-batch", uniqueIds.sort().join(",")],
    enabled: uniqueIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_homes")
        .select("*")
        .in("id", uniqueIds);

      if (error) throw error;
      return Object.fromEntries((data as any[] || []).map((h: any) => [h.id, h]));
    },
  });
};
