import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HeroScene } from "@/components/HeroScene";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MagneticButton } from "@/components/MagneticButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spidey Cinema — Book Movie Tickets Online" },
      { name: "description", content: "Premium cinema experience. Browse now-showing movies, pick your seats, and book in seconds." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: movies = [] } = useQuery({
    queryKey: ["movies", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("id,title,slug,poster_url,backdrop_url,genres,duration_min,rating,language,release_date")
        .eq("is_active", true)
        .order("release_date", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!titleRef.current) return;
    titleRef.current.animate(
      [{ opacity: 0, transform: "translateY(40px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 1200, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards" },
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <HeroScene />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <p className="font-display tracking-[0.5em] text-accent text-sm mb-6 pointer-events-auto">Welcome to the multiverse of cinema</p>
          <h1 ref={titleRef} className="font-display text-6xl md:text-9xl tracking-wider leading-none opacity-0">
            <span className="block">SPIDEY</span>
            <span className="block spidey-gradient-text">CINEMA</span>
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground text-lg pointer-events-auto">
            Book premium seats for the biggest blockbusters. Cinematic experience, seamless booking, instant tickets.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center pointer-events-auto">
            <Link to="/movies"><MagneticButton variant="primary">Browse Movies</MagneticButton></Link>
            <Link to="/auth"><MagneticButton variant="ghost">Sign In</MagneticButton></Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: "var(--gradient-fade-down)" }} />
      </section>

      {/* Now Showing */}
      <section className="container mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-display tracking-[0.4em] text-accent text-xs mb-2">Now Showing</p>
            <h2 className="font-display text-4xl md:text-6xl tracking-wider">Tonight on the big screen</h2>
          </div>
          <Link to="/movies" className="hidden md:block font-display uppercase tracking-wider text-sm text-muted-foreground hover:text-primary transition">View all →</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((m) => (
            <Link
              key={m.id}
              to="/movies/$slug"
              params={{ slug: m.slug }}
              className="group relative aspect-[2/3] overflow-hidden rounded-lg bg-card border border-border hover:border-primary transition-all duration-500"
              data-cursor="hover"
            >
              {m.poster_url && (
                <img src={m.poster_url} alt={m.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-display text-xl tracking-wider leading-tight">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{m.genres?.slice(0,2).join(" • ")} • {m.duration_min}min</p>
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-display tracking-widest bg-primary text-primary-foreground">{m.rating}</div>
            </Link>
          ))}
          {movies.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">No movies yet. Admins can add them.</div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
