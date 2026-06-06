import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Generate full seat grid for a show (admin-only)
export const generateSeatsForShow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ showId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roles) throw new Error("Forbidden");

    const { data: show } = await supabase.from("shows").select("id,rows_config,seats_per_row").eq("id", data.showId).single();
    if (!show) throw new Error("Show not found");

    const cfg = show.rows_config as Record<string, string[]>;
    const rows: { show_id: string; row_label: string; seat_number: number; seat_type: "PLATINUM" | "GOLD" | "SILVER" }[] = [];
    for (const [type, labels] of Object.entries(cfg)) {
      for (const label of labels) {
        for (let n = 1; n <= show.seats_per_row; n++) {
          rows.push({ show_id: data.showId, row_label: label, seat_number: n, seat_type: type as any });
        }
      }
    }
    // Upsert by unique constraint
    const { error } = await supabase.from("seats").upsert(rows, { onConflict: "show_id,row_label,seat_number", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { count: rows.length };
  });

// Grant admin role to current user (used once for bootstrap, gated by email allowlist later)
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ secret: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const adminSecret = process.env.SPIDEY_ADMIN_SECRET;
    if (!adminSecret || data.secret !== adminSecret) throw new Error("Invalid secret");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
