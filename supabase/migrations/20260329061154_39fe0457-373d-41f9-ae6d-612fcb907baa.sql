CREATE OR REPLACE FUNCTION public.propose_appointment_date(
  _user_id uuid,
  _appointment_id uuid,
  _proposed_date timestamptz,
  _notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _appt record;
  _is_provider boolean;
  _is_customer boolean;
BEGIN
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

  INSERT INTO public.booking_appointment_proposal (
    appointment_id, proposed_by, proposed_date, response_notes
  ) VALUES (
    _appointment_id, _user_id, _proposed_date, _notes
  );

  UPDATE public.booking_appointment
  SET appointment_date = _proposed_date,
      appointment_status = 'pending',
      provider_status = (CASE WHEN _is_provider THEN 'confirmed' ELSE 'pending' END)::participant_status,
      customer_status = (CASE WHEN _is_customer AND NOT _is_provider THEN 'confirmed' ELSE 'pending' END)::participant_status,
      reschedule_count = COALESCE(reschedule_count, 0) + 1
  WHERE id = _appointment_id;

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