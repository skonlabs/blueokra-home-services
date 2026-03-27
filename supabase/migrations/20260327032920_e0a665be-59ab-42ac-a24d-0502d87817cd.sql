
-- =============================================
-- SEED: service_frequencies
-- =============================================
INSERT INTO public.service_frequencies (frequency_key, frequency_label, services_per_year) VALUES
  ('weekly', 'Weekly', 52),
  ('biweekly', 'Bi-weekly', 26),
  ('monthly', 'Monthly', 12),
  ('quarterly', 'Quarterly', 4),
  ('one-time', 'One-time', 1);

-- =============================================
-- SEED: size_multipliers
-- =============================================
INSERT INTO public.size_multipliers (size_key, multiplier) VALUES
  ('under_1000', 0.8),
  ('1000_2000', 1.0),
  ('2000_3000', 1.3),
  ('over_3000', 1.6);

-- =============================================
-- SEED: service_base_pricing
-- =============================================
-- House Cleaning (per-room based, stored as reference rates)
INSERT INTO public.service_base_pricing (service_type, package_name, price, pricing_key) VALUES
  ('house_cleaning', 'Standard - Bedroom', 15, 'bedroom_standard'),
  ('house_cleaning', 'Premium - Bedroom', 18.75, 'bedroom_premium'),
  ('house_cleaning', 'Ultimate - Bedroom', 22.50, 'bedroom_ultimate'),
  ('house_cleaning', 'Standard - Bathroom', 25, 'bathroom_standard'),
  ('house_cleaning', 'Premium - Bathroom', 31.25, 'bathroom_premium'),
  ('house_cleaning', 'Ultimate - Bathroom', 37.50, 'bathroom_ultimate'),
  ('house_cleaning', 'Standard - Bonus Room', 15, 'bonus_standard'),
  ('house_cleaning', 'Premium - Bonus Room', 18.75, 'bonus_premium'),
  ('house_cleaning', 'Ultimate - Bonus Room', 22.50, 'bonus_ultimate'),
  ('house_cleaning', 'Standard - Kitchen', 60, 'kitchen_standard'),
  ('house_cleaning', 'Premium - Kitchen', 75, 'kitchen_premium'),
  ('house_cleaning', 'Ultimate - Kitchen', 90, 'kitchen_ultimate');

-- Lawn Care by yard size
INSERT INTO public.service_base_pricing (service_type, package_name, price, pricing_key) VALUES
  ('lawn', 'Standard', 75, 'lawn_standard_lt1000'),
  ('lawn', 'Premium', 125, 'lawn_premium_lt1000'),
  ('lawn', 'Ultimate', 200, 'lawn_ultimate_lt1000'),
  ('lawn', 'Standard', 100, 'lawn_standard_lt1500'),
  ('lawn', 'Premium', 150, 'lawn_premium_lt1500'),
  ('lawn', 'Ultimate', 225, 'lawn_ultimate_lt1500'),
  ('lawn', 'Standard', 125, 'lawn_standard_lt2000'),
  ('lawn', 'Premium', 175, 'lawn_premium_lt2000'),
  ('lawn', 'Ultimate', 250, 'lawn_ultimate_lt2000'),
  ('lawn', 'Standard', 150, 'lawn_standard_lt3000'),
  ('lawn', 'Premium', 200, 'lawn_premium_lt3000'),
  ('lawn', 'Ultimate', 275, 'lawn_ultimate_lt3000'),
  ('lawn', 'Standard', 175, 'lawn_standard_lt4000'),
  ('lawn', 'Premium', 225, 'lawn_premium_lt4000'),
  ('lawn', 'Ultimate', 300, 'lawn_ultimate_lt4000'),
  ('lawn', 'Standard', 200, 'lawn_standard_lt5000'),
  ('lawn', 'Premium', 250, 'lawn_premium_lt5000'),
  ('lawn', 'Ultimate', 325, 'lawn_ultimate_lt5000'),
  ('lawn', 'Standard', 250, 'lawn_standard_lt10000'),
  ('lawn', 'Premium', 300, 'lawn_premium_lt10000'),
  ('lawn', 'Ultimate', 375, 'lawn_ultimate_lt10000'),
  ('lawn', 'Standard', 400, 'lawn_standard_gt10000'),
  ('lawn', 'Premium', 450, 'lawn_premium_gt10000'),
  ('lawn', 'Ultimate', 500, 'lawn_ultimate_gt10000');

