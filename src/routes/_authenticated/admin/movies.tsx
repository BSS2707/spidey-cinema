import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MagneticButton } from "@/components/MagneticButton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/movies")({
  component: AdminMovies,
});

function AdminMovies() {
  const qc = useQueryClient();
  const { data: movies = [] } = useQuery({
    queryKey: ["admin-movies"],
    queryFn: async () => (await supabase.from("movies").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [editing, setEditing] = useState<any>(null);

  const blank = { title: "", slug: "", synopsis: "", poster_url: "", backdrop_url: "", duration_min: 120, genres: "", language: "English", rating: "UA", release_date: "", trailer_url: "", is_active: true };

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || `movie-${Date.now()}`;

  const save = async (form: any) => {
    if (!form.title?.trim()) return toast.error("Title is required");
    const slug = (form.slug && form.slug.trim()) ? slugify(form.slug) : slugify(form.title);
    const payload = { ...form, slug, genres: typeof form.genres === "string" ? form.genres.split(",").map((g: string) => g.trim()).filter(Boolean) : form.genres, duration_min: Number(form.duration_min) || 120, release_date: form.release_date || null };
    const res = editing?.id
      ? await supabase.from("movies").update(payload).eq("id", editing.id)
      : await supabase.from("movies").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-movies"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this movie?")) return;
    const { error } = await supabase.from("movies").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-movies"] });
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="font-display text-2xl tracking-wider">Movies</h2>
        <MagneticButton onClick={() => setEditing({ ...blank, genres: "" })}>+ New Movie</MagneticButton>
      </div>

      <div className="grid gap-3">
        {movies.map((m) => (
          <div key={m.id} className="glass-card rounded-xl p-4 flex gap-4 items-center">
            {m.poster_url && <img src={m.poster_url} className="w-12 h-16 object-cover rounded" alt="" />}
            <div className="flex-1">
              <div className="font-display tracking-wider">{m.title}</div>
              <div className="text-xs text-muted-foreground">{m.slug} • {(m.genres ?? []).join(", ")} • {m.duration_min}min</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${m.is_active ? "bg-accent/20 text-accent" : "bg-muted/30 text-muted-foreground"}`}>{m.is_active ? "ACTIVE" : "HIDDEN"}</span>
            <button onClick={() => setEditing({ ...m, genres: (m.genres ?? []).join(", ") })} className="text-sm text-primary hover:underline" data-cursor="hover">Edit</button>
            <button onClick={() => remove(m.id)} className="text-sm text-destructive hover:underline" data-cursor="hover">Delete</button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-auto">
          <div className="glass-card rounded-xl p-6 w-full max-w-2xl">
            <h3 className="font-display text-2xl tracking-wider mb-4">{editing.id ? "Edit" : "New"} Movie</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
              <Field label="Slug" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: v })} />
              <Field label="Poster URL" value={editing.poster_url || ""} onChange={(v) => setEditing({ ...editing, poster_url: v })} />
              <Field label="Backdrop URL" value={editing.backdrop_url || ""} onChange={(v) => setEditing({ ...editing, backdrop_url: v })} />
              <Field label="Duration (min)" value={String(editing.duration_min)} onChange={(v) => setEditing({ ...editing, duration_min: v })} />
              <Field label="Language" value={editing.language} onChange={(v) => setEditing({ ...editing, language: v })} />
              <Field label="Rating" value={editing.rating} onChange={(v) => setEditing({ ...editing, rating: v })} />
              <Field label="Release Date" value={editing.release_date || ""} onChange={(v) => setEditing({ ...editing, release_date: v })} placeholder="YYYY-MM-DD" />
              <Field label="Genres (comma)" value={editing.genres} onChange={(v) => setEditing({ ...editing, genres: v })} full />
              <Field label="Trailer URL (embed)" value={editing.trailer_url || ""} onChange={(v) => setEditing({ ...editing, trailer_url: v })} full />
              <label className="col-span-2 block">
                <span className="block text-xs font-display tracking-widest uppercase text-muted-foreground mb-1">Synopsis</span>
                <textarea value={editing.synopsis} onChange={(e) => setEditing({ ...editing, synopsis: e.target.value })} rows={4} className="w-full px-3 py-2 rounded bg-input border border-border" />
              </label>
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active
              </label>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-muted-foreground" data-cursor="hover">Cancel</button>
              <MagneticButton onClick={() => save(editing)}>Save</MagneticButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, full, placeholder }: { label: string; value: string; onChange: (v: string) => void; full?: boolean; placeholder?: string }) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <span className="block text-xs font-display tracking-widest uppercase text-muted-foreground mb-1">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 rounded bg-input border border-border" />
    </label>
  );
}
