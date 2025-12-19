import React from "react";
import axios from "axios";
import { useEffect } from "react";
import { supabase } from "@supabase/supabase-js";
import Sidebar from "../Components/Sidebar/Sidebar";
import SearchBar from "../Components/HomePage/Search/SearchBar";
import Grid from "../Components/HomePage/Grid/Grid";
import "../Components/HomePage/HomePage.css";

export default function HomePage() {
  useEffect(() => {
    async function fetchPosts(){
      const {data: {session}} = await supabase.auth.getSession();
      if(!session){ return; }
      const token = session.access_token;

      axios.get("http://localhost:3000/posts", {
        headers: {Authorization: `Bearer ${token}`}
      });
    }

    fetchPosts();
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