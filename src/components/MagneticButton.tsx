import { useRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "accent";
}

export function MagneticButton({ className, variant = "primary", children, ...props }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  };
  const handleLeave = () => { if (ref.current) ref.current.style.transform = ""; };

  const base = "relative inline-flex items-center justify-center gap-2 px-7 py-3 font-display tracking-wider uppercase rounded-md transition-all duration-300 text-base";
  const styles = {
    primary: "bg-primary text-primary-foreground hover:shadow-spidey hover:bg-primary-glow",
    accent: "bg-accent text-accent-foreground hover:shadow-glow",
    ghost: "border border-border text-foreground hover:border-primary hover:text-primary",
  };

  return (
    <button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn(base, styles[variant], className)}
      data-cursor="hover"
      {...props}
    >
      {children}
    </button>
  );
}
