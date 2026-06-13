import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { MagneticButton } from "@/components/MagneticButton";
import { createBooking } from "@/lib/bookings.functions";
import { validateCoupon } from "@/lib/coupons.functions";

import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/booking/$showId")({
  loader: async ({ params }) => {
    const { data: show, error } = await supabase
      .from("shows")
      .select("id,starts_at,screen_name,price_silver,price_gold,price_platinum,seats_per_row,movies(title,poster_url,slug)")
      .eq("id", params.showId)
      .maybeSingle();
    if (error) throw error;
    if (!show) throw notFound();
    return { show };
  },
  head: () => ({ meta: [{ title: "Choose Your Seats — Spidey Cinema" }] }),
  component: BookingPage,
});

type Seat = { id: string; row_label: string; seat_number: number; seat_type: "PLATINUM" | "GOLD" | "SILVER"; status: "AVAILABLE" | "LOCKED" | "BOOKED"; locked_until: string | null };

function BookingPage() {
  const { show } = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const create = useServerFn(createBooking);
  const validate = useServerFn(validateCoupon);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customer, setCustomer] = useState({ name: user.user_metadata?.full_name ?? "", email: user.email ?? "", phone: user.user_metadata?.phone ?? "" });
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("seats").select("id,row_label,seat_number,seat_type,status,locked_until").eq("show_id", show.id).order("row_label").order("seat_number");
      setSeats((data ?? []) as Seat[]);
    })();
  }, [show.id]);

  const priceFor = (t: string) => t === "PLATINUM" ? Number(show.price_platinum) : t === "GOLD" ? Number(show.price_gold) : Number(show.price_silver);
  const subtotal = seats.filter((s) => selected.has(s.id)).reduce((sum, s) => sum + priceFor(s.seat_type), 0);
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const discounted = Math.max(0, subtotal - discount);
  const gst = +(discounted * 0.18).toFixed(2);
  const total = +(discounted + gst).toFixed(2);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    if (subtotal === 0) return toast.error("Pick seats first");
    setCouponLoading(true);
    try {
      const c = await validate({ data: { code: couponInput, subtotal } });
      setCoupon({ code: c.code, discount: c.discount });
      toast.success(`Coupon ${c.code} applied`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Invalid coupon"); setCoupon(null); }
    finally { setCouponLoading(false); }
  };

  // Re-validate discount when subtotal changes
  useEffect(() => {
    if (!coupon) return;
    if (subtotal === 0) { setCoupon(null); return; }
    validate({ data: { code: coupon.code, subtotal } })
      .then((c) => setCoupon({ code: c.code, discount: c.discount }))
      .catch(() => setCoupon(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);


  const toggle = (s: Seat) => {
    if (s.status === "BOOKED") return;
    const now = new Date();
    if (s.status === "LOCKED" && s.locked_until && new Date(s.locked_until) > now) return;
    const next = new Set(selected);
    next.has(s.id) ? next.delete(s.id) : next.add(s.id);
    if (next.size > 10) { toast.error("Max 10 seats per booking"); return; }
    setSelected(next);
  };

  const handleProceed = async () => {
    if (selected.size === 0) return toast.error("Pick at least one seat");
    if (!customer.name || !customer.email || !customer.phone) return toast.error("Fill in your details");
    setLoading(true);
    try {
      const res = await create({ data: { showId: show.id, seatIds: [...selected], customerName: customer.name, customerEmail: customer.email, customerPhone: customer.phone, couponCode: coupon?.code ?? null } });
      navigate({ to: "/payment/$bookingId", params: { bookingId: res.bookingId } });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  // Group rows
  const rowMap = new Map<string, Seat[]>();
  seats.forEach((s) => { if (!rowMap.has(s.row_label)) rowMap.set(s.row_label, []); rowMap.get(s.row_label)!.push(s); });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20 grid lg:grid-cols-[1fr_320px] gap-10">
        <div>
          <p className="font-display tracking-[0.4em] text-accent text-xs">{(show.movies as any)?.title}</p>
          <h1 className="font-display text-4xl tracking-wider mt-1">Pick Your Seats</h1>
          <p className="text-muted-foreground mt-1">{show.screen_name} • {new Date(show.starts_at).toLocaleString()}</p>

          <div className="mt-10 mx-auto max-w-2xl">
            <div className="relative h-2 mb-12 rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }}>
              <p className="absolute -top-6 left-1/2 -translate-x-1/2 font-display tracking-[0.5em] text-xs text-muted-foreground">SCREEN</p>
            </div>

            {seats.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <p>No seats configured yet for this show. Admin needs to generate the seat grid.</p>
              </div>
            )}

            <div className="space-y-3">
              {[...rowMap.entries()].map(([row, rseats]) => (
                <div key={row} className="flex items-center gap-3 justify-center">
                  <span className="font-display text-muted-foreground w-6 text-center">{row}</span>
                  <div className="flex gap-1.5">
                    {rseats.map((s) => {
                      const isSelected = selected.has(s.id);
                      const isBooked = s.status === "BOOKED";
                      const isLocked = s.status === "LOCKED" && s.locked_until && new Date(s.locked_until) > new Date();
                      const color = s.seat_type === "PLATINUM" ? "border-accent" : s.seat_type === "GOLD" ? "border-yellow-500/60" : "border-muted-foreground/40";
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggle(s)}
                          disabled={isBooked || !!isLocked}
                          data-cursor="hover"
                          aria-label={`${s.row_label}${s.seat_number}`}
                          className={`w-7 h-7 rounded-sm border text-[10px] font-display transition
                            ${isSelected ? "bg-primary border-primary text-primary-foreground" : `bg-card ${color}`}
                            ${isBooked ? "opacity-20 cursor-not-allowed" : ""}
                            ${isLocked ? "opacity-40 cursor-not-allowed" : ""}
                          `}
                        >{s.seat_number}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
              <Legend color="bg-card border-accent" label={`Platinum ₹${Number(show.price_platinum).toFixed(0)}`} />
              <Legend color="bg-card border-yellow-500/60" label={`Gold ₹${Number(show.price_gold).toFixed(0)}`} />
              <Legend color="bg-card border-muted-foreground/40" label={`Silver ₹${Number(show.price_silver).toFixed(0)}`} />
              <Legend color="bg-primary border-primary" label="Selected" />
              <Legend color="opacity-20 bg-card" label="Booked" />
            </div>
          </div>
        </div>

        <aside className="glass-card rounded-xl p-6 h-fit sticky top-24">
          <h3 className="font-display text-xl tracking-wider mb-4">Your Booking</h3>
          <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2 rounded bg-input border border-border mb-2" />
          <input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="Email" type="email" className="w-full px-3 py-2 rounded bg-input border border-border mb-2" />
          <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Phone" className="w-full px-3 py-2 rounded bg-input border border-border mb-4" />
          <div className="text-sm text-muted-foreground space-y-1 border-t border-border pt-4">
            <div className="flex justify-between"><span>Seats</span><span>{selected.size}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>GST (18%)</span><span>₹{gst.toFixed(2)}</span></div>
            <div className="flex justify-between font-display text-foreground text-xl pt-2"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>
          <MagneticButton onClick={handleProceed} disabled={loading || selected.size === 0} className="w-full mt-6">
            {loading ? "..." : "Proceed to Payment"}
          </MagneticButton>
        </aside>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-2"><span className={`w-4 h-4 rounded-sm border ${color}`} />{label}</span>;
}
