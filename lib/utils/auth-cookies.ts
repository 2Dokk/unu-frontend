import Cookies from "js-cookie";

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
export const AUTH_STATE_CHANGED_EVENT = "auth-state-changed";

function notifyAuthStateChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
  }
}

// Access Token만 프론트에서 관리한다.
// Refresh Token은 서버가 HttpOnly 쿠키로 발급·삭제하므로 프론트 코드에서는 읽거나 쓰거나 지우지 않는다.
export function setAuthCookies(token: string) {
  Cookies.set("token", token, {
    expires: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
  });
  notifyAuthStateChanged();
}

export function clearAuthCookies(options: { notify?: boolean } = {}) {
  Cookies.remove("token");
  if (options.notify !== false) {
    notifyAuthStateChanged();
  }
}
