import React, { useEffect } from "react";
import Sidebar from "../Components/Sidebar/Sidebar";
import SearchBar from "../Components/HomePage/Search/SearchBar";
import Grid from "../Components/HomePage/Grid/Grid";
import "../Components/HomePage/HomePage.css";
import { supabase } from ".././supabaseClient";

export default function HomePage() {
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Supabase session error:", error);
        return;
      }

      if (data?.session) {
        console.log("✅ Supabase User:", data.session.user);
        console.log("✅ Supabase Access Token:", data.session.access_token);
      } else {
        console.log("❌ No active session");
      }
    };

    getSession();
  }, []);

  return (
    <div className="home-container">
      <Sidebar />

      <div className="home-content">
        <SearchBar />
        <Grid />
      </div>
    </div>
  );
}
