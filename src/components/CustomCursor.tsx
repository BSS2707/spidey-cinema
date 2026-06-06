import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = dotRef.current!;
    const trail = trailRef.current!;
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;

    const onMove = (e: MouseEvent) => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`; };
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const hovering = !!target?.closest("a, button, [data-cursor='hover']");
      dot.classList.toggle("is-hovering", hovering);
      trail.classList.toggle("is-hovering", hovering);
    };

    let raf = 0;
    const loop = () => {
      tx += (x - tx) * 0.18;
      ty += (y - ty) * 0.18;
      trail.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  return (
    <>
      <div ref={trailRef} className="spidey-cursor-trail" aria-hidden />
      <div ref={dotRef} className="spidey-cursor" aria-hidden />
    </>
  );
}
