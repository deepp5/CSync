// Hero.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"
const HeroPage = () => {
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
    >


      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 bg-white/5 backdrop-blur-xl border border-white/10"
          style={{ animation: "fadeIn 0.6s ease-out forwards" }}
        >
          <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <span className="text-sm text-gray-400">The collaboration hub for CS students</span>
        </div>

        {/* Main Title */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6"
          style={{ animation: "fadeIn 0.6s ease-out 0.2s forwards", opacity: 0 }}
        >
          <span className="text-white">Built by engineers</span>
          <span className="text-fuchsia-400">,</span>
          <br />
          <span className="text-white">for engineers</span>
          <span className="text-cyan-400">.</span>
        </h1>

        {/* Subtitle with typewriter effect */}
        <div className="h-8 mb-10" style={{ animation: "fadeIn 0.6s ease-out 0.4s forwards", opacity: 0 }}>
          <p className="text-lg sm:text-xl text-gray-400">
            Created to bring people closer, one project at a time
            <span
              className={`inline-block w-0.5 h-5 ml-1 bg-gray-400 align-middle transition-opacity ${
                showCursor ? "opacity-100" : "opacity-0"
              }`}
            />
          </p>
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ animation: "fadeIn 0.6s ease-out 0.6s forwards", opacity: 0 }}
        >
          <Link to="/register"
            className="group inline-flex items-center gap-2 px-10 py-4 text-lg font-semibold text-black rounded-xl transition-all hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)" }}
          >
            Get Started
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          {/* <button className="px-10 py-4 text-lg font-semibold text-white border border-white/20 rounded-xl bg-transparent hover:bg-white/5 hover:border-white/40 transition-all">
            Explore Projects
          </button> */}
        </div>

        {/* Stats */}
        {/* <div
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 mt-16 pt-8 border-t border-white/10"
          style={{ animation: "fadeIn 0.6s ease-out 0.8s forwards", opacity: 0 }}
        >
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-white">500+</p>
            <p className="text-sm text-gray-400 mt-1">Active Projects</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-white">2K+</p>
            <p className="text-sm text-gray-400 mt-1">Engineers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-bold text-white">150+</p>
            <p className="text-sm text-gray-400 mt-1">Universities</p>
          </div>
        </div> */}
      </div>

      {/* Scroll indicator */}
      {/* <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: "fadeIn 0.6s ease-out 0.8s forwards", opacity: 0 }}>
        <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-2">
          <div className="w-1.5 h-2.5 bg-gray-500 rounded-full animate-bounce" />
        </div>
      </div> */}

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default HeroPage;
