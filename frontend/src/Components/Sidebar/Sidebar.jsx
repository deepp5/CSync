import React from "react";
import "./Sidebar.css";
import whiteCSync from '../../assets/colorCSync.png';
import { FiHome, FiMessageSquare, FiPlusSquare, FiUser, FiSettings, FiList } from "react-icons/fi";
import { Link } from "react-router-dom";

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
        <Link className="sidebar-btn" to="/home">
          <FiHome className="icon" /> Home
        </Link>

        <button className="sidebar-btn">
          <FiMessageSquare className="icon" /> Messages
        </button>

        <Link className="sidebar-btn" to='/my-projects'>
            <FiList className="icon" /> My Projects
        </Link>

        <Link className="sidebar-btn" to="/createpost">
          <FiPlusSquare className="icon" /> Create Post
        </Link>
      </div>

      {/* Bottom Section */}
      <div className="sidebar-bottom">

        <Link className="sidebar-btn profile-btn" to="/profile">
          <FiUser className="icon" /> Profile
        </Link>

        <button className="sidebar-btn">
          <FiSettings className="icon" /> Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;