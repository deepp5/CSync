// Sidebar.jsx
import React, { useState, useEffect } from "react";
import "./Sidebar.css";
import whiteCSync from "../../assets/colorCSync.png";
import {
  FiHome,
  FiMessageSquare,
  FiPlusSquare,
  FiUser,
  FiSettings,
  FiList,
  FiMenu,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { prefetchMyProjects } from "../../utils/prefetchProjects";
import { supabase } from "../../supabaseClient";
import { API_BASE_URL } from "../../api";

const API_BASE = API_BASE_URL;

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [myUsername, setMyUsername] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    const loadMe = async () =>{
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if(!token) return;
      const res = await fetch(`${API_BASE}/api/profile/me`,{
        headers: { Authorization: `Bearer ${token}`},
      });
      if(!res.ok) return;
      const me = await res.json();
      setMyUsername(me.username);
    };
    loadMe();

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Notify other components about sidebar state
  useEffect(() => {
    document.body.setAttribute("data-sidebar-open", isOpen);
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button - Shows when sidebar is closed */}
      {!isOpen && (
        <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
          <FiMenu />
        </button>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        {/* Logo */}
        <div
          className="sidebar-logo"
          onClick={() => (window.location.href = "/home")}
        >
          <img src={whiteCSync} className="logo-img" alt="CSync Logo" />
          {isOpen && <h2>CSync</h2>}
        </div>

        {/* Navigation */}
        <div className="sidebar-links">
          <Link className="sidebar-btn" to="/home">
            <FiHome className="icon" />
            {isOpen && <span>Home</span>}
          </Link>

          <Link className="sidebar-btn" to="/messages">
            <FiMessageSquare className="icon" />
            {isOpen && <span>Messages</span>}
          </Link>

          <Link 
            className="sidebar-btn" 
            to="/myproject"
            onMouseEnter={() => prefetchMyProjects()}
          >
            <FiList className="icon" /> My Projects
          </Link>

          <Link className="sidebar-btn" to="/createpost">
            <FiPlusSquare className="icon" />
            {isOpen && <span>Create Post</span>}
          </Link>
        </div>
        

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          <Link className="sidebar-btn profile-btn" to={myUsername ? `/profile/${myUsername}` : "/home"}>
            <FiUser className="icon" />
            {isOpen && <span>Profile</span>}
          </Link>

          <Link className="sidebar-btn profile-btn" to="/settings">
            <FiSettings className="icon" />
            {isOpen && <span>Settings</span>}
          </Link>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </>
  );
};

export default Sidebar;
