import React from "react";
import "./Sidebar.css";
import whiteCSync from '../../assets/colorCSync.png';
import { FiHome, FiMessageSquare, FiPlusSquare, FiUser, FiSettings, FiList } from "react-icons/fi";

const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* Logo */}
        <div className="sidebar-logo" onClick={() => window.location.href = "/home"}>
            <img src={whiteCSync} className="logo-img" />
            <h2>CSync</h2>
        </div>


      {/* Navigation */}
      <div className="sidebar-links">
        <button className="sidebar-btn">
          <FiHome className="icon" /> Home
        </button>

        <button className="sidebar-btn">
          <FiMessageSquare className="icon" /> Messages
        </button>

        <button className="sidebar-btn">
            <FiList className="icon" /> My Projects
        </button>

        <button className="sidebar-btn">
          <FiPlusSquare className="icon" /> Create Listing
        </button>
      </div>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        <button className="sidebar-btn profile-btn">
          <FiUser className="icon" /> Profile
        </button>

        <button className="sidebar-btn">
          <FiSettings className="icon" /> Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;