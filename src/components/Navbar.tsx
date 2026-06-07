import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navLinks = (
    <>
      <Link to="/" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }} onClick={() => setOpen(false)}>Home</Link>
      <Link to="/movies" activeProps={{ className: "text-primary" }} onClick={() => setOpen(false)}>Movies</Link>
      {user && <Link to="/dashboard" activeProps={{ className: "text-primary" }} onClick={() => setOpen(false)}>My Tickets</Link>}
      {isAdmin && <Link to="/admin" activeProps={{ className: "text-accent" }} onClick={() => setOpen(false)}>Admin</Link>}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-1 sm:gap-2 group">
          <span className="font-display text-xl sm:text-2xl tracking-widest spidey-gradient-text">SPIDEY</span>
          <span className="font-display text-xl sm:text-2xl tracking-widest text-foreground">CINEMA</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 font-display uppercase text-sm tracking-widest text-muted-foreground">
          {navLinks}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={handleSignOut} className="hidden sm:inline text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition" data-cursor="hover">Sign out</button>
          ) : (
            <Link to="/auth" className="text-xs sm:text-sm font-display uppercase tracking-wider px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:shadow-spidey transition">Sign In</Link>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4 font-display uppercase text-sm tracking-widest text-muted-foreground">
            {navLinks}
            {user && (
              <button onClick={handleSignOut} className="text-left text-muted-foreground hover:text-primary transition">Sign out</button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
