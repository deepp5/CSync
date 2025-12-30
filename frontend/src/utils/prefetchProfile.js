// src/utils/prefetchProfile.js
import axios from "axios";
import { supabase } from "../supabaseClient";
import { prefetchCache } from "./prefetchCache";

import { API_BASE_URL } from "../api";
const API_BASE = `${API_BASE_URL}`;

// Deduplicate concurrent prefetch calls per username
const inFlight = new Map();

export async function prefetchProfile(username) {
  if (!username) return;

  const cacheKey = `profile:${username}`;
  if (prefetchCache.get(cacheKey)) return;

  if (inFlight.has(username)) return inFlight.get(username);

  const p = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      // Fetch the same endpoints ProfilePage uses
      const [profileRes, postsRes, followRes, followersRes, followingRes] =
        await Promise.allSettled([
          axios.get(`${API_BASE}/api/profile/${username}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/profile/${username}/posts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/profile/${username}/follow-status`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/profile/${username}/followers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/api/profile/${username}/following`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const profile = profileRes.status === "fulfilled" ? profileRes.value.data : null;
      if (!profile) return; // no point caching partial if profile failed

      const posts = postsRes.status === "fulfilled" ? (postsRes.value.data || []) : [];
      const isFollowing =
        followRes.status === "fulfilled" ? !!followRes.value.data?.isFollowing : false;
      const followers =
        followersRes.status === "fulfilled" ? (followersRes.value.data || []) : [];
      const following =
        followingRes.status === "fulfilled" ? (followingRes.value.data || []) : [];

      prefetchCache.set(cacheKey, {
        profile,
        posts,
        isFollowing,
        isOwnProfile: false, // ProfilePage recalcs anyway
        followers,
        following,
      });
    } catch (e) {
      console.error("prefetchProfile error:", e);
    } finally {
      inFlight.delete(username);
    }
  })();

  inFlight.set(username, p);
  return p;
}