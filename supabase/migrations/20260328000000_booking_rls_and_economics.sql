-- =============================================================
-- Fix 1: Enable RLS + add policies for booking tables
-- (Without these policies all authenticated inserts are blocked)
-- =============================================================

-- booking_service
ALTER TABLE public.booking_service ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own bookings"
  ON public.booking_service FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_user_id);

CREATE POLICY "Users can view their own bookings"
  ON public.booking_service FOR SELECT TO authenticated
  USING (auth.uid() = customer_user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.booking_service FOR UPDATE TO authenticated
  USING (auth.uid() = customer_user_id);

CREATE POLICY "Providers can view assigned bookings"
  ON public.booking_service FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.booking_appointment
      WHERE service_id = id
        AND provider_user_id = auth.uid()
    )
  );

-- booking_appointment
ALTER TABLE public.booking_appointment ENABLE ROW LEVEL SECURITY;

-- Customers insert appointments for their own bookings (customer_user_id omitted to avoid FK)
CREATE POLICY "Users can insert appointments for their bookings"
  ON public.booking_appointment FOR INSERT TO authenticated
  WITH CHECK (
    customer_user_id IS NULL
    OR customer_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.booking_service
      WHERE id = service_id
        AND customer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their appointments"
  ON public.booking_appointment FOR SELECT TO authenticated
  USING (
    customer_user_id = auth.uid()
    OR provider_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.booking_service
      WHERE id = service_id
        AND customer_user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their appointments"
  ON public.booking_appointment FOR UPDATE TO authenticated
  USING (provider_user_id = auth.uid());

CREATE POLICY "Customers can update their appointments"
  ON public.booking_appointment FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.booking_service
      WHERE id = service_id
        AND customer_user_id = auth.uid()
    )
  );
