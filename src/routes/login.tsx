import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — athletIQ" },
      { name: "description", content: "Log in to your athletIQ account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated users based on profile state
  useEffect(() => {
    if (loading || !user) return;
    redirectBasedOnProfile(user.id, navigate);
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        await redirectBasedOnProfile(data.user.id, navigate);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Log in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="label-mono text-primary">WELCOME BACK</p>
          <h1 className="mt-3 font-display text-4xl">Log in to athletIQ.</h1>
        </div>

        <form onSubmit={submit} className="mt-10 space-y-5">
          <div>
            <label className="label-mono mb-2 block">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="label-mono mb-2 block">Password</label>
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit" disabled={busy}
            className="h-12 w-full rounded-md bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {busy ? "..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-primary underline underline-offset-4 hover:text-primary-hover">
            Start Assessment
          </Link>
        </p>
      </div>
    </div>
  );
}

async function redirectBasedOnProfile(userId: string, navigate: ReturnType<typeof useNavigate>) {
  const { data: profile } = await supabase
    .from("athlete_profiles")
    .select("onboarding_complete")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) {
    navigate({ to: "/onboarding", replace: true });
  } else if (profile.onboarding_complete) {
    navigate({ to: "/dashboard", replace: true });
  } else {
    navigate({ to: "/onboarding", replace: true });
  }
}
