# Invite Code User Name Display Fix

## Issue Summary
The invite code `NAHQ8H9` shows "No user ID linked" in the frontend even though it has been used by a user with ID `494b957b-ae7b-4a14-87f5-d00428a64f87` and there is a corresponding user profile with the name "Sage".

## Root Cause
The issue is caused by **Row Level Security (RLS)** policies on the `user_profiles` table. The frontend uses the anonymous Supabase key (`VITE_SUPABASE_ANON_KEY`) which doesn't have permission to read from the `user_profiles` table due to RLS restrictions.

## Evidence
1. The invite code data is correct:
   - `invite_codes.used_by = '494b957b-ae7b-4a14-87f5-d00428a64f87'`
   - `invite_codes.is_used = true`

2. The user profile exists:
   - `user_profiles.user_id = '494b957b-ae7b-4a14-87f5-d00428a64f87'`
   - `user_profiles.preferred_name = 'Sage'`
   - `user_profiles.full_name = 'Sage'`

3. RLS is blocking access:
   - Query returns 0 rows for user_profiles table
   - Error: "new row violates row-level security policy for table 'user_profiles'"

## Solution Options

### Option 1: Create RLS Policy (Recommended)
Create a policy that allows reading user profiles for invite code purposes:

```sql
-- Allow reading user profiles when needed for invite codes
CREATE POLICY "Allow reading user profiles for invite codes" ON user_profiles
FOR SELECT USING (true);
```

### Option 2: Use Service Role Key
Update the frontend to use the service role key instead of the anon key for this specific operation:

```typescript
// Create a separate client with service role key
const supabaseService = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);
```

### Option 3: Create a Database Function
Create a PostgreSQL function that bypasses RLS:

```sql
CREATE OR REPLACE FUNCTION get_user_profile_for_invite_code(user_id_param UUID)
RETURNS TABLE(user_id UUID, full_name TEXT, preferred_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT up.user_id, up.full_name, up.preferred_name
  FROM user_profiles up
  WHERE up.user_id = user_id_param;
END;
$$;
```

## Implementation Status
✅ **API Updated**: The API now uses the service role key to fetch user profiles, bypassing RLS restrictions
✅ **Frontend Updated**: The frontend displays user names when available, falls back to "No user ID linked" when not
✅ **Service Role Integration**: Added service role client for user profile queries
✅ **Error Handling**: Added proper error handling for RLS restrictions
✅ **Testing Complete**: Verified that invite code NAHQ8H9 now shows "Sage" as the user name

## Solution Implemented
**Option 2: Service Role Key** - Successfully implemented and tested.

The API now uses the service role key (`SUPABASE_SERVICE_ROLE_KEY`) to fetch user profiles, which bypasses RLS restrictions and allows the frontend to display user names correctly.

## Test Results
✅ Service role can access user profiles (found 5 profiles)
✅ Found target user "Sage" with UUID `494b957b-ae7b-4a14-87f5-d00428a64f87`
✅ Complete flow works: Invite code `NAHQ8H9` now shows "Sage" as the recipient name

## Next Steps
The issue is now fully resolved! The invite code will display the user's name "Sage" instead of "No user ID linked".
