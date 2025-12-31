import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";

import { API_BASE_URL } from "../api";
const API_BASE = API_BASE_URL;

export default function useAuth() {
  const [user, setUser] = useState(null);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    const syncUser = async (session) => {
      if (!session || hasSyncedRef.current) return;

      hasSyncedRef.current = true;

      try {
        await fetch(`${API_BASE}/auth/sync`, {
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