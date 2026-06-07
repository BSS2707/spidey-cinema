import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/movies/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("movies").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { movie: data };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.movie.title ?? "Movie"} — Spidey Cinema` },
      { name: "description", content: loaderData?.movie.synopsis?.slice(0, 160) ?? "" },
      { property: "og:image", content: loaderData?.movie.backdrop_url ?? loaderData?.movie.poster_url ?? "" },
    ],
  }),
  notFoundComponent: () => <div className="min-h-screen flex items-center justify-center"><p>Movie not found.</p></div>,
  errorComponent: ({ error }) => <div className="min-h-screen flex items-center justify-center"><p>{(error as Error).message}</p></div>,
  component: MovieDetail,
});

function MovieDetail() {
  const { movie } = Route.useLoaderData();
  const { data: shows = [] } = useQuery({
    queryKey: ["shows", movie.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("id,screen_name,starts_at,price_silver,price_gold,price_platinum")
        .eq("movie_id", movie.id)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Backdrop */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        {movie.backdrop_url && <img src={movie.backdrop_url} alt={movie.title} className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-6 pb-10">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {movie.poster_url && <img src={movie.poster_url} alt="" className="w-44 rounded-lg shadow-spidey" />}
            <div className="flex-1">
              <p className="font-display tracking-[0.4em] text-accent text-xs">{movie.genres?.join(" • ")}</p>
              <h1 className="font-display text-5xl md:text-7xl tracking-wider mt-2">{movie.title}</h1>
              <p className="text-muted-foreground mt-2">{movie.duration_min}min • {movie.language} • {movie.rating}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <h2 className="font-display text-2xl tracking-wider mb-4">Synopsis</h2>
          <p className="text-muted-foreground leading-relaxed">{movie.synopsis}</p>
          {movie.trailer_url && (
            <div className="mt-8 aspect-video rounded-lg overflow-hidden border border-border">
              <iframe src={movie.trailer_url} className="w-full h-full" allowFullScreen title="Trailer" />
            </div>
          )}
        </div>
        <div>
          <h2 className="font-display text-2xl tracking-wider mb-4">Showtimes</h2>
          <div className="space-y-3">
            {shows.length === 0 && (
              <div className="glass-card p-4 rounded-lg text-sm text-muted-foreground">
                No upcoming shows yet. <Link to="/movies" className="text-primary underline" data-cursor="hover">Browse other movies</Link> or check back soon.
              </div>
            )}
            {shows.map((s) => (
              <Link
                key={s.id} to="/booking/$showId" params={{ showId: s.id }} data-cursor="hover"
                className="glass-card p-4 rounded-lg flex justify-between items-center hover:border-primary transition block"
              >
                <div>
                  <div className="font-display text-lg tracking-wider">{new Date(s.starts_at).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="text-xs text-muted-foreground">{s.screen_name}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">From <span className="text-accent font-display text-lg">₹{Number(s.price_silver).toFixed(0)}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
