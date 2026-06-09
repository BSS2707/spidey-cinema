import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,phone,created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const byUser = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = byUser.get(r.user_id) ?? [];
        arr.push(r.role);
        byUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p: any) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
    },
  });

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wider mb-4">Users</h2>
      {error && <p className="text-destructive text-sm mb-3">{(error as Error).message}</p>}
      <div className="overflow-x-auto glass-card rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
            <tr><th className="p-3">Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No users found</td></tr>
            )}
            {data.map((u: any) => (
              <tr key={u.id} className="border-b border-border/40">
                <td className="p-3">{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td><span className="text-xs font-display uppercase">{u.roles.join(", ") || "user"}</span></td>
                <td className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
