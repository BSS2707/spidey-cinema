import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { MagneticButton } from "@/components/MagneticButton";

export const Route = createFileRoute("/_authenticated/confirmation/$bookingId")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("bookings")
      .select("id,total,subtotal,gst,status,payment_status,upi_utr,qr_token,customer_name,customer_email,customer_phone,created_at,shows(starts_at,screen_name,movies(title,poster_url)),booking_seats(seat_id,price,seats(row_label,seat_number,seat_type))")
      .eq("id", params.bookingId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { booking: data };
  },
  head: () => ({ meta: [{ title: "Booking Confirmed — Spidey Cinema" }] }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { booking } = Route.useLoaderData() as any;
  const [qr, setQr] = useState("");
  const movie = booking.shows?.movies;
  const seats = (booking.booking_seats ?? []).map((bs: any) => `${bs.seats.row_label}${bs.seats.seat_number}`).join(", ");

  useEffect(() => {
    QRCode.toDataURL(booking.qr_token, { width: 200, margin: 1 }).then(setQr);
  }, [booking.qr_token]);

  const downloadPdf = async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 800]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Red header bar
    page.drawRectangle({ x: 0, y: 740, width: 595, height: 60, color: rgb(0.898, 0.035, 0.078) });
    page.drawText("SPIDEY CINEMA", { x: 40, y: 758, size: 28, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Official Booking Receipt", { x: 40, y: 745, size: 10, font, color: rgb(1, 1, 1) });

    let y = 700;
    const line = (label: string, value: string) => {
      page.drawText(label, { x: 40, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
      page.drawText(value, { x: 200, y, size: 11, font: bold, color: rgb(0.1, 0.1, 0.1) });
      y -= 22;
    };

    line("Booking ID", booking.id.slice(0, 8).toUpperCase());
    line("Movie", movie?.title ?? "");
    line("Screen", booking.shows?.screen_name ?? "");
    line("Show Time", new Date(booking.shows?.starts_at).toLocaleString());
    line("Seats", seats);
    y -= 10;
    line("Customer", booking.customer_name ?? "");
    line("Email", booking.customer_email ?? "");
    line("Phone", booking.customer_phone ?? "");
    y -= 10;
    line("Subtotal", `INR ${Number(booking.subtotal).toFixed(2)}`);
    line("GST (18%)", `INR ${Number(booking.gst).toFixed(2)}`);
    line("Total Paid", `INR ${Number(booking.total).toFixed(2)}`);
    line("Payment", `${booking.payment_status} ${booking.upi_utr ? `(UTR: ${booking.upi_utr})` : ""}`);

    // QR
    if (qr) {
      const qrBytes = await fetch(qr).then((r) => r.arrayBuffer());
      const qrImg = await pdf.embedPng(qrBytes);
      page.drawImage(qrImg, { x: 400, y: 540, width: 140, height: 140 });
      page.drawText("Scan at entry", { x: 425, y: 525, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    }

    // Footer
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 40, color: rgb(0.1, 0.1, 0.1) });
    page.drawText("support@spideycinema.com  |  Thank you for choosing Spidey Cinema", { x: 80, y: 16, size: 9, font, color: rgb(0.8, 0.8, 0.8) });

    const bytes = await pdf.save();
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `spidey-ticket-${booking.id.slice(0, 8)}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20 max-w-2xl">
        <div className="text-center mb-8">
          <p className="font-display tracking-[0.5em] text-accent text-xs">BOOKING CONFIRMED</p>
          <h1 className="font-display text-5xl tracking-wider mt-2 spidey-gradient-text">Enjoy the show</h1>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="bg-primary text-primary-foreground p-6 flex justify-between items-center">
            <div>
              <div className="font-display text-2xl tracking-wider">{movie?.title}</div>
              <div className="text-sm opacity-90">{booking.shows?.screen_name} • {new Date(booking.shows?.starts_at).toLocaleString()}</div>
            </div>
            {qr && <img src={qr} alt="" className="w-20 h-20 bg-white rounded" />}
          </div>
          <div className="p-6 space-y-3 text-sm">
            <Row label="Booking ID" value={booking.id.slice(0, 8).toUpperCase()} />
            <Row label="Seats" value={seats} />
            <Row label="Customer" value={booking.customer_name} />
            <Row label="Subtotal" value={`₹${Number(booking.subtotal).toFixed(2)}`} />
            <Row label="GST (18%)" value={`₹${Number(booking.gst).toFixed(2)}`} />
            <Row label="Total" value={`₹${Number(booking.total).toFixed(2)}`} bold />
            <Row label="Payment" value={`${booking.payment_status}${booking.upi_utr ? ` • UTR ${booking.upi_utr}` : ""}`} />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <MagneticButton onClick={downloadPdf}>Download PDF Ticket</MagneticButton>
          <Link to="/dashboard"><MagneticButton variant="ghost">My Tickets</MagneticButton></Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-display text-xl" : ""}>{value}</span>
    </div>
  );
}
