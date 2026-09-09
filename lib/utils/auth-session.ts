const SESSION_EXPIRED_KEY = "cnu_session_expired";
let manualLogoutInProgress = false;

export function beginManualLogout() {
  manualLogoutInProgress = true;
  clearSessionExpired();
}

export function isManualLogoutInProgress(): boolean {
  return manualLogoutInProgress;
}

export function markSessionExpired() {
  if (typeof window === "undefined" || manualLogoutInProgress) return;
  window.sessionStorage.setItem(SESSION_EXPIRED_KEY, "true");
}

export function clearSessionExpired() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_EXPIRED_KEY);
}

export function consumeSessionExpired(): boolean {
  if (typeof window === "undefined") return false;
  const expired = window.sessionStorage.getItem(SESSION_EXPIRED_KEY) === "true";
  clearSessionExpired();
  return expired;
}

export function sessionExpiredLoginUrl(): string {
  if (typeof window === "undefined") return "/login?reason=session-expired";

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams({
    reason: "session-expired",
    redirect: currentPath,
  });
  return `/login?${params.toString()}`;
}
