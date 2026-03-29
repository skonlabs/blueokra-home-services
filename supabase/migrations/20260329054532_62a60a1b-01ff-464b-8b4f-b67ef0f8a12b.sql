
-- Update provider_respond_service to auto-generate recurring appointments when accepted
CREATE OR REPLACE FUNCTION public.provider_respond_service(
  _user_id uuid, 
  _service_id uuid, 
  _response_type text, 
  _decline_reason text DEFAULT NULL, 
  _proposed_date timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  response_record record;
  appointment_record record;
  service_record record;
  _freq text;
  _start_date timestamptz;
  _interval interval;
  _appt_count int;
  _i int;
  _next_date timestamptz;
  _existing_count int;
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

    -- Assign provider to existing appointments for this service (set to pending, not confirmed)
    UPDATE public.booking_appointment
    SET provider_user_id = _user_id,
        appointment_status = 'pending',
        provider_status = 'pending',
        customer_status = 'pending'
    WHERE service_id = _service_id
      AND (provider_user_id IS NULL OR provider_user_id = _user_id);

    -- Get service info
    SELECT * INTO service_record
    FROM public.booking_service
    WHERE id = _service_id;

    _freq := COALESCE(service_record.frequency, 'one-time');

    -- Auto-generate recurring appointments if frequency is not one-time
    IF _freq != 'one-time' THEN
      -- Determine interval
      _interval := CASE _freq
        WHEN 'weekly' THEN interval '1 week'
        WHEN 'biweekly' THEN interval '2 weeks'
        WHEN 'monthly' THEN interval '1 month'
        WHEN 'quarterly' THEN interval '3 months'
        ELSE interval '1 month'
      END;

      -- Determine how many appointments to create for 1 year
      _appt_count := CASE _freq
        WHEN 'weekly' THEN 52
        WHEN 'biweekly' THEN 26
        WHEN 'monthly' THEN 12
        WHEN 'quarterly' THEN 4
        ELSE 12
      END;

      -- Find the start date from existing appointments or use now
      SELECT appointment_date INTO _start_date
      FROM public.booking_appointment
      WHERE service_id = _service_id
      ORDER BY appointment_date ASC
      LIMIT 1;

      IF _start_date IS NULL THEN
        _start_date := COALESCE(_proposed_date, now());
      END IF;

      -- Count existing appointments
      SELECT COUNT(*) INTO _existing_count
      FROM public.booking_appointment
      WHERE service_id = _service_id;

      -- Generate remaining appointments (skip existing count)
      FOR _i IN (_existing_count + 1).._appt_count LOOP
        _next_date := _start_date + (_interval * _i);
        
        INSERT INTO public.booking_appointment (
          service_id, provider_user_id, customer_user_id,
          appointment_date, appointment_status, 
          provider_status, customer_status,
          customer_amount, provider_amount, platform_amount
        ) VALUES (
          _service_id, _user_id, service_record.customer_user_id,
          _next_date, 'pending',
          'pending', 'pending',
          service_record.revenue, 
          ROUND(COALESCE(service_record.revenue, 0) * 0.85 * 0.75, 2),
          ROUND(COALESCE(service_record.revenue, 0) * 0.85 * 0.25, 2)
        );
      END LOOP;
    END IF;

    -- If proposed date provided, also create a new appointment
    IF _proposed_date IS NOT NULL THEN
      INSERT INTO public.booking_appointment (
        service_id, provider_user_id, customer_user_id,
        appointment_date, appointment_status, provider_status, customer_status
      ) VALUES (
        _service_id, _user_id, service_record.customer_user_id,
        _proposed_date, 'pending', 'confirmed', 'pending'
      )
      RETURNING * INTO appointment_record;

      INSERT INTO public.booking_appointment_proposal (
        appointment_id, proposed_by, proposed_date
      ) VALUES (
        appointment_record.id, _user_id, _proposed_date
      );
    END IF;

    -- Notify customer
    INSERT INTO public.booking_notification (
      service_id, recipient_user_id, notification_type, title, message, metadata
    ) VALUES (
      _service_id, service_record.customer_user_id,
      'provider_accepted', 'Provider Accepted Your Request',
      'A provider has accepted your service request. Please confirm the scheduled dates.',
      jsonb_build_object('service_id', _service_id)
    );

  ELSIF _response_type = 'declined' THEN
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

-- Create function for proposing a new date/time for an appointment
CREATE OR REPLACE FUNCTION public.propose_appointment_date(
  _user_id uuid,
  _appointment_id uuid,
  _proposed_date timestamptz,
  _notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _appt record;
  _is_provider boolean;
  _is_customer boolean;
BEGIN
  SET LOCAL row_security = off;

  SELECT * INTO _appt FROM public.booking_appointment WHERE id = _appointment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment not found');
  END IF;

  _is_provider := (_appt.provider_user_id = _user_id);
  _is_customer := (_appt.customer_user_id = _user_id OR EXISTS (
    SELECT 1 FROM public.booking_service WHERE id = _appt.service_id AND customer_user_id = _user_id
  ));

  IF NOT _is_provider AND NOT _is_customer THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Record proposal
  INSERT INTO public.booking_appointment_proposal (
    appointment_id, proposed_by, proposed_date, response_notes
  ) VALUES (
    _appointment_id, _user_id, _proposed_date, _notes
  );

  -- Update appointment date and reset statuses
  UPDATE public.booking_appointment
  SET appointment_date = _proposed_date,
      appointment_status = 'pending',
      provider_status = CASE WHEN _is_provider THEN 'confirmed' ELSE 'pending' END,
      customer_status = CASE WHEN _is_customer AND NOT _is_provider THEN 'confirmed' ELSE 'pending' END,
      reschedule_count = COALESCE(reschedule_count, 0) + 1
  WHERE id = _appointment_id;

  -- Notify the other party
  INSERT INTO public.booking_notification (
    service_id, recipient_user_id, notification_type, title, message, metadata
  ) VALUES (
    _appt.service_id,
    CASE WHEN _is_provider THEN 
      COALESCE(_appt.customer_user_id, (SELECT customer_user_id FROM public.booking_service WHERE id = _appt.service_id))
    ELSE _appt.provider_user_id END,
    'date_proposal',
    'New Date Proposed',
    'A new date/time has been proposed for your appointment. Please review and confirm.',
    jsonb_build_object('appointment_id', _appointment_id, 'proposed_date', _proposed_date)
  );

  RETURN jsonb_build_object('success', true, 'appointment_id', _appointment_id);
END;
$$;

-- Create function to accept a proposed date (confirm appointment)
CREATE OR REPLACE FUNCTION public.accept_appointment_date(
  _user_id uuid,
  _appointment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _appt record;
  _is_provider boolean;
  _is_customer boolean;
  _other_user_id uuid;
BEGIN
  SET LOCAL row_security = off;

  SELECT * INTO _appt FROM public.booking_appointment WHERE id = _appointment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment not found');
  END IF;

  _is_provider := (_appt.provider_user_id = _user_id);
  _is_customer := (_appt.customer_user_id = _user_id OR EXISTS (
    SELECT 1 FROM public.booking_service WHERE id = _appt.service_id AND customer_user_id = _user_id
  ));

  IF NOT _is_provider AND NOT _is_customer THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Update the confirming party's status
  IF _is_provider THEN
    UPDATE public.booking_appointment
    SET provider_status = 'confirmed'
    WHERE id = _appointment_id;
  END IF;

  IF _is_customer THEN
    UPDATE public.booking_appointment
    SET customer_status = 'confirmed'
    WHERE id = _appointment_id;
  END IF;

  -- Check if both parties have confirmed
  SELECT * INTO _appt FROM public.booking_appointment WHERE id = _appointment_id;
  
  IF _appt.provider_status = 'confirmed' AND _appt.customer_status = 'confirmed' THEN
    UPDATE public.booking_appointment
    SET appointment_status = 'confirmed'
    WHERE id = _appointment_id;
  END IF;

  -- Notify the other party
  _other_user_id := CASE 
    WHEN _is_provider THEN COALESCE(_appt.customer_user_id, (SELECT customer_user_id FROM public.booking_service WHERE id = _appt.service_id))
    ELSE _appt.provider_user_id 
  END;

  IF _other_user_id IS NOT NULL THEN
    INSERT INTO public.booking_notification (
      service_id, recipient_user_id, notification_type, title, message, metadata
    ) VALUES (
      _appt.service_id, _other_user_id,
      'date_confirmed',
      CASE WHEN _appt.provider_status = 'confirmed' AND _appt.customer_status = 'confirmed' 
        THEN 'Appointment Confirmed!' 
        ELSE 'Date Accepted' 
      END,
      CASE WHEN _appt.provider_status = 'confirmed' AND _appt.customer_status = 'confirmed'
        THEN 'Both parties have confirmed the appointment date.'
        ELSE 'The other party has accepted the proposed date. Please confirm on your end.'
      END,
      jsonb_build_object('appointment_id', _appointment_id)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'confirmed', _appt.provider_status = 'confirmed' AND _appt.customer_status = 'confirmed'
  );
END;
$$;

-- Add unique constraint on booking_provider_response if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_provider_response_service_provider_unique'
  ) THEN
    ALTER TABLE public.booking_provider_response 
    ADD CONSTRAINT booking_provider_response_service_provider_unique 
    UNIQUE (service_id, provider_user_id);
  END IF;
END $$;

-- Add unique constraint on booking_assignment if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_assignment_service_provider_unique'
  ) THEN
    ALTER TABLE public.booking_assignment 
    ADD CONSTRAINT booking_assignment_service_provider_unique 
    UNIQUE (service_id, provider_user_id);
  END IF;
END $$;
