import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  component: AdminBookings,
});

function AdminBookings() {
  const { data = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => (await supabase.from("bookings").select("*,shows(starts_at,movies(title))").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  const exportCsv = () => {
    const rows = [["ID","Movie","Show Time","Customer","Email","Phone","Status","Payment","UTR","Total","Created"]];
    data.forEach((b: any) => rows.push([b.id, b.shows?.movies?.title, b.shows?.starts_at, b.customer_name, b.customer_email, b.customer_phone, b.status, b.payment_status, b.upi_utr || "", b.total, b.created_at]));
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "bookings.csv"; a.click();
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="font-display text-2xl tracking-wider">Bookings</h2>
        <button onClick={exportCsv} className="px-4 py-2 border border-border rounded-md font-display tracking-wider uppercase text-sm hover:border-accent" data-cursor="hover">Export CSV</button>
      </div>
      <div className="overflow-x-auto glass-card rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
            <tr><th className="p-3">Movie</th><th>Customer</th><th>Show Time</th><th>Status</th><th>Payment</th><th>Total</th></tr>
          </thead>
          <tbody>
            {data.map((b: any) => (
              <tr key={b.id} className="border-b border-border/40">
                <td className="p-3">{b.shows?.movies?.title}</td>
                <td>{b.customer_name}<br /><span className="text-xs text-muted-foreground">{b.customer_email}</span></td>
                <td>{b.shows && new Date(b.shows.starts_at).toLocaleString()}</td>
                <td><span className={`text-xs uppercase font-display ${b.status === "CONFIRMED" ? "text-accent" : b.status === "CANCELLED" ? "text-destructive" : "text-muted-foreground"}`}>{b.status}</span></td>
                <td className="text-xs">{b.payment_status}{b.upi_utr && <><br /><span className="text-muted-foreground">{b.upi_utr}</span></>}</td>
                <td className="font-display">₹{Number(b.total).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
