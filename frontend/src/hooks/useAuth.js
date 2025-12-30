import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    const syncUser = async (session) => {
      if (!session || hasSyncedRef.current) return;

      hasSyncedRef.current = true;

      try {
        await fetch("${API_BASE_URL}/auth/sync", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      } catch (err) {
        console.error("Auth sync failed:", err);
      }
    };

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user || null);
      await syncUser(session);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        await syncUser(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return user;
}