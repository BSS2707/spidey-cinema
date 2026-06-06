export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-card/40">
      <div className="container mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="font-display text-2xl tracking-widest spidey-gradient-text">SPIDEY CINEMA</div>
        <div className="font-body">Built for cinephiles. Powered by web tech.</div>
        <div>support@spideycinema.com</div>
      </div>
    </footer>
  );
}
