-- Auto-create user profile when a new user signs up
-- This trigger runs after a new user is created in auth.users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, full_name, role, tier, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'free_user',
    'free',
    NOW()
  );
  
  -- Insert into loyalty_profiles table
  INSERT INTO public.loyalty_profiles (
    customer_id, 
    clinic_id, 
    points_balance, 
    tier, 
    member_since, 
    created_at
  )
  VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000000', -- Default clinic or null
    0,
    'bronze',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Handle user metadata updates
CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update users table with metadata changes
  UPDATE public.users
  SET 
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{phone}',
      to_jsonb(NEW.raw_user_meta_data->>'phone')
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for metadata updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_user_metadata_update();
