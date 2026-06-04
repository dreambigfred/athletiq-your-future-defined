// Supabase Edge Function: anthropic-chat
// Calls Anthropic Messages API using the ANTHROPIC_API_KEY secret.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      messages,
      prompt,
      system,
      model = "claude-sonnet-4-5-20250929",
      max_tokens = 1024,
    } = body ?? {};

    const finalMessages =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : prompt
        ? [{ role: "user", content: String(prompt) }]
        : null;

    if (!finalMessages) {
      return new Response(
        JSON.stringify({ error: "Provide `messages` array or `prompt` string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens,
        ...(system ? { system } : {}),
        messages: finalMessages,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Anthropic error", res.status, data);
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = data?.content?.map((c: any) => c.text).filter(Boolean).join("\n") ?? "";
    return new Response(JSON.stringify({ text, raw: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("anthropic-chat error", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
