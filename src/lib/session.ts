/**
 * Admin session cookie name shared by the proxy (edge) and server code.
 *
 * Kept in its own module — free of `server-only` and Node imports — so the
 * edge proxy can read the cookie without pulling the Appwrite server SDK into
 * its bundle.
 */
export const ADMIN_SESSION_COOKIE = "jg_admin_session";

/** Session lifetime in seconds (mirrored by the login route). */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;
