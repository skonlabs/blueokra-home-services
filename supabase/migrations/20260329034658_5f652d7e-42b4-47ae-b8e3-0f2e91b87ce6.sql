-- Admin needs to SELECT from admin_support_ticket
CREATE POLICY "admins_view_support_tickets" ON public.admin_support_ticket
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Admin needs to UPDATE support tickets
CREATE POLICY "admins_update_support_tickets" ON public.admin_support_ticket
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Admin needs to view all payment transactions
CREATE POLICY "admins_view_all_payments" ON public.payment_transaction
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Admin needs to view all profiles
CREATE POLICY "admins_view_all_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Admin needs to view all user roles
CREATE POLICY "admins_view_all_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

-- Admin view all booking notifications
CREATE POLICY "admins_view_all_notifications" ON public.booking_notification
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Fix admin_manage_user function: uses admin_id but table has admin_user_id
CREATE OR REPLACE FUNCTION public.admin_manage_user(_admin_id uuid, _action text, _user_id uuid, _updates jsonb DEFAULT NULL::jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SET LOCAL row_security = off;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _admin_id AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  CASE _action
    WHEN 'block' THEN
      UPDATE public.profiles SET is_blocked = true WHERE user_id = _user_id;
      INSERT INTO public.admin_audit_log (admin_user_id, action_type, target_user_id, details)
      VALUES (_admin_id, 'block_user', _user_id, jsonb_build_object('action', 'blocked'));

    WHEN 'unblock' THEN
      UPDATE public.profiles SET is_blocked = false WHERE user_id = _user_id;
      INSERT INTO public.admin_audit_log (admin_user_id, action_type, target_user_id, details)
      VALUES (_admin_id, 'unblock_user', _user_id, jsonb_build_object('action', 'unblocked'));

    WHEN 'approve_provider' THEN
      UPDATE public.profiles
      SET approval_status = 'approved', approved_at = now(), approved_by = _admin_id
      WHERE user_id = _user_id;
      INSERT INTO public.admin_audit_log (admin_user_id, action_type, target_user_id)
      VALUES (_admin_id, 'approve_provider', _user_id);

    WHEN 'reject_provider' THEN
      UPDATE public.profiles SET approval_status = 'rejected' WHERE user_id = _user_id;
      INSERT INTO public.admin_audit_log (admin_user_id, action_type, target_user_id)
      VALUES (_admin_id, 'reject_provider', _user_id);

    WHEN 'update_profile' THEN
      UPDATE public.profiles
      SET
        phone = COALESCE((_updates->>'phone')::text, phone),
        address = COALESCE((_updates->>'address')::text, address),
        city = COALESCE((_updates->>'city')::text, city),
        state = COALESCE((_updates->>'state')::text, state),
        zip_code = COALESCE((_updates->>'zip_code')::text, zip_code),
        first_name = COALESCE((_updates->>'first_name')::text, first_name),
        last_name = COALESCE((_updates->>'last_name')::text, last_name),
        display_name = COALESCE((_updates->>'display_name')::text, display_name),
        updated_at = now()
      WHERE user_id = _user_id;
      INSERT INTO public.admin_audit_log (admin_user_id, action_type, target_user_id, details)
      VALUES (_admin_id, 'update_user', _user_id, _updates);

    ELSE
      RAISE EXCEPTION 'Invalid action: %', _action;
  END CASE;

  RETURN jsonb_build_object('success', true);
END;
$$;