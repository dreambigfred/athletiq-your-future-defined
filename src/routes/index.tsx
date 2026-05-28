import { createFileRoute, Link } from "@tanstack/react-router";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="flex flex-col items-center text-center">
        {/* Logo */}
        <div className="flex items-baseline gap-[3px] font-display text-6xl tracking-wide sm:text-7xl">
          <span className="text-foreground">athlet</span>
          <span className="text-primary">IQ</span>
        </div>

        {/* Gold line */}
        <div className="mt-6 h-[1px] w-[120px] bg-primary" />

        {/* Headline */}
        <p className="mt-8 font-sans text-lg text-muted-foreground">
          The Career Readiness Agent for College Athletes
        </p>

        {/* CTA */}
        <Link
          to="/signup"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Start Your Assessment →
        </Link>

        {/* Login link */}
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary underline underline-offset-4 hover:text-primary-hover">
            Log in
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 font-mono text-[10px] tracking-widest text-muted-foreground">
        Intelligence. Elevation. Legacy. · athq.tech
      </div>
    </div>
  );
}
