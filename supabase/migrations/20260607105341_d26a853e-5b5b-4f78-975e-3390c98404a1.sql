CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;

DROP POLICY IF EXISTS "Admins manage movies" ON public.movies;
DROP POLICY IF EXISTS "Signed in users view active movies or admin movies" ON public.movies;
CREATE POLICY "Admins manage movies"
ON public.movies
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Signed in users view active movies or admin movies"
ON public.movies
FOR SELECT
TO authenticated
USING (is_active OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage shows" ON public.shows;
DROP POLICY IF EXISTS "Public can view active shows" ON public.shows;
CREATE POLICY "Admins manage shows"
ON public.shows
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can view active shows"
ON public.shows
FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.movies m WHERE m.id = shows.movie_id AND m.is_active));

DROP POLICY IF EXISTS "Admins manage seats" ON public.seats;
DROP POLICY IF EXISTS "Users lock own seats" ON public.seats;
CREATE POLICY "Admins manage seats"
ON public.seats
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users lock own seats"
ON public.seats
FOR UPDATE
TO authenticated
USING ((auth.uid() = locked_by) OR (status = 'AVAILABLE'::seat_status) OR private.has_role(auth.uid(), 'admin'))
WITH CHECK ((auth.uid() = locked_by) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users update own bookings" ON public.bookings;
CREATE POLICY "Users view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'))
WITH CHECK ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage booking seats" ON public.booking_seats;
DROP POLICY IF EXISTS "Users view own booking seats" ON public.booking_seats;
CREATE POLICY "Admins manage booking seats"
ON public.booking_seats
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own booking seats"
ON public.booking_seats
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_seats.booking_id AND ((b.user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'))));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM service_role;