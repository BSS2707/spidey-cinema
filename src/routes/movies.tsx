import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/movies")({
  head: () => ({ meta: [{ title: "Movies — Spidey Cinema" }, { name: "description", content: "Browse all movies currently showing at Spidey Cinema." }] }),
  component: () => <Outlet />,
});
