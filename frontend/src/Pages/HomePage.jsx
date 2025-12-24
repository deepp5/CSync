import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";

import Sidebar from "../Components/Sidebar/Sidebar";
import SearchBar from "../Components/HomePage/Search/SearchBar";
import Grid from "../Components/HomePage/Grid/Grid";

import "../Components/HomePage/HomePage.css";

export default function HomePage() {
  const [allPosts, setAllPosts] = useState([]); // Store ALL posts
  const [filteredPosts, setFilteredPosts] = useState([]); // Display filtered posts
  const [filters, setFilters] = useState({ category: "", difficulty: "" });
  const [searchQuery, setSearchQuery] = useState("");

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

        setAllPosts(response.data);
        setFilteredPosts(response.data); // Initially show all posts
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };

    init();
  }, []);

  // Filter posts whenever filters or search query changes
  useEffect(() => {
    let result = [...allPosts];

    // Filter by category
    if (filters.category) {
      result = result.filter((post) => post.category === filters.category);
    }

    // Filter by difficulty
    if (filters.difficulty) {
      result = result.filter((post) => post.difficulty === filters.difficulty);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.description?.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(result);
  }, [filters, searchQuery, allPosts]);

  const handleFilterChange = ({ category, difficulty }) => {
    setFilters({ category, difficulty });
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="home-container">
      <Sidebar />

      <div className="home-content">
        <div className="home-content-wrapper">
          <div className="home-header">
            <h1 className="home-title">Browse Projects</h1>
          </div>

          <SearchBar
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
          />

          <div className="results-info">
            {filteredPosts.length}{" "}
            {filteredPosts.length === 1 ? "project" : "projects"} found
          </div>

          <Grid posts={filteredPosts} />
        </div>
      </div>
    </div>
  );
}
