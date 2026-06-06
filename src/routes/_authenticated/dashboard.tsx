import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Tickets — Spidey Cinema" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id,status,total,payment_status,created_at,shows(starts_at,screen_name,movies(title,poster_url,slug))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20">
        <p className="font-display tracking-[0.4em] text-accent text-xs mb-2">Your Reel</p>
        <h1 className="font-display text-5xl md:text-7xl tracking-wider mb-10">My Tickets</h1>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}

        {!isLoading && bookings.length === 0 && (
          <div className="glass-card p-12 rounded-xl text-center">
            <p className="text-muted-foreground mb-6">No bookings yet. The next big show awaits.</p>
            <Link to="/movies" className="inline-block font-display tracking-wider uppercase px-6 py-3 bg-primary text-primary-foreground rounded-md hover:shadow-spidey transition">Browse Movies</Link>
          </div>
        )}

        <div className="grid gap-4">
          {bookings.map((b: any) => (
            <Link
              key={b.id}
              to="/confirmation/$bookingId"
              params={{ bookingId: b.id }}
              data-cursor="hover"
              className="glass-card p-5 rounded-xl flex items-center gap-5 hover:border-primary transition"
            >
              {b.shows?.movies?.poster_url && (
                <img src={b.shows.movies.poster_url} className="w-16 h-24 object-cover rounded" alt="" />
              )}
              <div className="flex-1">
                <h3 className="font-display text-xl tracking-wider">{b.shows?.movies?.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {b.shows?.screen_name} • {b.shows && new Date(b.shows.starts_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl">₹{Number(b.total).toFixed(0)}</div>
                <div className={`text-xs uppercase tracking-widest font-display mt-1 ${b.status === "CONFIRMED" ? "text-accent" : b.status === "CANCELLED" ? "text-destructive" : "text-muted-foreground"}`}>
                  {b.status}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
