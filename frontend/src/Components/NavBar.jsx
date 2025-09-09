import React, { useState, useRef } from 'react';
import whiteCSync from '../assets/whiteCSync.png';
import './NavBar.css';



export default function NavBar() {
    
    //use this for login/signup part of the navigation for backend maybe?
    //const handleNavBarClick = (section) => {
        // slowly move to the section that was clicked on
    //}
    
    const sectionRef = useRef(null);
    const handleNavClick = () => {
        sectionRef.current?.scrollIntoView(
            {behavior: 'smooth'}
        );
    }
    return(
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <div className="logo">
                <a href="/" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}>
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
                <button className="auth-btn login-btn" onClick={() => handleNavClick('login')}>Login</button>
                <button className="auth-btn signup-btn" onClick={() => handleNavClick('signup')}>Sign Up</button>
                </div>
            </div>
        </nav>
    );
}