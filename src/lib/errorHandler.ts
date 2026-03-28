import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Friendly error messages for common Postgres/Supabase error codes.
 */
const friendlyMessages: Record<string, string> = {
  "23505": "This record already exists.",
  "23503": "A related record was not found.",
  "42501": "You don't have permission to perform this action.",
  "PGRST301": "You need to be logged in to do this.",
  "PGRST204": "Record not found.",
};

interface PgError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Handles a Supabase mutation error:
 *  1. Shows a user-friendly toast notification.
 *  2. Logs the full error to the system_logs table for engineering.
 *
 * @param err        The caught error object
 * @param action     A short label describing the operation (e.g. "save_profile")
 * @param userId     Optional user id for attribution in logs
 * @returns          A user-friendly error string (in case caller wants to display inline too)
 */
export async function handleMutationError(
  err: unknown,
  action: string,
  userId?: string,
): Promise<string> {
  const pgErr = err as PgError;
  const code = pgErr?.code ?? "";
  const rawMessage = pgErr?.message ?? (err instanceof Error ? err.message : "Unknown error");

  // Pick a friendly message or fall back to a generic one
  const friendly =
    friendlyMessages[code] ??
    "Something went wrong. Please try again or contact support.";

  // Show toast to user
  toast.error(friendly);

  // Log detailed error to system_logs (fire-and-forget)
  try {
    await supabase.from("system_logs").insert({
      user_id: userId ?? null,
      log_type: "mutation_error",
      severity: "error",
      action,
      error_message: rawMessage,
      details: {
        code,
        hint: pgErr?.hint ?? null,
        details: pgErr?.details ?? null,
        raw: typeof err === "object" ? JSON.stringify(err) : String(err),
      },
    });
  } catch {
    // Silently fail — we don't want logging failures to affect UX
  }

  return friendly;
}
