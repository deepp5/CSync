// Features.jsx
import React, { useState } from "react";

const features = [
  {
    key: "discover",
    eyebrow: "Find your next build",
    title: "Discover projects worth joining",
    desc: "Browse real student projects by category, difficulty, tech stack, and deadlines — no noise, just build-ready ideas.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    accent: "from-cyan-400 via-blue-500 to-indigo-500",
    bullets: ["Categories + difficulty", "Tech stack shown upfront", "Deadlines for urgency"],
  },
  {
    key: "post",
    eyebrow: "Turn an idea into a post",
    title: "Post a project in minutes",
    desc: "Publish your project with a clear summary, full description, tech stack, and links — so the right people reach out.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accent: "from-fuchsia-400 via-pink-500 to-rose-500",
    bullets: ["Title + header + description", "GitHub / live links", "Visibility controls"],
  },
  {
    key: "profiles",
    eyebrow: "Trust, quickly",
    title: 'Profiles that make people say "bet"',
    desc: "Show skills, bio, and links so teammates can instantly see who you are and what you can do.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    accent: "from-emerald-400 via-teal-500 to-cyan-500",
    bullets: ["Skills + bio", "GitHub + LinkedIn", "Public profiles"],
  },
  {
    key: "follow",
    eyebrow: "Build your circle",
    title: "Follow builders you respect",
    desc: "Follow people, check their work, and keep up with what they ship. It's networking without the cringe.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 7a4 4 0 11-8 0 4 4 0 018 0zM21 20v-2a4 4 0 00-3-3.87M3 20v-2a4 4 0 013-3.87"
          />
      </svg>
    ),
    accent: "from-amber-300 via-orange-500 to-red-500",
    bullets: ["Grow connections", "Profile listing"],
  },
  {
    key: "feedback",
    eyebrow: "Keep collaboration in one place",
    title: "Likes + comments for momentum",
    desc: "Validate ideas and refine projects with feedback right under the post — where it belongs.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    accent: "from-violet-400 via-purple-500 to-fuchsia-500",
    bullets: ["Comments for questions", "Likes to surface quality", "Better project discovery"],
  },
  {
    key: "dm",
    eyebrow: "Close the loop",
    title: "Message creators instantly",
    desc: "DM to join a team, ask questions, or coordinate details — without leaving the platform.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    accent: "from-cyan-400 via-blue-500 to-indigo-500",
    bullets: ["Direct messages", "Team coordination", "Quick responses"],
  },
];

const Features = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <section id="features" className="relative py-24 lg:py-32 px-6 bg-black">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.05) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-cyan-400 font-medium text-sm uppercase tracking-wider mb-4">Features</p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="text-white">Everything you need to</span>{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #22d3ee 0%, #d946ef 100%)" }}
            >
              collaborate
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            From discovering projects to messaging teammates, CSync handles the full workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="group relative p-6 lg:p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-cyan-400/40 transition-all duration-500 hover:-translate-y-2"
              onMouseEnter={() => setHoveredCard(feature.key)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                {feature.icon}
              </div>

              {/* Eyebrow */}
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">{feature.eyebrow}</p>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed mb-5">{feature.desc}</p>

              {/* Bullets */}
              <ul className="space-y-2">
                {feature.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.accent}`} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
