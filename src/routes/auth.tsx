import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Navbar } from "@/components/Navbar";
import { MagneticButton } from "@/components/MagneticButton";
import { toast } from "sonner";

type Search = { mode?: "signin" | "signup" | "forgot"; redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: (s.mode as Search["mode"]) ?? "signin",
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: search.redirect || "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Sign In — Spidey Cinema" }, { name: "description", content: "Sign in or create a Spidey Cinema account to book tickets." }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "signin", redirect: redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: name, phone },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast.success("Welcome to Spidey Cinema!");
        navigate({ to: redirectTo || "/dashboard" });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // 2FA: sign out the password session, then email a 6-digit code
        await supabase.auth.signOut();
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (otpErr) throw otpErr;
        toast.success("We emailed you a 6-digit verification code.");
        navigate({ to: "/auth/verify-otp", search: { email, redirect: redirectTo } });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your email for reset instructions.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) toast.error(result.error.message || "Google sign-in failed");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20 flex justify-center">
        <div className="glass-card p-8 rounded-xl w-full max-w-md">
          <p className="font-display tracking-[0.4em] text-accent text-xs mb-2">
            {mode === "signup" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Welcome Back"}
          </p>
          <h1 className="font-display text-4xl tracking-wider mb-8 spidey-gradient-text">
            {mode === "signup" ? "Join the show" : mode === "forgot" ? "Forgot it?" : "Sign in"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <Field label="Full Name" type="text" value={name} onChange={setName} required />
                <Field label="Phone" type="tel" value={phone} onChange={setPhone} />
              </>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            {mode !== "forgot" && <Field label="Password" type="password" value={password} onChange={setPassword} required />}

            <MagneticButton type="submit" disabled={loading} className="w-full">
              {loading ? "..." : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Link" : "Sign In"}
            </MagneticButton>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
              </div>
              <button onClick={handleGoogle} data-cursor="hover" className="w-full px-4 py-3 border border-border rounded-md font-display tracking-wider uppercase text-sm hover:border-accent hover:text-accent transition">
                Continue with Google
              </button>
            </>
          )}

          <div className="mt-6 text-sm text-muted-foreground flex flex-col gap-1 text-center">
            {mode === "signin" && (
              <>
                <Link to="/auth" search={{ mode: "signup" }} className="hover:text-primary">Need an account? <span className="text-primary">Sign up</span></Link>
                <Link to="/auth" search={{ mode: "forgot" }} className="hover:text-primary">Forgot password?</Link>
              </>
            )}
            {mode === "signup" && <Link to="/auth" search={{ mode: "signin" }} className="hover:text-primary">Already a member? <span className="text-primary">Sign in</span></Link>}
            {mode === "forgot" && <Link to="/auth" search={{ mode: "signin" }} className="hover:text-primary">Back to sign in</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, required }: { label: string; type: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs font-display tracking-widest uppercase text-muted-foreground mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 rounded-md bg-input border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
      />
    </label>
  );
}
