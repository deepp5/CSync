import React from "react";
import "./Footer.css"

export default function Footer(){
    const year = 2025;

    return (

        <div className="footer-content">
        {/* Left Side: Copyright */}
        <div className="copyright">
          &copy; {year} CSync. All rights reserved.
        </div>

        {/* Right Side: Links */}
        <div className="footer-links">
          <a href="/privacy" className="footer-link">Privacy</a>
          <a href="/terms" className="footer-link">Terms</a>
        </div>
      </div>
    );
}