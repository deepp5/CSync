import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function TestAuth() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ Error fetching session:", error);
      } else if (data?.session) {
        console.log("✅ Supabase session:", data.session);
        setToken(data.session.access_token);
        setUser(data.session.user);
      } else {
        console.warn("⚠️ No active session — please log in first.");
      }
    };

    fetchSession();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, sans-serif" }}>
      <h1>🔐 Supabase Token Tester</h1>

      {user ? (
        <div>
          <h3>👤 Logged-in User</h3>
          <p>
            <b>Email:</b> {user.email}
          </p>
          <p>
            <b>ID:</b> {user.id}
          </p>
        </div>
      ) : (
        <p>No active session. Please log in first.</p>
      )}

      {token && (
        <>
          <h3>🧾 Access Token</h3>
          <textarea
            readOnly
            value={token}
            rows="8"
            style={{
              width: "100%",
              fontSize: "0.75rem",
              background: "#f5f5f5",
              padding: "10px",
              borderRadius: "8px",
            }}
          />
          <p>
            Copy this token and use it in Postman under:
            <br />
            <code>Authorization: Bearer &lt;token&gt;</code>
          </p>
        </>
      )}
    </div>
  );
}
