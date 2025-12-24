import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";

import Sidebar from "../Components/Sidebar/Sidebar";
import SearchBar from "../Components/HomePage/Search/SearchBar";
import Grid from "../Components/HomePage/Grid/Grid";

import "../Components/HomePage/HomePage.css";

export default function HomePage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Supabase session error:", error);
        return;
      }

      if (!data?.session) {
        console.log("❌ No active session");
        return;
      }

      const session = data.session;

      // ✅ Debug logs (safe to remove later)
      console.log("✅ Supabase User:", session.user);
      console.log("✅ Supabase Access Token:", session.access_token);

      try {
        const response = await axios.get("http://localhost:5051/posts", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        setPosts(response.data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };

    init();
  }, []);

  return (
    <div className="home-container">
      <Sidebar />

      <div className="home-content">
        <h1 className="home-title">Browse Projects</h1>
        <SearchBar />
        <Grid posts={posts} />
      </div>
    </div>
  );
}


