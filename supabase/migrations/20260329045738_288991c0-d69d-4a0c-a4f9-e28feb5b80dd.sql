
-- Fix provider_respond_service to:
-- 1. Update accepting provider's lead_status to 'accepted'
-- 2. Assign provider to existing appointments for the service
CREATE OR REPLACE FUNCTION public.provider_respond_service(
  _user_id uuid,
  _service_id uuid,
  _response_type text,
  _decline_reason text DEFAULT NULL,
  _proposed_date timestamp with time zone DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_record record;
  appointment_record record;
  service_record record;
BEGIN
  SET LOCAL row_security = off;

  -- Record provider response
  INSERT INTO public.booking_provider_response (
    service_id, provider_user_id, response_type
  ) VALUES (
    _service_id, _user_id, _response_type
  )
  ON CONFLICT (service_id, provider_user_id)
  DO UPDATE SET response_type = EXCLUDED.response_type
  RETURNING * INTO response_record;

  -- If accepted, assign provider and mark other leads as missed
  IF _response_type = 'accepted' THEN
    -- Create service assignment
    INSERT INTO public.booking_assignment (
      service_id, provider_user_id
    ) VALUES (
      _service_id, _user_id
    )
    ON CONFLICT (service_id, provider_user_id) DO NOTHING;

    -- Mark service assigned
    UPDATE public.booking_service
    SET booking_status = 'assigned'
    WHERE id = _service_id;

    -- Update accepting provider's lead to 'accepted'
    UPDATE public.booking_lead
    SET lead_status = 'accepted', updated_at = now()
    WHERE service_id = _service_id
      AND provider_user_id = _user_id;

    -- Mark ALL OTHER providers' leads for this service as 'missed'
    UPDATE public.booking_lead
    SET lead_status = 'missed', updated_at = now()
    WHERE service_id = _service_id
      AND provider_user_id != _user_id
      AND lead_status NOT IN ('accepted', 'rejected', 'missed');

    -- Assign provider to existing appointments for this service
    UPDATE public.booking_appointment
    SET provider_user_id = _user_id,
        appointment_status = 'confirmed',
        provider_status = 'confirmed'
    WHERE service_id = _service_id
      AND (provider_user_id IS NULL OR provider_user_id = _user_id);

    -- If proposed date provided, also create a new appointment
    IF _proposed_date IS NOT NULL THEN
      INSERT INTO public.booking_appointment (
        service_id, provider_user_id, appointment_date,
        appointment_status, provider_status, customer_status
      ) VALUES (
        _service_id, _user_id, _proposed_date,
        'confirmed', 'confirmed', 'pending'
      )
      RETURNING * INTO appointment_record;

      INSERT INTO public.booking_appointment_proposal (
        appointment_id, proposed_by, proposed_date
      ) VALUES (
        appointment_record.id, _user_id, _proposed_date
      );
    END IF;

    -- Get service info for notification
    SELECT * INTO service_record
    FROM public.booking_service
    WHERE id = _service_id;

    -- Notify customer
    INSERT INTO public.booking_notification (
      service_id, recipient_user_id, notification_type, title, message, metadata
    ) VALUES (
      _service_id, service_record.customer_user_id,
      'provider_accepted', 'Provider Accepted Your Request',
      'A provider has accepted your service request.',
      jsonb_build_object('service_id', _service_id)
    );

  ELSIF _response_type = 'declined' THEN
    -- Update this provider's lead to rejected
    UPDATE public.booking_lead
    SET lead_status = 'rejected', updated_at = now()
    WHERE service_id = _service_id
      AND provider_user_id = _user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'response', row_to_json(response_record),
    'appointment', row_to_json(appointment_record)
  );
END;
$$;
