-- Drop the recursive policy
DROP POLICY IF EXISTS "providers_view_lead_services" ON public.booking_service;

-- Create a security definer function to check if a provider has a lead for a service
CREATE OR REPLACE FUNCTION public.provider_has_lead_for_service(p_service_id uuid, p_provider_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.booking_lead
    WHERE service_id = p_service_id
      AND provider_user_id = p_provider_id
  )
$$;

-- Re-create the policy using the security definer function
CREATE POLICY "providers_view_lead_services"
  ON public.booking_service
  FOR SELECT
  TO authenticated
  USING (
    public.provider_has_lead_for_service(id, auth.uid())
  );