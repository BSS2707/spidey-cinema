import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context, location }) => {
    const userId = (context as any).user?.id;
    if (!userId) throw redirect({ to: "/auth", search: { mode: "signin", redirect: location.href } });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-display tracking-[0.4em] text-accent text-xs">Admin Console</p>
            <h1 className="font-display text-4xl tracking-wider">Spidey Cinema</h1>
          </div>
          <nav className="flex gap-4 font-display tracking-wider uppercase text-sm">
            <Link to="/admin" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="text-muted-foreground hover:text-primary">Overview</Link>
            <Link to="/admin/movies" activeProps={{ className: "text-primary" }} className="text-muted-foreground hover:text-primary">Movies</Link>
            <Link to="/admin/shows" activeProps={{ className: "text-primary" }} className="text-muted-foreground hover:text-primary">Shows</Link>
            <Link to="/admin/bookings" activeProps={{ className: "text-primary" }} className="text-muted-foreground hover:text-primary">Bookings</Link>
            <Link to="/admin/users" activeProps={{ className: "text-primary" }} className="text-muted-foreground hover:text-primary">Users</Link>
          </nav>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
