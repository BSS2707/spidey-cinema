import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { MagneticButton } from "@/components/MagneticButton";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

type Search = { email?: string; redirect?: string };

export const Route = createFileRoute("/auth/verify-otp")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    email: typeof s.email === "string" ? s.email : undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Verify Code — Spidey Cinema" }] }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const { email, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const verify = async (token: string) => {
    if (!email) return toast.error("Missing email. Please sign in again.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw error;
      toast.success("Verified! Welcome back.");
      navigate({ to: redirect || "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid code");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setResending(false);
    if (error) return toast.error(error.message);
    toast.success("New code sent.");
    setCooldown(60);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-20 flex justify-center">
        <div className="glass-card p-8 rounded-xl w-full max-w-md">
          <p className="font-display tracking-[0.4em] text-accent text-xs mb-2">Two-Step Verification</p>
          <h1 className="font-display text-4xl tracking-wider mb-3 spidey-gradient-text">Enter Code</h1>
          <p className="text-sm text-muted-foreground mb-8">
            We sent a 6-digit code to{" "}
            <span className="text-foreground">{email ?? "your email"}</span>. Enter it below to continue.
          </p>

          <div className="flex justify-center mb-6">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(v) => {
                setCode(v);
                if (v.length === 6) void verify(v);
              }}
              disabled={loading}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <MagneticButton
            onClick={() => void verify(code)}
            disabled={loading || code.length !== 6}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify"}
          </MagneticButton>

          <div className="mt-6 text-sm text-muted-foreground flex flex-col gap-2 text-center">
            <button onClick={resend} disabled={resending || cooldown > 0} className="hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {resending ? "Sending..." : cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
            </button>
            <Link to="/auth" search={{ mode: "signin" }} className="hover:text-primary">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
