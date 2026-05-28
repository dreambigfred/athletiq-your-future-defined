import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — athletIQ" },
      { name: "description", content: "Sign in or create your athletIQ account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to verify.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <header className="mx-auto max-w-md"><Logo /></header>

      <main className="mx-auto mt-16 max-w-md">
        <p className="label-mono text-primary">{mode === "signup" ? "Create account" : "Welcome back"}</p>
        <h1 className="mt-3 font-display text-4xl">
          {mode === "signup" ? "Begin the transition." : "Pick up where you left off."}
        </h1>

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
            {busy ? "..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-6 w-full text-sm text-muted-foreground hover:text-primary"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </main>
    </div>
  );
}
