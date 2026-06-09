
-- 1) Bookings: restrict authenticated UPDATE to contact-info columns only
REVOKE UPDATE ON public.bookings FROM authenticated;
GRANT UPDATE (customer_name, customer_email, customer_phone, updated_at) ON public.bookings TO authenticated;

-- 2) Seats: hide locked_by from authenticated users (service_role retains full access)
REVOKE SELECT ON public.seats FROM authenticated;
GRANT SELECT (id, show_id, row_label, seat_number, seat_type, status, locked_until) ON public.seats TO authenticated;

REVOKE SELECT ON public.seats FROM anon;
GRANT SELECT (id, show_id, row_label, seat_number, seat_type, status, locked_until) ON public.seats TO anon;
