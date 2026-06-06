import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useState } from "react";

export const Route = createFileRoute("/movies")({
  head: () => ({ meta: [{ title: "Movies — Spidey Cinema" }, { name: "description", content: "Browse all movies currently showing at Spidey Cinema." }] }),
  component: MoviesPage,
});

function MoviesPage() {
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["movies", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("id,title,slug,poster_url,genres,duration_min,rating,language,release_date")
        .eq("is_active", true)
        .order("release_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = data.filter((m) => m.title.toLowerCase().includes(q.toLowerCase()) || m.genres?.some((g: string) => g.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20">
        <p className="font-display tracking-[0.4em] text-accent text-xs mb-2">Showtimes</p>
        <h1 className="font-display text-5xl md:text-7xl tracking-wider mb-8">All Movies</h1>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or genre…"
          className="w-full max-w-md px-4 py-3 rounded-md bg-input border border-border focus:border-primary focus:outline-none mb-10"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filtered.map((m) => (
            <Link key={m.id} to="/movies/$slug" params={{ slug: m.slug }} data-cursor="hover" className="group block">
              <div className="aspect-[2/3] overflow-hidden rounded-lg bg-card border border-border group-hover:border-primary transition-all">
                {m.poster_url && <img src={m.poster_url} alt={m.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />}
              </div>
              <h3 className="font-display tracking-wider mt-3">{m.title}</h3>
              <p className="text-xs text-muted-foreground">{m.duration_min}min • {m.language}</p>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
