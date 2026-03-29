-- =============================================================
-- PHASE 1: Enable RLS on all unprotected tables
-- PHASE 2: Add missing indexes on all FK and filter columns
-- PHASE 3: Data integrity (constraints, triggers)
-- =============================================================


-- =============================================
-- PART 1A: RLS — USER TABLES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"   ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_homes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own homes" ON public.user_homes;
CREATE POLICY "Users can manage own homes" ON public.user_homes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL TO authenticated USING (auth.uid() = user_id::uuid) WITH CHECK (auth.uid() = user_id::uuid);

-- Phone verification: service role only — no direct client access
ALTER TABLE public.user_phone_verification ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No direct client access to phone verification" ON public.user_phone_verification;
CREATE POLICY "No direct client access to phone verification" ON public.user_phone_verification FOR ALL TO authenticated USING (false);


-- =============================================
-- PART 1B: RLS — PAYMENT TABLES
-- =============================================

ALTER TABLE public.payment_transaction ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transaction;
CREATE POLICY "Users can view own transactions" ON public.payment_transaction
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_user_id OR auth.uid() = provider_user_id);

ALTER TABLE public.payment_wallet ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.payment_wallet;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.payment_wallet;
CREATE POLICY "Users can view own wallet"   ON public.payment_wallet FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.payment_wallet FOR UPDATE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.payment_wallet_transaction ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.payment_wallet_transaction;
CREATE POLICY "Users can view own wallet transactions" ON public.payment_wallet_transaction
  FOR SELECT TO authenticated
  USING (
    wallet_id IN (SELECT id FROM public.payment_wallet WHERE user_id = auth.uid())
  );

ALTER TABLE public.payment_vendor_payout ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can view own payouts" ON public.payment_vendor_payout;
CREATE POLICY "Providers can view own payouts" ON public.payment_vendor_payout
  FOR SELECT TO authenticated
  USING (auth.uid() = provider_user_id);


-- =============================================
-- PART 1C: RLS — BOOKING WORKFLOW TABLES
-- =============================================

ALTER TABLE public.booking_assignment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can view own assignments" ON public.booking_assignment;
DROP POLICY IF EXISTS "Customers can view assignments for their bookings" ON public.booking_assignment;
CREATE POLICY "Providers can view own assignments" ON public.booking_assignment
  FOR SELECT TO authenticated USING (auth.uid() = provider_user_id);
CREATE POLICY "Customers can view assignments for their bookings" ON public.booking_assignment
  FOR SELECT TO authenticated
  USING (
    service_id IN (SELECT id FROM public.booking_service WHERE customer_user_id = auth.uid())
  );

ALTER TABLE public.booking_lead ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can view own leads" ON public.booking_lead;
CREATE POLICY "Providers can view own leads" ON public.booking_lead
  FOR SELECT TO authenticated USING (auth.uid() = provider_user_id);
DROP POLICY IF EXISTS "Providers can update own leads" ON public.booking_lead;
CREATE POLICY "Providers can update own leads" ON public.booking_lead
  FOR UPDATE TO authenticated USING (auth.uid() = provider_user_id);

ALTER TABLE public.booking_provider_response ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can manage own responses" ON public.booking_provider_response;
CREATE POLICY "Providers can manage own responses" ON public.booking_provider_response
  FOR ALL TO authenticated USING (auth.uid() = provider_user_id) WITH CHECK (auth.uid() = provider_user_id);

