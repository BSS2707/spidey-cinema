import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { MagneticButton } from "@/components/MagneticButton";
import { confirmPayment } from "@/lib/bookings.functions";
import { toast } from "sonner";

const UPI_VPA = "9998106880@fam";
const UPI_NAME = "Spidey Cinema";

export const Route = createFileRoute("/_authenticated/payment/$bookingId")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("bookings")
      .select("id,total,status,payment_status,upi_utr,shows(starts_at,screen_name,movies(title))")
      .eq("id", params.bookingId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { booking: data };
  },
  head: () => ({ meta: [{ title: "Payment — Spidey Cinema" }] }),
  component: PaymentPage,
});

function PaymentPage() {
  const { booking } = Route.useLoaderData();
  const navigate = useNavigate();
  const confirm = useServerFn(confirmPayment);
  const [qr, setQr] = useState("");
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);

  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_VPA)}&pn=${encodeURIComponent(UPI_NAME)}&am=${Number(booking.total).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Spidey-" + booking.id.slice(0, 8))}`;

  useEffect(() => {
    QRCode.toDataURL(upiUrl, { color: { dark: "#E50914", light: "#0A0A0A" }, width: 300, margin: 1 }).then(setQr);
  }, [upiUrl]);

  const handleSubmit = async () => {
    if (utr.length < 6) return toast.error("Enter a valid UTR/transaction id");
    setLoading(true);
    try {
      await confirm({ data: { bookingId: booking.id, utr } });
      toast.success("Booking confirmed!");
      navigate({ to: "/confirmation/$bookingId", params: { bookingId: booking.id } });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20 max-w-2xl">
        <p className="font-display tracking-[0.4em] text-accent text-xs">{(booking.shows as any)?.movies?.title}</p>
        <h1 className="font-display text-4xl tracking-wider mt-1 mb-2">Complete Payment</h1>
        <p className="text-muted-foreground mb-8">{(booking.shows as any)?.screen_name} • {(booking.shows as any) && new Date((booking.shows as any).starts_at).toLocaleString()}</p>

        <div className="glass-card rounded-xl p-8 text-center">
          <p className="font-display tracking-widest text-accent text-sm">PAY WITH ANY UPI APP</p>
          <div className="my-6 inline-block p-4 bg-background rounded-lg shadow-spidey">
            {qr ? <img src={qr} alt="UPI QR" className="w-64 h-64" /> : <div className="w-64 h-64 bg-card animate-spidey-pulse" />}
          </div>
          <div className="font-display text-3xl spidey-gradient-text">₹{Number(booking.total).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-2">UPI ID: <span className="text-foreground">{UPI_VPA}</span> ({UPI_NAME})</p>
          <a href={upiUrl} className="mt-4 inline-block text-xs text-accent underline">Open in UPI app</a>
        </div>

        <div className="mt-8 glass-card rounded-xl p-6">
          <h3 className="font-display text-lg tracking-wider mb-3">Enter Transaction ID (UTR)</h3>
          <p className="text-xs text-muted-foreground mb-3">After paying, paste the 12-digit UTR from your UPI app receipt.</p>
          <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="UTR / Transaction ID" className="w-full px-4 py-3 rounded bg-input border border-border mb-4" />
          <MagneticButton onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Confirming..." : "Confirm Booking"}
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}
