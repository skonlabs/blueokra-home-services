import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: serviceData, error: serviceError } = await supabase
        .from("booking_service")
        .select("id, service_type, package_name, booking_status, created_at, frequency, notes, revenue, customizations, completed_at, customer_user_id")
        .eq("customer_user_id", user!.id)
        .order("created_at", { ascending: false });

      if (serviceError) throw serviceError;
      if (!serviceData?.length) return [];

      const serviceIds = serviceData.map(s => s.id);
      const { data: apptData } = await supabase
        .from("booking_appointment")
        .select("id, service_id, appointment_date, appointment_status, provider_user_id, customer_status, provider_status")
        .in("service_id", serviceIds);

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

      // Fetch customer profiles for display
      const customerIds = [...new Set((data || []).map(d => d.customer_user_id).filter(Boolean))] as string[];
      let customerProfiles: Record<string, any> = {};
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, display_name, address, city, state")
          .in("user_id", customerIds);
        (profiles || []).forEach((p: any) => {
          customerProfiles[p.user_id] = p;
        });
      }

      return (data || []).map(d => ({
        ...d,
        customer_profile: customerProfiles[d.customer_user_id!] || null,
      }));
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
