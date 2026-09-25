/** document cookies, as the original stores them (path=/, expiry in days; none = for the session) */
export function setCookie(name: string, value: string, days?: number) {
  let expires = "";
  if (days) expires = "; expires=" + new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}${expires}; path=/`;
}

export function getCookie(name: string): string | null {
  for (const part of document.cookie.split(";")) {
    const p = part.trimStart();
    if (p.startsWith(name + "=")) return p.slice(name.length + 1);
  }
  return null;
}
