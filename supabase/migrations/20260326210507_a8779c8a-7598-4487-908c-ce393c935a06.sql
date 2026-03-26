
-- Add RLS policies for tables missing them

-- admin_audit_log: only admins should see
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "System can insert audit logs" ON public.admin_audit_log FOR INSERT WITH CHECK (true);

-- reviews: public read, users can create their own
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = homeowner_id);
CREATE POLICY "Users can update their reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = homeowner_id);

-- service_addons: public read (pricing data)
CREATE POLICY "Anyone can view addons" ON public.service_addons FOR SELECT USING (true);

-- service_base_pricing: public read
CREATE POLICY "Anyone can view pricing" ON public.service_base_pricing FOR SELECT USING (true);

-- service_frequencies: public read
CREATE POLICY "Anyone can view frequencies" ON public.service_frequencies FOR SELECT USING (true);

-- size_multipliers: public read
CREATE POLICY "Anyone can view multipliers" ON public.size_multipliers FOR SELECT USING (true);

-- pricing_surcharges: public read
CREATE POLICY "Anyone can view surcharges" ON public.pricing_surcharges FOR SELECT USING (true);
