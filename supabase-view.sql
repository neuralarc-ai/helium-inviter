-- Create a view to get invite codes with user information
-- This is more reliable than a function for type matching

CREATE OR REPLACE VIEW invite_codes_with_users AS
SELECT 
  ic.id,
  ic.code,
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
LEFT JOIN auth.users au ON ic.used_by = au.id;

-- Grant access to the view
GRANT SELECT ON invite_codes_with_users TO authenticated;
GRANT SELECT ON invite_codes_with_users TO anon;
