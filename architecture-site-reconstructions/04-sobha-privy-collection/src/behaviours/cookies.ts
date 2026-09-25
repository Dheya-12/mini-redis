/**
 * Cookie consent and campaign parameters.
 *
 * - The consent bar stays until a choice is made; the choice is kept for 356 days (`cookieConsentStatus` 1 / 0), as on
 *   the original. The original then loads its analytics; this reconstruction loads none, so accepting only records it.
 * - utmSave: `utm_*` parameters in the address are kept for the session (cookie `utm`), for the original's enquiry forms.
 */
import type { Cleanup } from "@/lib/runtime";
import { getCookie, setCookie } from "@/lib/cookie";

const KEY = "cookieConsentStatus";

export function initCookieConsent(): Cleanup {
  const bar = document.querySelector<HTMLElement>('[data-plugin~="cookieConsent"]');
  if (!bar) return () => {};
  const hide = () => {
    bar.classList.add("is-hidden");
    bar.removeAttribute("open");
    document.documentElement.classList.remove("with-cookie-consent");
  };
  const status = parseInt(getCookie(KEY) ?? "", 10);
  if (status === 1 || status === 0) { hide(); return () => {}; }
  const onClick = (e: MouseEvent) => {
    const t = e.target as Element | null;
    if (t?.closest(".js-cookie-consent-accept")) { setCookie(KEY, "1", 356); hide(); }
    else if (t?.closest(".js-cookie-consent-decline")) { setCookie(KEY, "0", 356); hide(); }
  };
  // the accept control is a link without an address: Enter and Space press it too
  const onKey = (e: KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && (e.target as Element | null)?.closest(".js-cookie-consent-accept, .js-cookie-consent-decline")) {
      e.preventDefault();
      (e.target as HTMLElement).click();
    }
  };
  bar.addEventListener("click", onClick);
  bar.addEventListener("keydown", onKey);
  return () => { bar.removeEventListener("click", onClick); bar.removeEventListener("keydown", onKey); };
}

export function saveUtm() {
  const params = new URLSearchParams(location.search);
  const utm: Record<string, string> = {};
  params.forEach((v, k) => { if (k.startsWith("utm_")) utm[k] = v; });
  if (Object.keys(utm).length) setCookie("utm", JSON.stringify(utm));
}
