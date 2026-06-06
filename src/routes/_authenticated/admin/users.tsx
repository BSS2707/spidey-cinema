import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { data = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await supabase.from("profiles").select("*,user_roles(role)").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  return (
    <div>
      <h2 className="font-display text-2xl tracking-wider mb-4">Users</h2>
      <div className="overflow-x-auto glass-card rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
            <tr><th className="p-3">Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {data.map((u: any) => (
              <tr key={u.id} className="border-b border-border/40">
                <td className="p-3">{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td><span className="text-xs font-display uppercase">{(u.user_roles ?? []).map((r: any) => r.role).join(", ") || "user"}</span></td>
                <td className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
