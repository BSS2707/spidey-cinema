import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { MagneticButton } from "@/components/MagneticButton";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Spidey Cinema" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20 flex justify-center">
        <form onSubmit={submit} className="glass-card p-8 rounded-xl w-full max-w-md">
          <h1 className="font-display text-3xl tracking-wider mb-6 spidey-gradient-text">Set New Password</h1>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" required minLength={6} className="w-full px-4 py-3 rounded bg-input border border-border mb-4" />
          <MagneticButton type="submit" disabled={loading} className="w-full">{loading ? "..." : "Update Password"}</MagneticButton>
        </form>
      </div>
    </div>
  );
}
