/**
 * Shared appointment status logic used across provider and homeowner views.
 * Single source of truth for status labels, colors, and dot colors.
 */

export type ViewRole = "provider" | "homeowner";

export interface AppointmentStatusInfo {
  label: string;
  color: string;       // tailwind text color class
  dotColor: string;    // tailwind bg color class
}

/**
 * Compute the display status for an appointment based on who is viewing it.
 *
 * @param appointmentStatus - The overall appointment status (e.g. "confirmed", "completed", "pending")
 * @param providerStatus - The provider's participant status
 * @param customerStatus - The customer's participant status
 * @param viewRole - Who is viewing: "provider" or "homeowner"
 */
export function getAppointmentStatusInfo(
  appointmentStatus: string,
  providerStatus: string,
  customerStatus: string,
  viewRole: ViewRole
): AppointmentStatusInfo {
  // Completed
  if (appointmentStatus === "completed") {
    return { label: "Completed", color: "text-okra-600", dotColor: "bg-okra-500" };
  }

  // Both confirmed
  if (
    appointmentStatus === "confirmed" ||
    (providerStatus === "confirmed" && customerStatus === "confirmed")
  ) {
    return { label: "Confirmed", color: "text-success", dotColor: "bg-success" };
  }

  // One side confirmed, other pending
  const myStatus = viewRole === "provider" ? providerStatus : customerStatus;
  const otherStatus = viewRole === "provider" ? customerStatus : providerStatus;

  if (myStatus === "confirmed" && otherStatus === "pending") {
    return {
      label: "Awaiting their confirmation",
      color: "text-primary",
      dotColor: "bg-primary",
    };
  }

  if (myStatus === "pending" && otherStatus === "confirmed") {
    return {
      label: "Pending your confirmation",
      color: "text-warm-500",
      dotColor: "bg-warm-400",
    };
  }

  // Both pending or other states
  if (myStatus === "pending") {
    return {
      label: "Needs your confirmation",
      color: "text-warm-500",
      dotColor: "bg-warm-400",
    };
  }

  // Fallback
  return {
    label: appointmentStatus.replace("_", " "),
    color: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
  };
}

/**
 * Check if the current user needs to confirm this appointment.
 */
export function userNeedsToConfirm(
  providerStatus: string,
  customerStatus: string,
  viewRole: ViewRole
): boolean {
  const myStatus = viewRole === "provider" ? providerStatus : customerStatus;
  return myStatus === "pending";
}

/**
 * Check if appointment can be marked complete (on or after scheduled date, and confirmed).
 */
export function canCompleteAppointment(
  rawDate: string,
  appointmentStatus: string,
  providerStatus: string,
  customerStatus: string
): boolean {
  try {
    const sd = new Date(rawDate);
    const today = new Date();
    sd.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const isConfirmed =
      appointmentStatus === "confirmed" ||
      (providerStatus === "confirmed" && customerStatus === "confirmed");
    return sd <= today && isConfirmed;
  } catch {
    return false;
  }
}
