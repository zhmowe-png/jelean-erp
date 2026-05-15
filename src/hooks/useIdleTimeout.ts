import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const IDLE_MS = 15 * 60 * 1000; // 15 minutes

const EVENTS: (keyof DocumentEventMap)[] = ["mousemove", "keydown", "click"];

export function useIdleTimeout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await signOut();
        navigate("/login");
      }, IDLE_MS);
    }

    function onActivity() {
      resetTimer();
    }

    // Start the timer on mount
    resetTimer();

    // Bind activity listeners
    for (const ev of EVENTS) {
      document.addEventListener(ev, onActivity, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const ev of EVENTS) {
        document.removeEventListener(ev, onActivity);
      }
    };
  }, [user, signOut, navigate]);
}
