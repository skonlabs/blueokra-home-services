CREATE POLICY "providers_view_lead_services"
  ON public.booking_service
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.booking_lead bl
      WHERE bl.service_id = booking_service.id
        AND bl.provider_user_id = auth.uid()
    )
  );