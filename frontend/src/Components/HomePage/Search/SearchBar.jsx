import React from "react";
import { FiSearch } from "react-icons/fi";
import "./SearchBar.css";

export default function SearchBar() {
    return (
        <div className="search-container">
            <div className="search-bar-wrapper">
                <FiSearch className="search-iconz" />
                <input
                    className="search-input"
                    placeholder="Search projects..."
                    type="text"
                />
            </div>
            <button className="filter-btn">Filters</button>
        </div>
    );
}