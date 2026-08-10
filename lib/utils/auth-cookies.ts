import Cookies from "js-cookie";

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookies(token: string, refreshToken?: string) {
  Cookies.set("token", token, { expires: new Date(Date.now() + ACCESS_TOKEN_TTL_MS) });
  if (refreshToken) {
    Cookies.set("refreshToken", refreshToken, {
      expires: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
  }
}
