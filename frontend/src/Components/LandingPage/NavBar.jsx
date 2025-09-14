import React, { useState, useRef } from 'react';
import { Link } from "react-router-dom";
import { useEffect } from 'react';
import whiteCSync from '../../assets/whiteCSync.png';
import './NavBar.css';



export default function NavBar() {
    
    
    //const [scrollY, setScrollY] = useState(0);
    const sectionRefs = useRef({});
    const sections = ['home', 'about', 'features', 'faq', 'contact'];
    
    const handleNavClick = (sectionName) => {
    
      const element = document.getElementById(sectionName);
      
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    
  };
    return(
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <div className="logo">
                <a href="#home" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}>
                    <img src={whiteCSync} alt="Logo" className="logo-img" />
                    <span className="logo-text">CSync</span>
                </a>
                </div>

                {/* Navigation Links */}
                <div className="nav-menu">
                    <ul className="nav-menu-list">
                        <li className="nav-item">
                        <a href="#about" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('about'); }}>About</a>
                        </li>
                        <li className="nav-item">
                        <a href="#features" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('features'); }}>Features</a>
                        </li>
                        <li className="nav-item">
                        <a href="#faq" className="nav-link" onClick={(e) => { e.preventDefault(); handleNavClick('faq'); }}>FAQ</a>
                        </li>
                        <li className="nav-item">
                        <a href="#contact" className="nav-link" id="contact" onClick={(e) => { e.preventDefault(); handleNavClick('contact'); }}>Contact</a>
                        </li>
                    </ul>
                </div>

                {/* Auth Buttons */}
                <div className="auth-buttons">
                    <Link className="auth-btn login-btn" to="/login">Sign In</Link>
                    <Link className="auth-btn login-btn" to="/register">Sign Up</Link>
                </div>
            </div>
        </nav>
    );
}