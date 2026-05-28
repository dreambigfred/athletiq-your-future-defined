import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — athletIQ" },
      { name: "description", content: "Create your athletIQ account." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Account created. Check your email to verify.");
    } catch (err: any) {
      toast.error(err.message ?? "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="label-mono text-primary">CREATE ACCOUNT</p>
          <h1 className="mt-3 font-display text-4xl">Let&apos;s get started.</h1>
        </div>

        {sent ? (
          <div className="mt-10 rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-foreground">Check your email to verify your account.</p>
            <button
              onClick={() => navigate({ to: "/login" })}
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Go to log in
            </button>
          </div>
        ) : (
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
              {busy ? "..." : "Create Account"}
            </button>
          </form>
        )}

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
