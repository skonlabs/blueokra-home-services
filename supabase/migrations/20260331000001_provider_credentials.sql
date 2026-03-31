-- Add provider credential columns to profiles (all nullable for backward compat)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_license text,
  ADD COLUMN IF NOT EXISTS bond_number       text;

-- Update save_profile function to persist business_license and bond_number
CREATE OR REPLACE FUNCTION public.save_profile(
  _user_id uuid,
  _phone text DEFAULT NULL,
  _address text DEFAULT NULL,
  _city text DEFAULT NULL,
  _state text DEFAULT NULL,
  _zip text DEFAULT NULL,
  _first_name text DEFAULT NULL,
  _last_name text DEFAULT NULL,
  _display_name text DEFAULT NULL,
  _profile_photo_url text DEFAULT NULL,
  _company_name text DEFAULT NULL,
  _business_license text DEFAULT NULL,
  _bond_number text DEFAULT NULL,
  _services_offered text[] DEFAULT NULL,
  _approval_status text DEFAULT NULL,
  _phone_verified boolean DEFAULT NULL,
  _venmo_phone text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_row profiles%ROWTYPE;
BEGIN
  SET LOCAL row_security = off;

  INSERT INTO public.profiles (
    user_id, phone, address, city, state, zip_code,
    first_name, last_name, display_name, profile_photo_url,
    company_name, business_license, bond_number,
    services_offered, approval_status, phone_verified,
    venmo_phone, updated_at
  ) VALUES (
    _user_id, _phone, _address, _city, _state, _zip,
    _first_name, _last_name, _display_name, _profile_photo_url,
    _company_name, _business_license, _bond_number,
    _services_offered, _approval_status, _phone_verified,
    _venmo_phone, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    address = COALESCE(EXCLUDED.address, profiles.address),
    city = COALESCE(EXCLUDED.city, profiles.city),
    state = COALESCE(EXCLUDED.state, profiles.state),
    zip_code = COALESCE(EXCLUDED.zip_code, profiles.zip_code),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    profile_photo_url = COALESCE(EXCLUDED.profile_photo_url, profiles.profile_photo_url),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    business_license = COALESCE(EXCLUDED.business_license, profiles.business_license),
    bond_number = COALESCE(EXCLUDED.bond_number, profiles.bond_number),
    services_offered = CASE
      WHEN EXCLUDED.services_offered IS NOT NULL AND array_length(EXCLUDED.services_offered, 1) > 0
      THEN EXCLUDED.services_offered
      ELSE profiles.services_offered
    END,
    approval_status = COALESCE(EXCLUDED.approval_status, profiles.approval_status),
    phone_verified = COALESCE(EXCLUDED.phone_verified, profiles.phone_verified),
    venmo_phone = COALESCE(EXCLUDED.venmo_phone, profiles.venmo_phone),
    updated_at = EXCLUDED.updated_at
  RETURNING * INTO result_row;

  RETURN row_to_json(result_row);
END;
$$;
