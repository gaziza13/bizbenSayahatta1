const USER_DATA_KEYS = [
  "username",
  "avatar",
  "cover",
  "email",
  "travelStyle",
  "travelPlaces",
];

const USER_DATA_PREFIXES = ["travelPlaces:"];

export function getStoredAccessToken() {
  return localStorage.getItem("access");
}

export function getStoredRefreshToken() {
  return localStorage.getItem("refresh");
}

export function clearStoredTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

function parseJwtPayload(token) {
  if (!token) return null;

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getSessionIdentityFromToken(token) {
  const payload = parseJwtPayload(token);
  return payload?.user_id || payload?.sub || payload?.email || null;
}

/**
 * Check if a JWT token is expired.
 * Returns true if the token is expired or invalid, false if still valid.
 */
export function isTokenExpired(token) {
  const payload = parseJwtPayload(token);
  if (!payload) return true;

  const exp = payload.exp;
  if (!exp) return false; // No expiration claim = treat as valid (shouldn't happen with JWT)

  // Add a 10-second buffer to avoid edge cases where token expires mid-request
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + 10;
}

/**
 * Get access token only if it's not expired.
 * Returns null if token is missing or expired.
 */
export function getValidAccessToken() {
  const token = getStoredAccessToken();
  if (!token) return null;
  if (isTokenExpired(token)) return null;
  return token;
}

export function clearClientUserData() {
  USER_DATA_KEYS.forEach((key) => localStorage.removeItem(key));

  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (USER_DATA_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export function resetClientUserDataOnSessionChange(nextAccessToken) {
  const prevToken = localStorage.getItem("access");
  const prevIdentity = getSessionIdentityFromToken(prevToken);
  const nextIdentity = getSessionIdentityFromToken(nextAccessToken);

  if (!prevIdentity || !nextIdentity || prevIdentity !== nextIdentity) {
    clearClientUserData();
  }
}

export function getScopedStorageKey(baseKey) {
  const token = localStorage.getItem("access");
  const identity = getSessionIdentityFromToken(token);
  return identity ? `${baseKey}:${identity}` : `${baseKey}:guest`;
}
