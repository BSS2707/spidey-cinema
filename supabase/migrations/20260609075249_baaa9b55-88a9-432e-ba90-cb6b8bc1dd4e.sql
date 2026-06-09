
-- 1. Column-level UPDATE grants on bookings: revoke broad update, grant only contact fields
REVOKE UPDATE ON public.bookings FROM authenticated;
GRANT UPDATE (customer_name, customer_email, customer_phone, updated_at) ON public.bookings TO authenticated;

-- 2. Drop duplicate has_role in public schema (private.has_role is the canonical one used by policies)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 3. Remove overly-permissive "Anyone views shows" policy; keep "Public can view active shows"
DROP POLICY IF EXISTS "Anyone views shows" ON public.shows;
