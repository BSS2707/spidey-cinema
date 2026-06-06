import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { MagneticButton } from "@/components/MagneticButton";
import { generateSeatsForShow } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/shows")({
  component: AdminShows,
});

function AdminShows() {
  const qc = useQueryClient();
  const gen = useServerFn(generateSeatsForShow);
  const { data: shows = [] } = useQuery({
    queryKey: ["admin-shows"],
    queryFn: async () => (await supabase.from("shows").select("*,movies(title)").order("starts_at", { ascending: true })).data ?? [],
  });
  const { data: movies = [] } = useQuery({
    queryKey: ["admin-movies-min"],
    queryFn: async () => (await supabase.from("movies").select("id,title").eq("is_active", true)).data ?? [],
  });

  const [form, setForm] = useState({ movie_id: "", screen_name: "Screen 1", starts_at: "", price_silver: 150, price_gold: 250, price_platinum: 400, seats_per_row: 12 });

  const add = async () => {
    if (!form.movie_id || !form.starts_at) return toast.error("Pick movie + time");
    const { data, error } = await supabase.from("shows").insert({ ...form, starts_at: new Date(form.starts_at).toISOString() }).select().single();
    if (error) return toast.error(error.message);
    await gen({ data: { showId: data.id } });
    toast.success("Show + seats created");
    qc.invalidateQueries({ queryKey: ["admin-shows"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete show and all its seats/bookings?")) return;
    const { error } = await supabase.from("shows").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-shows"] });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display text-xl tracking-wider mb-4">Add Show</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <select value={form.movie_id} onChange={(e) => setForm({ ...form, movie_id: e.target.value })} className="px-3 py-2 rounded bg-input border border-border">
            <option value="">Select movie…</option>
            {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <input value={form.screen_name} onChange={(e) => setForm({ ...form, screen_name: e.target.value })} placeholder="Screen name" className="px-3 py-2 rounded bg-input border border-border" />
          <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="px-3 py-2 rounded bg-input border border-border" />
          <input type="number" value={form.price_silver} onChange={(e) => setForm({ ...form, price_silver: +e.target.value })} placeholder="Silver ₹" className="px-3 py-2 rounded bg-input border border-border" />
          <input type="number" value={form.price_gold} onChange={(e) => setForm({ ...form, price_gold: +e.target.value })} placeholder="Gold ₹" className="px-3 py-2 rounded bg-input border border-border" />
          <input type="number" value={form.price_platinum} onChange={(e) => setForm({ ...form, price_platinum: +e.target.value })} placeholder="Platinum ₹" className="px-3 py-2 rounded bg-input border border-border" />
        </div>
        <MagneticButton onClick={add} className="mt-4">Create Show + Generate Seats</MagneticButton>
      </div>

      <div className="grid gap-3">
        {shows.map((s: any) => (
          <div key={s.id} className="glass-card rounded-xl p-4 flex justify-between items-center">
            <div>
              <div className="font-display tracking-wider">{s.movies?.title}</div>
              <div className="text-xs text-muted-foreground">{s.screen_name} • {new Date(s.starts_at).toLocaleString()} • ₹{s.price_silver}/₹{s.price_gold}/₹{s.price_platinum}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => gen({ data: { showId: s.id } }).then(() => toast.success("Seats regenerated"))} className="text-sm text-accent hover:underline" data-cursor="hover">Regen Seats</button>
              <button onClick={() => remove(s.id)} className="text-sm text-destructive hover:underline" data-cursor="hover">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
