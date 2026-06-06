import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Called by pg_cron every 2 min: release expired locks + delete stale pending bookings.
export const Route = createFileRoute("/api/public/cron/release-seats")({
  server: {
    handlers: {
      POST: async () => {
        const now = new Date().toISOString();
        // Release expired locked seats
        await supabaseAdmin
          .from("seats")
          .update({ status: "AVAILABLE", locked_by: null, locked_until: null })
          .eq("status", "LOCKED")
          .lt("locked_until", now);

        // Delete pending bookings older than 10 minutes without UTR
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        await supabaseAdmin
          .from("bookings")
          .delete()
          .eq("status", "PENDING")
          .is("upi_utr", null)
          .lt("created_at", tenMinAgo);

        return new Response(JSON.stringify({ ok: true, at: now }), { headers: { "content-type": "application/json" } });
      },
    },
  },
});
