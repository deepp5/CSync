import React from "react";
import Sidebar from "../Components/Sidebar/Sidebar";
import SearchBar from "../Components/HomePage/Search/SearchBar";
import Grid from "../Components/HomePage/Grid/Grid";
import "../Components/HomePage/HomePage.css";

export default function HomePage() {
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