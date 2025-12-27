import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";
import { prefetchCache } from "../utils/prefetchCache";

import Sidebar from "../Components/Sidebar/Sidebar";
import SearchBar from "../Components/HomePage/Search/SearchBar";
import Grid from "../Components/HomePage/Grid/Grid";

import "../Components/HomePage/HomePage.css";

export default function HomePage() {
  const [allPosts, setAllPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filters, setFilters] = useState({ category: "", difficulty: "" });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const init = async () => {
      const cached = prefetchCache.get("homeFeed");

      // ⚡ Instant render if prefetched
      if (cached) {
        setAllPosts(cached);
        setFilteredPosts(cached);
        // still refresh silently in background
        fetchFresh();
        return;
      }

      // No cache → normal fetch
      await fetchFresh();
    };

    const fetchFresh = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Supabase session error:", error);
        return;
      }

      if (!data?.session) {
        console.log("❌ No active session");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5051/posts", {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });

        setAllPosts(response.data);
        setFilteredPosts(response.data);

        // ✅ update cache
        prefetchCache.set("homeFeed", response.data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };

    init();
  }, []);

  useEffect(() => {
    let result = [...allPosts];

    if (filters.category) {
      result = result.filter((post) => post.category === filters.category);
    }

    if (filters.difficulty) {
      result = result.filter((post) => post.difficulty === filters.difficulty);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.description?.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(result);
  }, [filters.category, filters.difficulty, searchQuery, allPosts]);

  // ✅ MEMOIZED callbacks (prevents infinite loop)
  const handleFilterChange = useCallback(({ category, difficulty }) => {
    setFilters({ category, difficulty });
  }, []);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  return (
    <div className="home-container" style={{ background: "#14141E" }}>
      <Sidebar />

      <div className="home-content" style={{ position: "relative", zIndex: 1 }}>
        {/* Top-left background glow */}
        <div
          style={{
            position: "absolute",
            top: "-270px",
            left: "-50px",
            width: "420px",
            height: "420px",
            background:
              "radial-gradient(circle at center, rgba(250, 78, 253, 0.35), rgba(250, 78, 253, 0.15), transparent 70%)",
            filter: "blur(90px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div className="home-content-wrapper">
          <div className="home-header">
            <h1 className="home-title">Browse Projects</h1>
          </div>

          <SearchBar
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
          />

          {/* <div className="results-info">
            {filteredPosts.length}{" "}
            {filteredPosts.length === 1 ? "project" : "projects"} found
          </div> */}

          <Grid posts={filteredPosts} />
        </div>
      </div>
    </div>
  );
}
