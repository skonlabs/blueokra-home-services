ALTER TABLE public.user_homes
  ADD COLUMN IF NOT EXISTS bedrooms integer,
  ADD COLUMN IF NOT EXISTS bathrooms numeric,
  ADD COLUMN IF NOT EXISTS sqft integer,
  ADD COLUMN IF NOT EXISTS lot_size_sqft integer,
  ADD COLUMN IF NOT EXISTS house_type text,
  ADD COLUMN IF NOT EXISTS flooring text,
  ADD COLUMN IF NOT EXISTS has_basement boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_fireplace boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS heating_type text,
  ADD COLUMN IF NOT EXISTS roof_type text,
  ADD COLUMN IF NOT EXISTS parcel_number text;