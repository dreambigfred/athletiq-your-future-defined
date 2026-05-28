import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo, GoldLine } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "athletIQ — Career readiness for college athletes" },
      { name: "description", content: "AI career coach built for college athletes. Translate your sport into your next chapter." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <Link to="/auth" className="label-mono hover:text-foreground transition-colors">
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pt-16 pb-24 sm:pt-28">
        <p className="label-mono mb-6 text-primary">Built for college athletes</p>
        <h1 className="font-display text-5xl leading-[0.95] text-foreground sm:text-7xl">
          Life after the game,<br />
          <span className="text-primary">on your terms.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          athletIQ is your AI career readiness agent. We translate what you've built on the field
          into the resume, network, and clarity you need off it.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/auth"
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Start your assessment
          </Link>
          <Link
            to="/auth"
            className="inline-flex h-12 items-center justify-center rounded-md border border-border px-8 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            I already have an account
          </Link>
        </div>

        <div className="mt-24"><GoldLine /></div>

        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {[
            ["01", "Assess", "A focused intake. We learn your sport, your story, your fears, your goals."],
            ["02", "Translate", "Your athletic identity becomes a strengths profile employers understand."],
            ["03", "Move", "A weekly mission and an always-on coach. No more guessing what's next."],
          ].map(([n, t, d]) => (
            <div key={n}>
              <div className="font-mono text-xs text-primary">{n}</div>
              <h3 className="mt-3 font-display text-2xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-5 py-10 label-mono">
        © athletIQ
      </footer>
    </div>
  );
}
