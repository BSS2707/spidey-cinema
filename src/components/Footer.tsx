export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-card/40">
      <div className="container mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="font-display text-2xl tracking-widest spidey-gradient-text">SPIDEY CINEMA</div>
        <div className="font-body text-center">
          Created by{" "}
          <a
            href="https://www.bhavyasolanki.online"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-primary transition underline-offset-4 hover:underline"
            data-cursor="hover"
          >
            www.bhavyasolanki.online
          </a>
        </div>
        <div>support@spideycinema.com</div>
      </div>
    </footer>
  );
}
