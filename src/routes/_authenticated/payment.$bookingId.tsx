import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
      .select("id,subtotal,gst,discount,coupon_code,total,status,payment_status,upi_utr,shows(starts_at,screen_name,movies(title))")
      .eq("id", params.bookingId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { booking: data };
  },
  head: () => ({ meta: [{ title: "Payment — Spidey Cinema" }] }),
  component: PaymentPage,
});

type Method = "upi" | "card" | "netbanking" | "wallet";

function PaymentPage() {
  const { booking } = Route.useLoaderData();
  const navigate = useNavigate();
  const confirm = useServerFn(confirmPayment);
  const [qr, setQr] = useState("");
  const [method, setMethod] = useState<Method>("upi");
  const [utr, setUtr] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [bank, setBank] = useState("HDFC");
  const [wallet, setWallet] = useState("Paytm");
  const [loading, setLoading] = useState(false);

  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_VPA)}&pn=${encodeURIComponent(UPI_NAME)}&am=${Number(booking.total).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Spidey-" + booking.id.slice(0, 8))}`;

  useEffect(() => {
    let cancelled = false;
    import("qrcode")
      .then(({ default: QRCode }) => QRCode.toDataURL(upiUrl, { color: { dark: "#E50914", light: "#0A0A0A" }, width: 300, margin: 1 }))
      .then((dataUrl) => { if (!cancelled) setQr(dataUrl); })
      .catch(() => { if (!cancelled) setQr(""); });
    return () => { cancelled = true; };
  }, [upiUrl]);

  const handleSubmit = async () => {
    let ref = utr;
    if (method === "upi") {
      if (utr.length < 6) return toast.error("Enter a valid UTR/transaction id");
    } else if (method === "card") {
      const digits = card.number.replace(/\s/g, "");
      if (digits.length < 12 || !card.name || !card.expiry || card.cvv.length < 3) return toast.error("Fill all card details");
      ref = `CARD-${digits.slice(-4)}-${Date.now().toString().slice(-6)}`;
    } else if (method === "netbanking") {
      ref = `NB-${bank}-${Date.now().toString().slice(-8)}`;
    } else if (method === "wallet") {
      ref = `WAL-${wallet.toUpperCase()}-${Date.now().toString().slice(-8)}`;
    }
    setLoading(true);
    try {
      await confirm({ data: { bookingId: booking.id, utr: ref } });
      toast.success("Booking confirmed!");
      navigate({ to: "/confirmation/$bookingId", params: { bookingId: booking.id } });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  const methods: { id: Method; label: string; icon: string }[] = [
    { id: "upi", label: "UPI", icon: "📱" },
    { id: "card", label: "Card", icon: "💳" },
    { id: "netbanking", label: "Net Banking", icon: "🏦" },
    { id: "wallet", label: "Wallet", icon: "👛" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20 max-w-2xl">
        <p className="font-display tracking-[0.4em] text-accent text-xs">{(booking.shows as any)?.movies?.title}</p>
        <h1 className="font-display text-4xl tracking-wider mt-1 mb-2">Complete Payment</h1>
        <p className="text-muted-foreground mb-8">{(booking.shows as any)?.screen_name} • {(booking.shows as any) && new Date((booking.shows as any).starts_at).toLocaleString()}</p>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {methods.map((m) => (
            <button key={m.id} onClick={() => setMethod(m.id)} data-cursor="hover"
              className={`px-3 py-4 rounded-xl border text-center font-display tracking-wider text-xs uppercase transition ${method === m.id ? "border-primary bg-primary/10 text-primary shadow-spidey" : "border-border text-muted-foreground hover:border-accent/60"}`}>
              <div className="text-2xl mb-1">{m.icon}</div>{m.label}
            </button>
          ))}
        </div>

        {method === "upi" && (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="font-display tracking-widest text-accent text-sm">PAY WITH ANY UPI APP</p>
            <div className="my-6 inline-block p-4 bg-background rounded-lg shadow-spidey">
              {qr ? <img src={qr} alt="UPI QR" className="w-64 h-64" /> : <div className="w-64 h-64 bg-card animate-spidey-pulse" />}
            </div>
            <div className="font-display text-3xl spidey-gradient-text">₹{Number(booking.total).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">UPI ID: <span className="text-foreground">{UPI_VPA}</span> ({UPI_NAME})</p>
            <a href={upiUrl} className="mt-4 inline-block text-xs text-accent underline">Open in UPI app</a>
          </div>
        )}

        {method === "card" && (
          <div className="glass-card rounded-xl p-6 space-y-3">
            <h3 className="font-display tracking-wider mb-2">Card Details</h3>
            <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="Card number" inputMode="numeric" maxLength={19} className="w-full px-4 py-3 rounded bg-input border border-border" />
            <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Cardholder name" className="w-full px-4 py-3 rounded bg-input border border-border" />
            <div className="grid grid-cols-2 gap-3">
              <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} placeholder="MM/YY" maxLength={5} className="w-full px-4 py-3 rounded bg-input border border-border" />
              <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} placeholder="CVV" maxLength={4} type="password" className="w-full px-4 py-3 rounded bg-input border border-border" />
            </div>
          </div>
        )}

        {method === "netbanking" && (
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-display tracking-wider mb-3">Choose Your Bank</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {["HDFC", "ICICI", "SBI", "Axis", "Kotak", "Yes Bank"].map((b) => (
                <button key={b} onClick={() => setBank(b)} data-cursor="hover" className={`px-3 py-3 rounded border text-sm font-display tracking-wider ${bank === b ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-accent/60"}`}>{b}</button>
              ))}
            </div>
          </div>
        )}

        {method === "wallet" && (
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-display tracking-wider mb-3">Choose Your Wallet</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Paytm", "PhonePe", "Amazon Pay", "Mobikwik"].map((w) => (
                <button key={w} onClick={() => setWallet(w)} data-cursor="hover" className={`px-3 py-3 rounded border text-sm font-display tracking-wider ${wallet === w ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-accent/60"}`}>{w}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 glass-card rounded-xl p-6">
          {method === "upi" ? (
            <>
              <h3 className="font-display text-lg tracking-wider mb-3">Enter Transaction ID (UTR)</h3>
              <p className="text-xs text-muted-foreground mb-3">After paying, paste the UTR from your UPI app receipt.</p>
              <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="UTR / Transaction ID" className="w-full px-4 py-3 rounded bg-input border border-border mb-4" />
            </>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">Click below to authorize <span className="text-accent font-display">₹{Number(booking.total).toFixed(2)}</span> via {method === "card" ? "your card" : method === "netbanking" ? bank + " Net Banking" : wallet}.</p>
          )}
          <MagneticButton onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Processing..." : `Pay ₹${Number(booking.total).toFixed(2)}`}
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}
