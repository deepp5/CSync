import { supabase } from "./supabaseClient";

const API_BASE_URL = "http://localhost:5051";

export async function apiFetch(endpoint, options = {}) {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session) {
    throw new Error("No active Supabase session");
  }

  const token = data.session.access_token;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw err;
  }

  return res.json();
}