-- Gutter Cleaning
INSERT INTO public.service_base_pricing (service_type, package_name, price, pricing_key) VALUES
  ('gutter', 'Standard - 1 Story', 125, 'gutter_standard_1'),
  ('gutter', 'Premium - 1 Story', 225, 'gutter_premium_1'),
  ('gutter', 'Ultimate - 1 Story', 300, 'gutter_ultimate_1'),
  ('gutter', 'Standard - 2 Stories', 150, 'gutter_standard_2'),
  ('gutter', 'Premium - 2 Stories', 300, 'gutter_premium_2'),
  ('gutter', 'Ultimate - 2 Stories', 400, 'gutter_ultimate_2'),
  ('gutter', 'Standard - 3 Stories', 200, 'gutter_standard_3'),
  ('gutter', 'Premium - 3 Stories', 400, 'gutter_premium_3'),
  ('gutter', 'Ultimate - 3 Stories', 500, 'gutter_ultimate_3');

-- Roof Cleaning
INSERT INTO public.service_base_pricing (service_type, package_name, price, pricing_key) VALUES
  ('roof', 'Under 1500 sq ft', 150, 'roof_lt1500'),
  ('roof', '1500-2000 sq ft', 200, 'roof_1500_2000'),
  ('roof', '2000-2500 sq ft', 250, 'roof_2000_2500'),
  ('roof', '2500-4000 sq ft', 300, 'roof_2500_4000'),
  ('roof', '4000-5000 sq ft', 350, 'roof_4000_5000'),
  ('roof', 'Over 5000 sq ft', 500, 'roof_gt5000');

-- Electrical
INSERT INTO public.service_base_pricing (service_type, package_name, price, pricing_key) VALUES
  ('electrical', 'Standard', 150, 'electrical_standard'),
  ('electrical', 'Premium', 250, 'electrical_premium'),
  ('electrical', 'Ultimate', 400, 'electrical_ultimate');

-- Pressure Washing
INSERT INTO public.service_base_pricing (service_type, package_name, price, pricing_key) VALUES
  ('pressure', 'Standard', 180, 'pressure_standard'),
  ('pressure', 'Premium', 280, 'pressure_premium'),
  ('pressure', 'Ultimate', 400, 'pressure_ultimate');

-- Backwater Testing
INSERT INTO public.service_base_pricing (service_type, package_name, price, pricing_key) VALUES
  ('backwater', 'Base Device', 100, 'backwater_base'),
  ('backwater', 'Additional Device', 50, 'backwater_additional');

-- Duct Cleaning
INSERT INTO public.service_base_pricing (service_type, package_name, price, pricing_key) VALUES
  ('duct', 'Base (up to 10 vents)', 200, 'duct_base'),
  ('duct', 'Additional Vent', 25, 'duct_additional_vent');

-- Fence Installation
INSERT INTO public.service_base_pricing (service_type, package_name, price, pricing_key) VALUES
  ('fence', 'Standard - Per Linear Ft', 50, 'fence_standard_plf'),
  ('fence', 'Premium - Per Linear Ft', 75, 'fence_premium_plf'),
  ('fence', 'Ultimate - Per Linear Ft', 100, 'fence_ultimate_plf');

-- =============================================
-- SEED: service_addons
-- =============================================
-- House Cleaning add-ons
INSERT INTO public.service_addons (service_type, addon_name, price, pricing_key, description) VALUES
  ('house_cleaning', 'Inside Oven Cleaning', 20, 'oven_cleaning', 'Deep clean inside oven'),
  ('house_cleaning', 'Inside Refrigerator Cleaning', 25, 'fridge_cleaning', 'Deep clean inside refrigerator'),
  ('house_cleaning', 'Garage Cleaning', 75, 'garage_cleaning', 'Full garage cleaning'),
  ('house_cleaning', 'Carpet Stain Removal', 50, 'carpet_stain', 'Professional carpet stain removal');

-- Lawn Care add-ons (size-dependent, stored as base price - smallest tier)
INSERT INTO public.service_addons (service_type, addon_name, price, pricing_key, description) VALUES
  ('lawn', 'Aeration', 100, 'aeration_lt1000', 'Core aeration - under 1000 sq ft'),
  ('lawn', 'Overseeding', 75, 'overseeding_lt1000', 'Overseeding - under 1000 sq ft'),
  ('lawn', 'Fertilization', 50, 'fertilization_lt1000', 'Fertilization - under 1000 sq ft'),
  ('lawn', 'Bush Trimming', 15, 'bush_trimming', '$15 per bush');

-- Gutter add-ons
INSERT INTO public.service_addons (service_type, addon_name, price, pricing_key, description) VALUES
  ('gutter', 'Downspout Cleaning', 25, 'downspout_cleaning', 'Clean all downspouts'),
  ('gutter', 'Gutter Guard Installation', 100, 'gutter_guard', '$8/linear ft (default $100)'),
  ('gutter', 'Minor Repairs', 75, 'gutter_repairs', 'Minor gutter repairs');

