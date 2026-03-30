import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useBookings = () => {
  const { user } = useAuth();

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
      return data;
    },
  });
};

export const useProviderLeads = () => {
  const { user } = useAuth();

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

      // Enrich with customer profile
      const enriched = await Promise.all(
        (data || []).map(async (lead: any) => {
          const svc = lead.booking_service;
          if (!svc?.customer_user_id) return { ...lead, customer_profile: null };
          const { data: cp } = await supabase
            .from("profiles")
            .select("display_name, first_name, last_name, address, city, state, profile_photo_url")
            .eq("user_id", svc.customer_user_id)
            .single();
          return { ...lead, customer_profile: cp };
        })
      );

      return enriched;
    },
  });
};

export const useProviderJobs = () => {
  const { user } = useAuth();

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
            id, service_type, package_name, customer_user_id, revenue, notes
          )
        `)
        .eq("provider_user_id", user!.id)
        .order("appointment_date", { ascending: true })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
};

export const useProviderEarnings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["provider-earnings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transaction")
        .select("id, total_amount, provider_amount, payment_status, payment_method_type, created_at")
        .eq("provider_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
};

export const useUserHomes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-homes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_homes")
        .select("id, user_id, address, nickname, city, state, zip_code, is_primary, created_at")
        .eq("user_id", user!.id)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

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

export const useNotifications = () => {
  const { user } = useAuth();

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
