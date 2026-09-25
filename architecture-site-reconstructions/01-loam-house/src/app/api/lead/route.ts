/**
 * Mock lead endpoint. The original forwards to a CRM; this reconstruction only validates
 * and acknowledges so the form choreography can be exercised end to end.
 * Replace the body with a real forwarder to go live (see DECISIONS.md).
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const intent = body.intent;
  if (intent !== "brochure" && intent !== "callback" && intent !== "contact") {
    return Response.json({ ok: false, error: "unknown intent" }, { status: 400 });
  }
  // Honeypot filled: accept silently, deliver nothing.
  if (typeof body.website === "string" && body.website.length > 0) {
    return Response.json({ ok: true });
  }
  const email = typeof body.email === "string" ? body.email : "";
  const phone = typeof body.phone === "string" ? body.phone : "";
  if (!email && !phone) {
    return Response.json({ ok: false, error: "email or phone required" }, { status: 422 });
  }
  return Response.json({ ok: true });
}
