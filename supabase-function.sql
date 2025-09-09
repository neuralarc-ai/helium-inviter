-- Create a function to get invite codes with user information
-- This function can access both invite_codes and auth.users tables

CREATE OR REPLACE FUNCTION get_invite_codes_with_users()
RETURNS TABLE (
  id uuid,
  code character varying,
  is_used boolean,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz,
  expires_at timestamptz,
  max_uses integer,
  current_uses integer,
  recipient_email text,
  recipient_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ic.id,
    ic.code::text,
    ic.is_used,
    ic.used_by,
    ic.used_at,
    ic.created_at,
    ic.expires_at,
    ic.max_uses,
    ic.current_uses,
    CASE 
      WHEN ic.used_by IS NOT NULL THEN au.email
      ELSE NULL
    END as recipient_email,
    CASE 
      WHEN ic.used_by IS NOT NULL THEN COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
      )
      ELSE NULL
    END as recipient_name
  FROM invite_codes ic
  LEFT JOIN auth.users au ON ic.used_by = au.id
  ORDER BY ic.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_invite_codes_with_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_invite_codes_with_users() TO anon;
