import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [m, b, u, conf] = await Promise.all([
        supabase.from("movies").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("total,status,created_at"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("total").eq("status", "CONFIRMED"),
      ]);
      const revenue = (conf.data ?? []).reduce((s, r) => s + Number(r.total), 0);
      return {
        movies: m.count ?? 0,
        users: u.count ?? 0,
        bookings: b.data?.length ?? 0,
        revenue,
        byStatus: ["PENDING", "CONFIRMED", "CANCELLED"].map((st) => ({ name: st, value: (b.data ?? []).filter((r) => r.status === st).length })),
        recent: (b.data ?? []).slice(-14).map((r) => ({ date: new Date(r.created_at).toLocaleDateString(), total: Number(r.total) })),
      };
    },
  });

  if (!stats) return <p className="text-muted-foreground">Loading…</p>;
  const COLORS = ["#FF6F00", "#E50914", "#B0B0B0"];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Revenue" value={`₹${stats.revenue.toFixed(0)}`} />
        <Stat label="Bookings" value={stats.bookings} />
        <Stat label="Movies" value={stats.movies} />
        <Stat label="Users" value={stats.users} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display tracking-wider mb-4">Recent Bookings</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.recent}>
              <CartesianGrid stroke="#222" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip contentStyle={{ background: "#1c1c1c", border: "1px solid #333" }} />
              <Bar dataKey="total" fill="#E50914" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display tracking-wider mb-4">Bookings by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.byStatus} dataKey="value" nameKey="name" outerRadius={90}>
                {stats.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ background: "#1c1c1c", border: "1px solid #333" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <p className="text-xs font-display tracking-widest uppercase text-muted-foreground">{label}</p>
      <p className="font-display text-4xl tracking-wider mt-2 spidey-gradient-text">{value}</p>
    </div>
  );
}
