import React from "react";
import "./SearchBar.css";

export default function SearchBar() {
    return (
        <div className="search-container">
            <input
                className="search-input"
                placeholder="Search projects..."
                type="text"
            />
            <button className="filter-btn">Filters</button>
        </div>
    );
}