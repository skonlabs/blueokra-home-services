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

      // Fetch provider profiles for display
      const providerIds = [...new Set((apptData || []).map(a => a.provider_user_id).filter(Boolean))] as string[];
      let providerProfiles: Record<string, any> = {};
      if (providerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, display_name, profile_photo_url")
          .in("user_id", providerIds);
        (profiles || []).forEach((p: any) => {
          providerProfiles[p.user_id] = p;
        });
      }

      return serviceData.map(s => ({
        ...s,
        booking_appointment: apptData?.filter(a => a.service_id === s.id) ?? [],
        provider_profiles: providerProfiles,
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
            id, service_type, package_name, customer_user_id, revenue, notes, frequency, customizations, created_at
          )
        `)
        .eq("provider_user_id", user!.id)
        .order("appointment_date", { ascending: true });

      if (error) throw error;

      // Fetch customer profiles for display
      const customerIds = [
        ...new Set(
          (data || [])
            .flatMap((d: any) => [d.customer_user_id, (d.booking_service as any)?.customer_user_id])
            .filter(Boolean)
        ),
      ] as string[];
      let customerProfiles: Record<string, any> = {};
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, display_name, address, city, state, profile_photo_url")
          .in("user_id", customerIds);
        (profiles || []).forEach((p: any) => {
          customerProfiles[p.user_id] = p;
        });
      }

      return (data || []).map((d: any) => {
        const service = d.booking_service as any;
        const customerId = d.customer_user_id || service?.customer_user_id;
        return {
          ...d,
          customer_profile: (customerId && customerProfiles[customerId]) || null,
        };
      });
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
          id, lead_status, provider_user_id, service_id, created_at,
          booking_service!inner (
            id, service_type, package_name, customer_user_id, revenue, notes, customizations, created_at, frequency
          )
        `)
        .eq("provider_user_id", user!.id)
        .in("lead_status", ["new", "sent", "viewed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch customer profiles
      const customerIds = [...new Set((data || []).map(d => (d.booking_service as any)?.customer_user_id).filter(Boolean))] as string[];
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

      // Fetch all appointments for each service (dates + count)
      const serviceIds = [...new Set((data || []).map(d => d.service_id).filter(Boolean))] as string[];
      let appointmentsByService: Record<string, { dates: string[]; count: number }> = {};
      if (serviceIds.length > 0) {
        const { data: appts } = await supabase
          .from("booking_appointment")
          .select("service_id, appointment_date")
          .in("service_id", serviceIds)
          .order("appointment_date", { ascending: true });
        (appts || []).forEach((a: any) => {
          if (!appointmentsByService[a.service_id]) {
            appointmentsByService[a.service_id] = { dates: [], count: 0 };
          }
          appointmentsByService[a.service_id].dates.push(a.appointment_date);
          appointmentsByService[a.service_id].count++;
        });
      }

      return (data || []).map(d => {
        const svc = d.booking_service as any;
        const apptInfo = appointmentsByService[d.service_id] || { dates: [], count: 0 };
        return {
          ...d,
          customer_profile: customerProfiles[svc?.customer_user_id] || null,
          appointment_date: apptInfo.dates[0] || null,
          appointment_dates: apptInfo.dates,
          appointment_count: apptInfo.count,
        };
      });
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
