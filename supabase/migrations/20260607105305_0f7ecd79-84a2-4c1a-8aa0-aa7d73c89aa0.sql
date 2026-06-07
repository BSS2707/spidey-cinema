DROP POLICY IF EXISTS "Anyone views active movies" ON public.movies;

CREATE POLICY "Public can view active movies"
ON public.movies
FOR SELECT
TO anon
USING (is_active);

CREATE POLICY "Signed in users view active movies or admin movies"
ON public.movies
FOR SELECT
TO authenticated
USING (is_active OR public.has_role(auth.uid(), 'admin'));

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;