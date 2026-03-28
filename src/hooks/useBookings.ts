import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      console.log("[useBookings] querying for user:", user!.id);

      // Step 1: query booking_service without join to isolate issues
      const { data: serviceData, error: serviceError } = await supabase
        .from("booking_service")
        .select("id, service_type, package_name, booking_status, created_at, frequency, notes, revenue, customizations, completed_at, customer_user_id")
        .eq("customer_user_id", user!.id)
        .order("created_at", { ascending: false });

      console.log("[useBookings] booking_service result:", { count: serviceData?.length, serviceError, rows: serviceData });

      if (serviceError) {
        console.error("[useBookings] booking_service error:", JSON.stringify(serviceError, null, 2));
        throw serviceError;
      }

      if (!serviceData?.length) return [];

      // Step 2: fetch appointments separately to avoid join RLS issues
      const serviceIds = serviceData.map(s => s.id);
      const { data: apptData, error: apptError } = await supabase
        .from("booking_appointment")
        .select("id, service_id, appointment_date, appointment_status, provider_user_id, customer_status, provider_status")
        .in("service_id", serviceIds);

      console.log("[useBookings] booking_appointment result:", { count: apptData?.length, apptError });

      // Merge appointments into bookings (ignore appointment errors — don't block bookings from showing)
      return serviceData.map(s => ({
        ...s,
        booking_appointment: apptData?.filter(a => a.service_id === s.id) ?? [],
      }));
    },
  });
};

export const useProviderJobs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["provider-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get appointments assigned to this provider
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
        .order("appointment_date", { ascending: true });

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
        .select("*")
        .eq("provider_user_id", user!.id)
        .order("created_at", { ascending: false });

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
        .select("*")
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
        .select("*")
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
        .select("*")
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
        .select("*")
        .eq("recipient_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
};
