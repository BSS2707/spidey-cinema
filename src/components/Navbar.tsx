import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display text-2xl tracking-widest spidey-gradient-text">SPIDEY</span>
          <span className="font-display text-2xl tracking-widest text-foreground">CINEMA</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 font-display uppercase text-sm tracking-widest text-muted-foreground">
          <Link to="/" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>Home</Link>
          <Link to="/movies" activeProps={{ className: "text-primary" }}>Movies</Link>
          {user && <Link to="/dashboard" activeProps={{ className: "text-primary" }}>My Tickets</Link>}
          {isAdmin && <Link to="/admin" activeProps={{ className: "text-accent" }}>Admin</Link>}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={handleSignOut} className="text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition" data-cursor="hover">Sign out</button>
          ) : (
            <Link to="/auth" className="text-sm font-display uppercase tracking-wider px-4 py-2 bg-primary text-primary-foreground rounded-md hover:shadow-spidey transition">Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}
