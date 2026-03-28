CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile only; role selection happens in the app's RegistrationFlow
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;