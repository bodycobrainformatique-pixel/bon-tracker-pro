-- Create the admin user directly in auth.users table
-- This is a one-time setup for the admin account

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@tracabilite.tn',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Also create the corresponding profile
INSERT INTO public.profiles (user_id, email, role, full_name)
SELECT 
  id,
  'admin@tracabilite.tn',
  'admin',
  'Administrateur Principal'
FROM auth.users 
WHERE email = 'admin@tracabilite.tn';