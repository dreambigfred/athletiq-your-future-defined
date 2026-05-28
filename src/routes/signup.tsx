import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — athletIQ" },
      { name: "description", content: "Create your athletIQ account to start your career readiness assessment." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/onboarding", replace: true });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) throw signUpError;

      // Attempt immediate sign-in (works when auto-confirm is enabled)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInError) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }

      // If auto-confirm is off, tell user to check email
      toast.success("Account created. Check your email to verify, then log in.");
    } catch (err: any) {
      toast.error(err.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <p className="label-mono text-primary">CREATE ACCOUNT</p>
        <h1 className="mt-3 font-display text-4xl">Let's get started.</h1>

        <form onSubmit={submit} className="mt-10 space-y-5">
          <div>
            <label className="label-mono mb-2 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="label-mono mb-2 block">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-md bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {busy ? "..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary underline underline-offset-4 hover:text-primary-hover">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
