export const SESSION_COOKIE_NAME = "pms_session";

// Decision D-031: idle timeout
export const IDLE_TIMEOUT_SECONDS = 15 * 60;

// Decision D-032: absolute session lifetime
export const ABSOLUTE_LIFETIME_SECONDS = 10 * 60 * 60;

// Refresh last_activity_at at most this often
export const ACTIVITY_REFRESH_SECONDS = 60;

// Failed-login lockout
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;
