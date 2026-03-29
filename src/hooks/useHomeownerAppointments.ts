import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useHomeownerAppointments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["homeowner-appointments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get all services for this homeowner
      const { data: services, error: svcErr } = await supabase
        .from("booking_service")
        .select("id, service_type, package_name, revenue, frequency, notes, customer_user_id")
        .eq("customer_user_id", user!.id);

      if (svcErr) throw svcErr;
      if (!services?.length) return [];

      const serviceIds = services.map(s => s.id);
      const serviceMap: Record<string, any> = {};
      services.forEach(s => { serviceMap[s.id] = s; });

      // Get all appointments for those services
      const { data: appts, error: apptErr } = await supabase
        .from("booking_appointment")
        .select("id, appointment_date, appointment_status, provider_user_id, customer_user_id, customer_status, provider_status, service_id, notes, customer_amount")
        .in("service_id", serviceIds)
        .order("appointment_date", { ascending: true });

      if (apptErr) throw apptErr;

      // Fetch provider profiles
      const providerIds = [...new Set((appts || []).map(a => a.provider_user_id).filter(Boolean))] as string[];
      let providerProfiles: Record<string, any> = {};
      if (providerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, display_name, profile_photo_url, address, city, state, phone")
          .in("user_id", providerIds);
        (profiles || []).forEach((p: any) => {
          providerProfiles[p.user_id] = p;
        });
      }

      return (appts || []).map(a => {
        const svc = serviceMap[a.service_id!] || {};
        const provider = providerProfiles[a.provider_user_id!] || null;
        const providerName = provider?.display_name || [provider?.first_name, provider?.last_name].filter(Boolean).join(" ") || "Provider";
        return {
          ...a,
          service: svc,
          providerProfile: provider,
          providerName,
          serviceName: svc.package_name || svc.service_type || "Service",
          serviceType: svc.service_type || "general",
          customerAmount: a.customer_amount ?? svc.revenue ?? 0,
        };
      });
    },
  });
};
