export interface Env {
  MAILCHIMP_API_KEY: string;
  MAILCHIMP_LIST_ID: string;
}

const ALLOWED_ORIGINS = new Set([
  "https://wing.vc",
  "https://www.wing.vc",
  "https://wing-staging.webflow.io",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return json({ success: false, error: "Forbidden" }, 403, origin);
    }

    if (request.method !== "POST") {
      return json({ success: false, error: "Method not allowed" }, 405, origin);
    }

    let email: string | undefined;
    let honeypot: string | undefined;

    const contentType = request.headers.get("Content-Type") || "";
    try {
      if (contentType.includes("application/json")) {
        const body = await request.json<Record<string, unknown>>();
        email = typeof body.email === "string" ? body.email : undefined;
        honeypot = typeof body.company_website === "string" ? body.company_website : undefined;
      } else {
        const form = await request.formData();
        email = form.get("email")?.toString();
        honeypot = form.get("company_website")?.toString();
      }
    } catch {
      return json({ success: false, error: "Invalid request body" }, 400, origin);
    }

    // Hidden field that real users never fill in; bots do. Pretend to succeed
    // so bots don't learn to leave it blank, but skip the Mailchimp call.
    if (honeypot) {
      return json({ success: true }, 200, origin);
    }

    email = email?.trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return json({ success: false, error: "A valid email address is required" }, 400, origin);
    }

    // Mailchimp API keys are formatted as "<key>-<server prefix>" (e.g. "abc123-us21").
    const serverPrefix = env.MAILCHIMP_API_KEY.split("-").pop();
    if (!serverPrefix) {
      return json({ success: false, error: "Server misconfiguration" }, 500, origin);
    }

    const mcResponse = await fetch(
      `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_LIST_ID}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`anystring:${env.MAILCHIMP_API_KEY}`)}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
        }),
      }
    );

    if (mcResponse.ok) {
      return json({ success: true }, 200, origin);
    }

    const errorBody = await mcResponse
      .json<{ title?: string; detail?: string }>()
      .catch(() => ({}) as { title?: string; detail?: string });

    // Mailchimp returns 400 "Member Exists" if the email is already on the list.
    // From the form's point of view that's still a success.
    if (mcResponse.status === 400 && errorBody.title === "Member Exists") {
      return json({ success: true }, 200, origin);
    }

    console.error("Mailchimp error:", mcResponse.status, errorBody);
    return json(
      { success: false, error: "Unable to subscribe right now. Please try again later." },
      502,
      origin
    );
  },
};
