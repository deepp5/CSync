import React from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../Components/Sidebar/Sidebar";
import SearchBar from "../Components/HomePage/Search/SearchBar";
import Grid from "../Components/HomePage/Grid/Grid";
import "../Components/HomePage/HomePage.css";

export default function HomePage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchPosts(){
      const {data: {session}} = await supabase.auth.getSession();
      if(!session){ return; }
      const token = session.access_token;

      const response = await axios.get("http://localhost:5051/posts", {
        headers: {Authorization: `Bearer ${token}`}
      });

      setPosts(response.data);
    }

    fetchPosts();
  }, []);

  return (
    <div className="home-container">
      <Sidebar />

      <div className="home-content">
        <h1 className="home-title">Browse Projects</h1>
        <SearchBar />
        <Grid posts={posts}/>
      </div>
    </div>
  );
}