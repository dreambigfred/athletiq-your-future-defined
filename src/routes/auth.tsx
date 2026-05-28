import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — athletIQ" },
      { name: "description", content: "Sign in or create your athletIQ account." },
    ],
  }),
  component: () => <Navigate to="/login" replace />,
});
