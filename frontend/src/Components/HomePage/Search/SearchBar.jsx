import React, { useEffect, useRef, useState } from "react";

// SVG Icons as components
const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default function SearchBar({
  onFilterChange = () => {},
  onSearchChange = () => {},
  categories = [
    { label: "All", value: "" },
    { label: "Web Development", value: "WEB_DEVELOPMENT" },
    { label: "Mobile", value: "MOBILE" },
    { label: "AI / ML", value: "AI_ML" },
    { label: "Game Dev", value: "GAME_DEV" },
    { label: "Systems", value: "SYSTEMS" },
    { label: "Other", value: "OTHER" },
  ],
  difficulties = [
    { label: "All", value: "" },
    { label: "Beginner", value: "BEGINNER" },
    { label: "Intermediate", value: "INTERMEDIATE" },
    { label: "Advanced", value: "ADVANCED" },
  ],
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const filterRef = useRef(null);

  // ✅ keep latest callbacks without triggering effects
  const onFilterChangeRef = useRef(onFilterChange);
  const onSearchChangeRef = useRef(onSearchChange);

  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryChange = (e) => {
    const next = e.target.value;
    setCategory(next);
    onFilterChangeRef.current({ category: next, difficulty });
  };

  const handleDifficultyChange = (e) => {
    const next = e.target.value;
    setDifficulty(next);
    onFilterChangeRef.current({ category, difficulty: next });
  };

  const handleSearchInput = (e) => {
    const next = e.target.value;
    setSearchQuery(next);
    onSearchChangeRef.current(next);
  };

  const handleReset = () => {
    setCategory("");
    setDifficulty("");
    onFilterChangeRef.current({ category: "", difficulty: "" });
  };

  const activeFiltersCount = [category, difficulty].filter(Boolean).length;

  return (
    <div style={styles.searchContainer}>
      <div style={styles.searchBarWrapper}>
        <div style={styles.searchIcon}>
          <SearchIcon />
        </div>
        <input
          style={styles.searchInput}
          placeholder="Search projects..."
          type="text"
          value={searchQuery}
          onChange={handleSearchInput}
        />
      </div>

      <div style={styles.filterContainer} ref={filterRef}>
        <button
          style={styles.filterBtn}
          onClick={() => setShowFilters((s) => !s)}
          type="button"
        >
          Filters
          {activeFiltersCount > 0 && (
            <span style={styles.filterBadge}>{activeFiltersCount}</span>
          )}
          <div
            style={{
              ...styles.chevron,
              transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <ChevronDownIcon />
          </div>
        </button>

        {showFilters && (
          <div style={styles.filterDropdown}>
            <div style={styles.filterHeader}>
              <h3 style={styles.filterTitle}>Filter Projects</h3>
              {activeFiltersCount > 0 && (
                <button
                  style={styles.resetBtn}
                  type="button"
                  onClick={handleReset}
                >
                  Reset
                </button>
              )}
            </div>

            <div style={styles.filterSection}>
              <label style={styles.filterLabel}>Category</label>
              <select
                style={styles.filterSelect}
                value={category}
                onChange={handleCategoryChange}
              >
                {categories.map((c) => (
                  <option key={c.value || "ALL"} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.filterSection}>
              <label style={styles.filterLabel}>Difficulty</label>
              <select
                style={styles.filterSelect}
                value={difficulty}
                onChange={handleDifficultyChange}
              >
                {difficulties.map((d) => (
                  <option key={d.value || "ALL"} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  searchContainer: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginTop: "24px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  searchBarWrapper: {
    flex: 1,
    minWidth: "280px",
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(255, 255, 255, 0.5)",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px 12px 45px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    fontSize: "15px",
    color: "#e8e8e8",
    transition: "all 0.3s ease",
    outline: "none",
  },
  filterContainer: {
    position: "relative",
  },
  filterBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "rgba(250, 78, 253, 0.05)",
    color: "rgba(250, 78, 253, 0.8)",
    borderRadius: "999px",
    border: "1px solid rgba(250, 78, 253, 0.3)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.25s ease",
    position: "relative",
  },
  filterBadge: {
    background: "#fa4efd",
    color: "#000",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "600",
    marginLeft: "4px",
  },
  chevron: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.3s ease",
  },
  filterDropdown: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: "0",
    background: "rgba(20, 20, 30, 0.95)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "20px",
    minWidth: "280px",
    zIndex: 1000,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  },
  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  filterTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
    margin: 0,
  },
  resetBtn: {
    background: "transparent",
    border: "none",
    color: "#fa4efd",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "opacity 0.2s ease",
  },
  filterSection: {
    marginBottom: "16px",
  },
  filterLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: "8px",
  },
  filterSelect: {
    width: "100%",
    padding: "10px 12px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#e8e8e8",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.2s ease",
  },
};
