export type LeadIntent = "brochure" | "callback" | "contact";

export type LeadFields = {
  intent: LeadIntent;
  name?: string;
  email?: string;
  phone?: string;
  preferred?: string;
  enquiry?: string;
  message?: string;
  /** Honeypot: must stay empty. */
  website?: string;
};

function attribution() {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") ?? "",
    utm_medium: p.get("utm_medium") ?? "",
    utm_campaign: p.get("utm_campaign") ?? "",
    referrer: document.referrer,
  };
}

/** The one seam every form submits through. */
export async function submitLead(fields: LeadFields) {
  const res = await fetch("/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...attribution(), ...fields }),
  });
  if (!res.ok) throw new Error(`lead delivery failed (${res.status})`);
  return (await res.json()) as { ok: true };
}
