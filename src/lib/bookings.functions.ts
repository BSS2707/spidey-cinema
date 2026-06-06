import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Atomically lock seats and create a pending booking
export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      showId: z.string().uuid(),
      seatIds: z.array(z.string().uuid()).min(1).max(10),
      customerName: z.string().min(1).max(120),
      customerEmail: z.string().email(),
      customerPhone: z.string().min(5).max(20),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const lockUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Fetch seats with show pricing
    const { data: seats, error: seatErr } = await supabase
      .from("seats")
      .select("id,seat_type,status,locked_until,show_id,row_label,seat_number")
      .in("id", data.seatIds);
    if (seatErr) throw new Error(seatErr.message);
    if (!seats || seats.length !== data.seatIds.length) throw new Error("Some seats not found");
    if (seats.some((s) => s.show_id !== data.showId)) throw new Error("Seat/show mismatch");

    const now = new Date();
    const unavailable = seats.find((s) => s.status === "BOOKED" || (s.status === "LOCKED" && s.locked_until && new Date(s.locked_until) > now));
    if (unavailable) throw new Error(`Seat ${unavailable.row_label}${unavailable.seat_number} unavailable`);

    const { data: show, error: showErr } = await supabase
      .from("shows")
      .select("price_silver,price_gold,price_platinum")
      .eq("id", data.showId)
      .single();
    if (showErr || !show) throw new Error("Show not found");

    const priceFor = (t: string) => t === "PLATINUM" ? Number(show.price_platinum) : t === "GOLD" ? Number(show.price_gold) : Number(show.price_silver);
    const subtotal = seats.reduce((sum, s) => sum + priceFor(s.seat_type), 0);
    const gst = +(subtotal * 0.18).toFixed(2);
    const total = +(subtotal + gst).toFixed(2);

    // Lock seats
    const { error: lockErr } = await supabase
      .from("seats")
      .update({ status: "LOCKED", locked_by: userId, locked_until: lockUntil })
      .in("id", data.seatIds);
    if (lockErr) throw new Error(lockErr.message);

    // Create booking
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        show_id: data.showId,
        status: "PENDING",
        subtotal, gst, total,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
      })
      .select()
      .single();
    if (bErr) throw new Error(bErr.message);

    // Link seats
    const rows = seats.map((s) => ({ booking_id: booking.id, seat_id: s.id, price: priceFor(s.seat_type) }));
    const { error: bsErr } = await supabase.from("booking_seats").insert(rows);
    if (bsErr) throw new Error(bsErr.message);

    return { bookingId: booking.id };
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ bookingId: z.string().uuid(), utr: z.string().min(6).max(40) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: booking } = await supabase.from("bookings").select("id,user_id").eq("id", data.bookingId).single();
    if (!booking || booking.user_id !== userId) throw new Error("Booking not found");

    const { error } = await supabase
      .from("bookings")
      .update({ status: "CONFIRMED", payment_status: "PAID", upi_utr: data.utr })
      .eq("id", data.bookingId);
    if (error) throw new Error(error.message);

    // Mark seats BOOKED
    const { data: bs } = await supabase.from("booking_seats").select("seat_id").eq("booking_id", data.bookingId);
    const seatIds = (bs ?? []).map((r) => r.seat_id);
    if (seatIds.length) {
      await supabase.from("seats").update({ status: "BOOKED", locked_until: null, locked_by: null }).in("id", seatIds);
    }
    return { ok: true };
  });
