-- Fix infinite recursion: drop the self-referencing admin policy on user_roles
-- and replace it with one using the has_role() security definer function

DROP POLICY IF EXISTS "admins_view_all_roles" ON public.user_roles;

CREATE POLICY "admins_view_all_roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Also fix the system_logs check constraint that rejects 'mutation_error'
ALTER TABLE public.system_logs DROP CONSTRAINT IF EXISTS system_logs_log_type_check;
