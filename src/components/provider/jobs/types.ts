export interface Appointment {
  id: string;
  date: string;
  rawDate: string;
  status: string;
  customerStatus: string;
  providerStatus: string;
  customerUserId?: string;
  serviceName?: string;
  customerName?: string;
  customerPhoto?: string;
}

export interface ProviderJob {
  id: string;
  serviceId: string;
  leadId?: string;
  service: string;
  serviceType: string;
  customer: string;
  address: string;
  status: "new_lead" | "in_progress" | "completed" | "declined";
  city?: string;
  state?: string;
  frequency?: string;
  firstServiceDate?: string;
  receivedAt?: string;
  firstServicePrice?: number;
  recurringPrice?: number;
  expectedEndDate?: string;
  customizations?: any;
  photos?: string[];
  propertyDetails?: {
    bedrooms?: number | null;
    bathrooms?: number | null;
    sqft?: number | null;
    lot_size_sqft?: number | null;
    house_type?: string | null;
    flooring?: string | null;
    has_basement?: boolean | null;
    has_fireplace?: boolean | null;
    heating_type?: string | null;
    roof_type?: string | null;
  } | null;
  homeId?: string | null;
  appointments: Appointment[];
  // Computed
  totalAppointments: number;
  completedAppointments: number;
}

export type TabKey = "all" | "new" | "in_progress" | "completed" | "declined";

export const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New Requests" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "declined", label: "Declined" },
];

export const FREQUENCY_LABELS: Record<string, string> = {
  "one-time": "One-Time",
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export const FREQUENCY_PER_YEAR: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  "one-time": 1,
};
