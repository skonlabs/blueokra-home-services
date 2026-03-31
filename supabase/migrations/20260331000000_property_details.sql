-- Add property detail columns to user_homes (all nullable for backward compat)
ALTER TABLE public.user_homes
  ADD COLUMN IF NOT EXISTS bedrooms       smallint,
  ADD COLUMN IF NOT EXISTS bathrooms      numeric(3,1),
  ADD COLUMN IF NOT EXISTS sqft           integer,
  ADD COLUMN IF NOT EXISTS lot_size_sqft  integer,
  ADD COLUMN IF NOT EXISTS house_type     text,
  ADD COLUMN IF NOT EXISTS flooring       text,
  ADD COLUMN IF NOT EXISTS has_basement   boolean,
  ADD COLUMN IF NOT EXISTS has_fireplace  boolean,
  ADD COLUMN IF NOT EXISTS heating_type   text,
  ADD COLUMN IF NOT EXISTS parcel_number  text,
  ADD COLUMN IF NOT EXISTS roof_type      text;

-- Link bookings to a specific home so providers can see property details
ALTER TABLE public.booking_service
  ADD COLUMN IF NOT EXISTS home_id uuid REFERENCES public.user_homes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_booking_service_home_id ON public.booking_service(home_id);