-- Roof add-ons
INSERT INTO public.service_addons (service_type, addon_name, price, pricing_key, description) VALUES
  ('roof', 'Moss/Algae Removal - Light', 50, 'moss_light', 'Light moss/algae removal'),
  ('roof', 'Moss/Algae Removal - Moderate', 100, 'moss_moderate', 'Moderate moss/algae removal'),
  ('roof', 'Moss/Algae Removal - Heavy', 250, 'moss_heavy', 'Heavy moss/algae removal'),
  ('roof', 'Moss/Algae Protection', 50, 'moss_protection', 'Preventive moss/algae treatment');

-- Backwater add-ons
INSERT INTO public.service_addons (service_type, addon_name, price, pricing_key, description) VALUES
  ('backwater', 'Device Repair', 150, 'backwater_repair', 'Backwater device repair'),
  ('backwater', 'Certification Filing', 25, 'backwater_cert', 'Municipal certification filing'),
  ('backwater', 'Emergency Same-Day Service', 100, 'backwater_emergency', 'Same-day expedited service');

-- Duct add-ons
INSERT INTO public.service_addons (service_type, addon_name, price, pricing_key, description) VALUES
  ('duct', 'Dryer Vent Cleaning', 100, 'dryer_vent', 'Professional dryer vent cleaning');

-- Fence add-ons
INSERT INTO public.service_addons (service_type, addon_name, price, pricing_key, description) VALUES
  ('fence', 'Weatherproof Coating', 100, 'fence_weatherproof', 'Weather protection coating');

-- =============================================
-- SEED: pricing_surcharges
-- =============================================
-- House Cleaning surcharges
INSERT INTO public.pricing_surcharges (service_type, surcharge_name, surcharge_type, value, condition_key, condition_value, description) VALUES
  ('house_cleaning', 'First-Time Surcharge', 'percentage', 50, 'is_first_time', 'true', '50% of base price for first-time customers');

-- Lawn Care surcharges
INSERT INTO public.pricing_surcharges (service_type, surcharge_name, surcharge_type, value, condition_key, condition_value, description) VALUES
  ('lawn', 'First-Time Surcharge', 'percentage', 50, 'is_first_time', 'true', '50% of base price for first-time customers'),
  ('lawn', 'Grass 6-12 Inches', 'percentage', 50, 'grass_height', '6_12', '50% surcharge for grass 6-12 inches'),
  ('lawn', 'Grass 12+ Inches', 'percentage', 100, 'grass_height', '12_plus', '100% surcharge for grass over 12 inches'),
  ('lawn', 'Little Weed', 'fixed', 25, 'weed_level', 'little', 'Minor weed treatment'),
  ('lawn', 'More Weed', 'fixed', 50, 'weed_level', 'more', 'Moderate weed treatment'),
  ('lawn', 'Lots of Weed', 'fixed', 100, 'weed_level', 'lots', 'Heavy weed treatment');

-- Gutter surcharges
INSERT INTO public.pricing_surcharges (service_type, surcharge_name, surcharge_type, value, condition_key, condition_value, description) VALUES
  ('gutter', 'Moderately Clogged', 'fixed', 25, 'condition', 'moderate', 'Additional charge for moderate clogging'),
  ('gutter', 'Heavily Clogged', 'fixed', 50, 'condition', 'heavy', 'Additional charge for heavy clogging'),
  ('gutter', 'Needs Repair', 'fixed', 100, 'condition', 'repair', 'Additional charge when repairs needed');

-- Fence surcharges
INSERT INTO public.pricing_surcharges (service_type, surcharge_name, surcharge_type, value, condition_key, condition_value, description) VALUES
  ('fence', 'Door Surcharge', 'fixed', 50, 'has_door', 'true', '$50 per door'),
  ('fence', '8ft Height', 'per_unit', 10, 'height', '8ft', '+$10/linear ft for 8ft height'),
  ('fence', 'Steep Terrain', 'per_unit', 10, 'terrain', 'steep', '+$10/linear ft for steep terrain'),
  ('fence', 'Rocky Terrain', 'per_unit', 20, 'terrain', 'rocky', '+$20/linear ft for rocky terrain'),
  ('fence', 'Repair Job', 'percentage', -50, 'job_type', 'repair', '50% of all costs for repair jobs');

-- Pressure Washing surcharges
INSERT INTO public.pricing_surcharges (service_type, surcharge_name, surcharge_type, value, condition_key, condition_value, description) VALUES
  ('pressure', 'First-Time Surcharge', 'percentage', 50, 'is_first_time', 'true', '50% of base price for first-time customers');
