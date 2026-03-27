import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BasePricing {
  id: string;
  service_type: string;
  package_name: string;
  price: number;
  pricing_key: string | null;
  is_active: boolean | null;
}

export interface ServiceAddon {
  id: string;
  service_type: string;
  addon_name: string;
  price: number;
  pricing_key: string | null;
  description: string | null;
  is_active: boolean | null;
}

export interface PricingSurcharge {
  id: string;
  service_type: string;
  surcharge_name: string;
  surcharge_type: string; // 'fixed' | 'percentage' | 'per_unit'
  value: number;
  condition_key: string | null;
  condition_value: string | null;
  description: string | null;
}

export interface SizeMultiplier {
  size_key: string;
  multiplier: number;
}

export interface ServiceFrequency {
  frequency_key: string;
  frequency_label: string;
  services_per_year: number;
}

export const useBasePricing = (serviceType?: string) => {
  return useQuery({
    queryKey: ["base-pricing", serviceType],
    queryFn: async () => {
      let query = supabase
        .from("service_base_pricing")
        .select("*")
        .eq("is_active", true);
      if (serviceType) query = query.eq("service_type", serviceType);
      const { data, error } = await query.order("price");
      if (error) throw error;
      return data as BasePricing[];
    },
  });
};

export const useServiceAddons = (serviceType?: string) => {
  return useQuery({
    queryKey: ["service-addons", serviceType],
    queryFn: async () => {
      let query = supabase
        .from("service_addons")
        .select("*")
        .eq("is_active", true);
      if (serviceType) query = query.eq("service_type", serviceType);
      const { data, error } = await query.order("addon_name");
      if (error) throw error;
      return data as ServiceAddon[];
    },
  });
};

export const useSurcharges = (serviceType?: string) => {
  return useQuery({
    queryKey: ["surcharges", serviceType],
    queryFn: async () => {
      let query = supabase
        .from("pricing_surcharges")
        .select("*")
        .eq("is_active", true);
      if (serviceType) query = query.eq("service_type", serviceType);
      const { data, error } = await query;
      if (error) throw error;
      return data as PricingSurcharge[];
    },
  });
};

export const useSizeMultipliers = () => {
  return useQuery({
    queryKey: ["size-multipliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("size_multipliers")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as SizeMultiplier[];
    },
  });
};

export const useFrequencies = () => {
  return useQuery({
    queryKey: ["frequencies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_frequencies")
        .select("*")
        .eq("is_active", true)
        .order("services_per_year", { ascending: false });
      if (error) throw error;
      return data as ServiceFrequency[];
    },
  });
};

// Service type mapping from ServiceGrid IDs to DB service_types
export const SERVICE_TYPE_MAP: Record<string, string> = {
  lawn: "lawn",
  pressure: "pressure",
  roof: "roof",
  house_cleaning: "house_cleaning",
  gutter: "gutter",
  duct: "duct",
  backwater: "backwater",
  fence: "fence",
};
