
CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone views seats" ON public.seats;
CREATE POLICY "Authenticated views seats" ON public.seats
  FOR SELECT TO authenticated
  USING (true);
REVOKE SELECT ON public.seats FROM anon;

REVOKE UPDATE ON public.bookings FROM authenticated;
GRANT UPDATE (customer_name, customer_email, customer_phone, updated_at)
  ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