ALTER TABLE public.booking_appointment_proposal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view proposals" ON public.booking_appointment_proposal;
DROP POLICY IF EXISTS "Users can create proposals" ON public.booking_appointment_proposal;
CREATE POLICY "Participants can view proposals" ON public.booking_appointment_proposal
  FOR SELECT TO authenticated
  USING (
    auth.uid() = proposed_by
    OR appointment_id IN (
      SELECT id FROM public.booking_appointment
      WHERE customer_user_id = auth.uid() OR provider_user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create proposals" ON public.booking_appointment_proposal
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = proposed_by);

ALTER TABLE public.booking_qr_verification ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view QR verifications" ON public.booking_qr_verification;
CREATE POLICY "Participants can view QR verifications" ON public.booking_qr_verification
  FOR SELECT TO authenticated
  USING (
    appointment_id IN (
      SELECT id FROM public.booking_appointment
      WHERE customer_user_id = auth.uid() OR provider_user_id = auth.uid()
    )
  );

ALTER TABLE public.booking_notification ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.booking_notification;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.booking_notification;
CREATE POLICY "Users can view own notifications"  ON public.booking_notification FOR SELECT TO authenticated USING (auth.uid() = recipient_user_id);
CREATE POLICY "Users can update own notifications" ON public.booking_notification FOR UPDATE TO authenticated USING (auth.uid() = recipient_user_id);


-- =============================================
-- PART 1D: RLS — CHAT & SUPPORT TABLES
-- =============================================

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view chats" ON public.chats;
DROP POLICY IF EXISTS "Users can send chats" ON public.chats;
CREATE POLICY "Participants can view chats" ON public.chats
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send chats" ON public.chats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

ALTER TABLE public.admin_support_ticket ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.admin_support_ticket;
DROP POLICY IF EXISTS "Users can create tickets" ON public.admin_support_ticket;
CREATE POLICY "Users can view own tickets" ON public.admin_support_ticket
  FOR SELECT TO authenticated
  USING (
    sender_email = (SELECT phone FROM public.profiles WHERE user_id = auth.uid())
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = sender_email
  );
CREATE POLICY "Users can create tickets" ON public.admin_support_ticket
  FOR INSERT TO authenticated WITH CHECK (true);


-- =============================================
-- PART 1E: RLS — SYSTEM / ADMIN TABLES
-- =============================================

-- system_logs: only service role can insert; no client read
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only for system logs" ON public.system_logs;
CREATE POLICY "Service role only for system logs" ON public.system_logs FOR ALL TO authenticated USING (false);

-- platform_settings: authenticated users can read; no client writes
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read platform settings" ON public.platform_settings;
CREATE POLICY "Anyone can read platform settings" ON public.platform_settings FOR SELECT TO authenticated USING (true);

-- unsubscribe_list: insert-only from client (email signup); no reads
ALTER TABLE public.unsubscribe_list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert unsubscribes" ON public.unsubscribe_list;
CREATE POLICY "Public can insert unsubscribes" ON public.unsubscribe_list FOR INSERT TO anon, authenticated WITH CHECK (true);


-- =============================================
-- PART 2: INDEXES — ALL FK AND FILTER COLUMNS
-- =============================================

-- booking_service
CREATE INDEX IF NOT EXISTS idx_booking_service_customer    ON public.booking_service(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_booking_service_status      ON public.booking_service(booking_status);
CREATE INDEX IF NOT EXISTS idx_booking_service_type        ON public.booking_service(service_type);
CREATE INDEX IF NOT EXISTS idx_booking_service_created     ON public.booking_service(created_at DESC);

-- booking_appointment (most queried — two actors, date-based)
CREATE INDEX IF NOT EXISTS idx_booking_appt_service        ON public.booking_appointment(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_appt_customer       ON public.booking_appointment(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_booking_appt_provider       ON public.booking_appointment(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_booking_appt_status         ON public.booking_appointment(appointment_status);
CREATE INDEX IF NOT EXISTS idx_booking_appt_date           ON public.booking_appointment(appointment_date);
CREATE INDEX IF NOT EXISTS idx_booking_appt_provider_status ON public.booking_appointment(provider_user_id, appointment_status);

-- payment_transaction (earnings queries)
CREATE INDEX IF NOT EXISTS idx_payment_tx_provider  ON public.payment_transaction(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_customer  ON public.payment_transaction(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status    ON public.payment_transaction(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_created   ON public.payment_transaction(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tx_stripe
  ON public.payment_transaction(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- user_roles (fetched on every auth state change)
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);

-- user_homes
CREATE INDEX IF NOT EXISTS idx_user_homes_user    ON public.user_homes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_homes_primary ON public.user_homes(user_id, is_primary);

-- booking_notification
CREATE INDEX IF NOT EXISTS idx_notif_recipient ON public.booking_notification(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread    ON public.booking_notification(recipient_user_id, is_read) WHERE is_read = false;

-- booking_assignment
CREATE INDEX IF NOT EXISTS idx_assignment_provider ON public.booking_assignment(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_service  ON public.booking_assignment(service_id);

-- booking_lead
CREATE INDEX IF NOT EXISTS idx_lead_provider ON public.booking_lead(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_service  ON public.booking_lead(service_id);
CREATE INDEX IF NOT EXISTS idx_lead_status   ON public.booking_lead(lead_status);

-- booking_provider_response
CREATE INDEX IF NOT EXISTS idx_provider_response_service  ON public.booking_provider_response(service_id);
CREATE INDEX IF NOT EXISTS idx_provider_response_provider ON public.booking_provider_response(provider_user_id);

-- chats
CREATE INDEX IF NOT EXISTS idx_chat_sender      ON public.chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_receiver    ON public.chats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_appointment ON public.chats(appointment_id);
CREATE INDEX IF NOT EXISTS idx_chat_created     ON public.chats(created_at DESC);

-- property tables
CREATE INDEX IF NOT EXISTS idx_appliances_home ON public.property_appliances(home_id);
CREATE INDEX IF NOT EXISTS idx_appliances_user ON public.property_appliances(user_id);
CREATE INDEX IF NOT EXISTS idx_warranties_home ON public.property_warranties(home_id);
CREATE INDEX IF NOT EXISTS idx_warranties_user ON public.property_warranties(user_id);

-- reviews (prevent duplicates, speed up provider lookups)
CREATE INDEX IF NOT EXISTS idx_reviews_provider  ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_homeowner ON public.reviews(homeowner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_no_duplicate
  ON public.reviews(homeowner_id, appointment_id)
  WHERE appointment_id IS NOT NULL;

-- loyalty
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user    ON public.loyalty_point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_created ON public.loyalty_point_transactions(created_at DESC);

-- payment_wallet
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_user ON public.payment_wallet(user_id);

-- payment_wallet_transaction
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet  ON public.payment_wallet_transaction(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON public.payment_wallet_transaction(created_at DESC);

-- payment_vendor_payout
CREATE INDEX IF NOT EXISTS idx_payout_provider ON public.payment_vendor_payout(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_payout_service  ON public.payment_vendor_payout(service_id);

-- disputes
CREATE INDEX IF NOT EXISTS idx_disputes_filed_by    ON public.disputes(filed_by);
CREATE INDEX IF NOT EXISTS idx_disputes_appointment ON public.disputes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status      ON public.disputes(dispute_status);


-- =============================================
-- PART 3: DATA INTEGRITY
-- =============================================

-- 3a. Restore booking_status check constraint (was dropped earlier)
-- First normalize any legacy values
UPDATE public.booking_service
  SET booking_status = 'pending'
  WHERE booking_status NOT IN ('pending','active','scheduled','confirmed','in_progress','completed','cancelled','disputed');

ALTER TABLE public.booking_service DROP CONSTRAINT IF EXISTS services_status_check;
ALTER TABLE public.booking_service ADD CONSTRAINT booking_status_check
  CHECK (booking_status IN ('pending','active','scheduled','confirmed','in_progress','completed','cancelled','disputed'));

-- 3b. Add updated_at auto-trigger for booking_service (missing)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_booking_service_updated_at ON public.booking_service;
CREATE TRIGGER trg_booking_service_updated_at
  BEFORE UPDATE ON public.booking_service
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_booking_appointment_updated_at ON public.booking_appointment;
-- booking_appointment has no updated_at column — skip

DROP TRIGGER IF EXISTS trg_payment_transaction_updated_at ON public.payment_transaction;
CREATE TRIGGER trg_payment_transaction_updated_at
  BEFORE UPDATE ON public.payment_transaction
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_homes_updated_at ON public.user_homes;
CREATE TRIGGER trg_user_homes_updated_at
  BEFORE UPDATE ON public.user_homes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3c. Seed platform_settings with fee configuration
-- (prevents hardcoded percentages in source code)
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('economics_tiers', '[
    {"max_price": 150,  "provider_pct": 0.80},
    {"max_price": 400,  "provider_pct": 0.75},
    {"max_price": null, "provider_pct": 0.70}
  ]'::jsonb, 'Provider payout % tiers by customer price bracket'),
  ('platform_fee_pct',      '0.12'::jsonb,  'Platform fee % deducted from provider gross earnings'),
  ('card_processing_fee_pct','0.0275'::jsonb,'Credit card surcharge % added to customer total'),
  ('min_payout_amount',      '100'::jsonb,   'Minimum wallet balance (USD) to request payout'),
  ('service_area_states',    '["WA"]'::jsonb,'States where service is currently available')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description;
