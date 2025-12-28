// About.jsx
import React from "react";

const About = () => {
  const highlights = [
    {
      icon: (
        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      title: "Real Projects",
      description: "Work on actual projects that matter, not just tutorials.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: "Find Your Team",
      description: "Connect with like-minded developers who share your vision.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Ship Together",
      description: "Turn ideas into reality with collaborative building.",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      title: "Learn Faster",
      description: "Grow your skills by building with experienced peers.",
    },
  ];

  return (
    <section id="about" className="relative py-24 lg:py-32 px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-cyan-400 font-medium text-sm uppercase tracking-wider mb-4">About CSync</p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #ffffff 0%, #a3a3a3 100%)" }}
            >
              Where ideas meet execution
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            CSync is the ultimate collaboration hub for CS students. Post your project ideas, discover opportunities to
            contribute, and build a portfolio that speaks louder than any resume.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="group p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-cyan-400/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(217, 70, 239, 0.2) 100%)",
                }}
              >
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Featured Quote */}
        <div className="mt-20 relative">
          <div className="p-8 sm:p-12 text-center relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            {/* Background gradient */}
            <div className="absolute inset-0 opacity-10" style={{ background: "linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" }} />
            <blockquote className="relative z-10">
              <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-white leading-relaxed mb-6">
                "Stop building alone. The best projects come from the best teams."
              </p>
              <footer className="text-gray-400">— The CSync Philosophy</footer>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
