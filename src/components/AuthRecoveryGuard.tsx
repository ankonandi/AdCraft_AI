import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AUTH_RECOVERY_FLAG = "adcraft-auth-recovery";
const AUTH_RECOVERY_AT = "adcraft-auth-recovery-at";
const FAILURE_WINDOW_MS = 45_000;
const FAILURE_THRESHOLD = 2;
const SESSION_EXPIRY_GRACE_SECONDS = 60;

type StoredAuthSession = {
  key: string;
  expiresAt?: number;
};

const isBrowser = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const getStoredAuthSessions = (): StoredAuthSession[] => {
  if (!isBrowser()) return [];

  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))
    .map((key) => {
      try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : null;
        return { key, expiresAt: parsed?.expires_at };
      } catch {
        return { key };
      }
    });
};

const hasExpiredOrNearExpiredSession = () => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return getStoredAuthSessions().some(
    (session) => typeof session.expiresAt === "number" && session.expiresAt <= nowSeconds + SESSION_EXPIRY_GRACE_SECONDS,
  );
};

const clearStoredAuthSessions = () => {
  if (!isBrowser()) return;

  getStoredAuthSessions().forEach(({ key }) => window.localStorage.removeItem(key));
};

const isRecentRecovery = () => {
  if (!isBrowser()) return false;

  const recoveredAt = Number(window.sessionStorage.getItem(AUTH_RECOVERY_AT) || 0);
  return recoveredAt > 0 && Date.now() - recoveredAt < 15_000;
};

const isFetchFailure = (value: unknown) => {
  if (!value) return false;
  if (value instanceof Error) return value.message.includes("Failed to fetch");
  return String(value).includes("Failed to fetch");
};

export function AuthRecoveryGuard() {
  const navigate = useNavigate();
  const failures = useRef<number[]>([]);
  const recovered = useRef(false);

  useEffect(() => {
    if (!isBrowser()) return;

    const recover = async (reason: string) => {
      if (recovered.current || isRecentRecovery() || getStoredAuthSessions().length === 0) return;

      recovered.current = true;
      window.sessionStorage.setItem(AUTH_RECOVERY_FLAG, reason);
      window.sessionStorage.setItem(AUTH_RECOVERY_AT, String(Date.now()));

      clearStoredAuthSessions();

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        clearStoredAuthSessions();
      }

      navigate("/auth?session=expired", { replace: true });
    };

    const recordFailure = () => {
      const now = Date.now();
      failures.current = [...failures.current, now].filter((time) => now - time < FAILURE_WINDOW_MS);

      if (failures.current.length >= FAILURE_THRESHOLD && hasExpiredOrNearExpiredSession()) {
        void recover("session-refresh-failed");
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isFetchFailure(event.reason)) recordFailure();
    };

    const handleWindowError = (event: ErrorEvent) => {
      if (isFetchFailure(event.error) || isFetchFailure(event.message)) recordFailure();
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleWindowError);

    const timeout = window.setTimeout(() => {
      if (hasExpiredOrNearExpiredSession() && failures.current.length > 0) {
        void recover("session-refresh-timeout");
      }
    }, 12_000);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleWindowError);
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return null;
}

export { AUTH_RECOVERY_FLAG };