
-- Use CASCADE for trigger-dependent functions
DROP FUNCTION IF EXISTS public.set_notification_creator() CASCADE;

-- Drop remaining broken functions  
DROP FUNCTION IF EXISTS public.is_appointment_participant(uuid, uuid);
DROP FUNCTION IF EXISTS public.user_owns_service(uuid, uuid);
DROP FUNCTION IF EXISTS public.user_assigned_to_service(uuid, uuid);
DROP FUNCTION IF EXISTS public.service_is_unassigned(uuid);
DROP FUNCTION IF EXISTS public.user_in_service_appointment(uuid, uuid);
DROP FUNCTION IF EXISTS public.create_scheduling_proposal(uuid, timestamptz, text);
DROP FUNCTION IF EXISTS public.update_appointment_status(uuid, uuid, text, text, text, timestamptz, text, text);
DROP FUNCTION IF EXISTS public.create_service_booking(uuid, uuid, text, text, text, text, jsonb, text[], text, text);
DROP FUNCTION IF EXISTS public.update_lead_status(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.rpc_admin_manage_user(uuid, text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.mark_notification_read(uuid, uuid, boolean);
DROP FUNCTION IF EXISTS public.test_save_profile(uuid, text, text, text, text, text);

-- Drop redundant tables
DROP TABLE IF EXISTS public.service_extras;
DROP TABLE IF EXISTS public.user_audit_logs;

-- Create disputes table
CREATE TABLE public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid REFERENCES public.booking_appointment(id) ON DELETE SET NULL,
  service_id uuid,
  filed_by uuid NOT NULL,
  filed_against uuid,
  dispute_type text NOT NULL,
  description text,
  evidence_urls jsonb DEFAULT '[]'::jsonb,
  dispute_status text NOT NULL DEFAULT 'open',
  resolution_type text,
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  refund_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their disputes" ON public.disputes FOR SELECT USING (auth.uid() = filed_by OR auth.uid() = filed_against);
CREATE POLICY "Users can file disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = filed_by);
CREATE POLICY "Admins can view all disputes" ON public.disputes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update disputes" ON public.disputes FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create property_appliances table
CREATE TABLE public.property_appliances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES public.user_homes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  appliance_name text NOT NULL,
  brand text,
  model text,
  serial_number text,
  installed_date date,
  next_service_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.property_appliances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their appliances" ON public.property_appliances FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create property_warranties table
CREATE TABLE public.property_warranties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES public.user_homes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  appliance_id uuid REFERENCES public.property_appliances(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  warranty_provider text,
  coverage_type text,
  start_date date,
  expiry_date date,
  document_url text,
  warranty_status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.property_warranties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their warranties" ON public.property_warranties FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create loyalty_points table
CREATE TABLE public.loyalty_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  points_balance integer NOT NULL DEFAULT 0,
  lifetime_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their points" ON public.loyalty_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can manage points" ON public.loyalty_points FOR INSERT WITH CHECK (true);

-- Create loyalty_point_transactions table
CREATE TABLE public.loyalty_point_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  points integer NOT NULL,
  transaction_type text NOT NULL,
  description text,
  service_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_point_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their point transactions" ON public.loyalty_point_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert point transactions" ON public.loyalty_point_transactions FOR INSERT WITH CHECK (true);

-- Recreate fixed functions
CREATE OR REPLACE FUNCTION public.update_lead_status(_lead_id uuid, _provider_id uuid, _status text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE result_row booking_lead%ROWTYPE;
BEGIN
  UPDATE public.booking_lead SET lead_status = _status, updated_at = now()
  WHERE id = _lead_id AND provider_user_id = _provider_id RETURNING * INTO result_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found or user not authorized'; END IF;
  RETURN row_to_json(result_row);
END; $$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(_user_id uuid, _notification_id uuid DEFAULT NULL, _mark_all boolean DEFAULT false)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE rows_updated integer;
BEGIN
  IF _mark_all THEN
    UPDATE public.booking_notification SET is_read = true WHERE recipient_user_id = _user_id AND is_read = false;
  ELSE
    UPDATE public.booking_notification SET is_read = true WHERE id = _notification_id AND recipient_user_id = _user_id;
  END IF;
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END; $$;

CREATE OR REPLACE FUNCTION public.update_appointment_status(
  _appointment_id uuid, _user_id uuid, _status text DEFAULT NULL,
  _customer_status text DEFAULT NULL, _provider_status text DEFAULT NULL,
  _appointment_date timestamptz DEFAULT NULL, _cancellation_reason text DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE result_row booking_appointment%ROWTYPE; is_participant boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM booking_appointment WHERE id = _appointment_id AND (customer_user_id = _user_id OR provider_user_id = _user_id)) INTO is_participant;
  IF NOT is_participant THEN RAISE EXCEPTION 'User is not a participant'; END IF;
  UPDATE public.booking_appointment SET
    appointment_status = COALESCE(_status, appointment_status),
    customer_status = COALESCE(_customer_status::participant_status, customer_status),
    provider_status = COALESCE(_provider_status::participant_status, provider_status),
    appointment_date = COALESCE(_appointment_date, appointment_date),
    cancellation_reason = COALESCE(_cancellation_reason, cancellation_reason)
  WHERE id = _appointment_id RETURNING * INTO result_row;
  RETURN row_to_json(result_row);
END; $$;

-- Add updated_at triggers
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_property_appliances_updated_at BEFORE UPDATE ON public.property_appliances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_property_warranties_updated_at BEFORE UPDATE ON public.property_warranties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON public.loyalty_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
