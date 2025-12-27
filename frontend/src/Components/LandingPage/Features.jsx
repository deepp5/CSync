import React, { useMemo, useState } from "react";
import {
  FiCompass,
  FiPlus,
  FiUser,
  FiUsers,
  FiMessageSquare,
  FiHeart,
  FiMessageCircle,
  FiTag,
  FiClock,
  FiLock,
} from "react-icons/fi";

export default function FeaturesPage() {
  const features = useMemo(
    () => [
      {
        key: "discover",
        eyebrow: "Find your next build",
        title: "Discover projects worth joining",
        desc: "Browse real student projects by category, difficulty, tech stack, and deadlines — no noise, just build-ready ideas.",
        icon: FiCompass,
        accent: "from-cyan-400 via-blue-500 to-indigo-500",
        bullets: ["Categories + difficulty", "Tech stack shown upfront", "Deadlines for urgency"],
      },
      {
        key: "post",
        eyebrow: "Turn an idea into a post",
        title: "Post a project in minutes",
        desc: "Publish your project with a clear summary, full description, tech stack, and links — so the right people reach out.",
        icon: FiPlus,
        accent: "from-fuchsia-400 via-pink-500 to-rose-500",
        bullets: ["Title + header + description", "GitHub / live links", "Visibility controls"],
      },
      {
        key: "profiles",
        eyebrow: "Trust, quickly",
        title: "Profiles that make people say “bet”",
        desc: "Show skills, bio, and links so teammates can instantly see who you are and what you can do.",
        icon: FiUser,
        accent: "from-emerald-400 via-teal-500 to-cyan-500",
        bullets: ["Skills + bio", "GitHub + LinkedIn", "Clickable profiles everywhere"],
      },
      {
        key: "follow",
        eyebrow: "Build your circle",
        title: "Follow builders you respect",
        desc: "Follow people, check their work, and keep up with what they ship. It’s networking without the cringe.",
        icon: FiUsers,
        accent: "from-amber-300 via-orange-500 to-red-500",
        bullets: ["Grow connections", "Instant count updates", "Profile discovery via lists"],
      },
      {
        key: "feedback",
        eyebrow: "Keep collaboration in one place",
        title: "Likes + comments for momentum",
        desc: "Validate ideas and refine projects with feedback right under the post — where it belongs.",
        icon: FiMessageCircle,
        accent: "from-violet-400 via-purple-500 to-fuchsia-500",
        bullets: ["Comments for questions", "Likes to surface quality", "Better project discovery"],
      },
      {
        key: "dm",
        eyebrow: "Close the loop",
        title: "Message creators instantly",
        desc: "DM to join a team, ask questions, or coordinate details — without leaving the platform.",
        icon: FiMessageSquare,
        accent: "from-sky-400 via-cyan-500 to-teal-500",
        bullets: ["Direct messaging", "Fast collaboration", "Less context switching"],
      },
    ],
    []
  );

  const [active, setActive] = useState(features[0]);

  const ActiveIcon = active.icon;

  return (
    <section id="features" className="relative bg-black py-20 overflow-hidden">
      {/* Background: subtle grid + glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute -bottom-52 right-1/4 h-[520px] w-[520px] rounded-full bg-fuchsia-500/18 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-10">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-green-400/80" />
            Built for CS students who want to ship
          </div>

          <h2 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            One place to <span className="text-white/70">find teammates</span>,{" "}
            <span className="text-white/70">build projects</span>, and{" "}
            <span className="text-white/70">grow your network</span>.
          </h2>

          <p className="mt-4 text-base md:text-lg text-white/70 leading-relaxed">
            CSync helps you go from “I want to build something” to “we shipped it” —
            with real projects, real profiles, and real collaboration tools.
          </p>
        </div>

        {/* Main layout */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Live preview (sticky on desktop) */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl overflow-hidden">
              {/* animated gradient strip */}
              <div className="absolute inset-x-0 top-0 h-24 opacity-70">
                <div
                  className={`h-full w-full bg-gradient-to-r ${active.accent} blur-[18px]`}
                />
              </div>

              {/* chrome bar */}
              <div className="relative flex items-center gap-2 px-5 pt-5">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-white/20" />
                  <span className="h-3 w-3 rounded-full bg-white/20" />
                  <span className="h-3 w-3 rounded-full bg-white/20" />
                </div>
                <div className="ml-3 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/50">
                  csync.com/{active.key}
                </div>
              </div>

              {/* content */}
              <div className="relative px-6 pb-7 pt-6">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/50">
                      {active.eyebrow}
                    </div>
                    <div className="mt-2 text-2xl md:text-3xl font-extrabold text-white">
                      {active.title}
                    </div>
                    <div className="mt-3 text-sm md:text-base text-white/70 leading-relaxed">
                      {active.desc}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`h-12 w-12 rounded-2xl border border-white/10 bg-gradient-to-br ${active.accent} flex items-center justify-center shadow-lg`}
                    >
                      <ActiveIcon className="text-white text-xl" />
                    </div>
                  </div>
                </div>

                {/* “mini UI” preview that changes */}
                <div className="mt-7 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                  <PreviewUI featureKey={active.key} accent={active.accent} />
                </div>

                {/* bullets */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {active.bullets.map((b) => (
                    <div
                      key={b}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70"
                    >
                      {b}
                    </div>
                  ))}
                </div>

                {/* micro benefits */}
                <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/60">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                    <FiTag /> Tech stack clarity
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                    <FiClock /> Deadlines for urgency
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                    <FiLock /> Public / private visibility
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Feature rail (not cards) */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/10">
                <div className="text-sm font-semibold text-white">
                  Explore what you can do
                </div>
                <div className="mt-1 text-sm text-white/60">
                  Click any feature — the preview updates instantly.
                </div>
              </div>

              <div className="divide-y divide-white/10">
                {features.map((f, idx) => {
                  const Icon = f.icon;
                  const isActive = f.key === active.key;

                  return (
                    <button
                      key={f.key}
                      onClick={() => setActive(f)}
                      className={`group w-full text-left px-6 py-5 transition-colors ${
                        isActive
                          ? "bg-white/[0.06]"
                          : "hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* index */}
                        <div className="mt-1 w-10 shrink-0 text-white/40 font-mono text-sm">
                          {String(idx + 1).padStart(2, "0")}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center transition-all ${
                                  isActive
                                    ? `bg-gradient-to-br ${f.accent} border-white/20`
                                    : "group-hover:border-white/20"
                                }`}
                              >
                                <Icon
                                  className={`text-lg ${
                                    isActive ? "text-white" : "text-white/80"
                                  }`}
                                />
                              </div>

                              <div>
                                <div className="text-xs uppercase tracking-widest text-white/50">
                                  {f.eyebrow}
                                </div>
                                <div className="mt-1 text-lg font-bold text-white">
                                  {f.title}
                                </div>
                              </div>
                            </div>

                            {/* active indicator */}
                            <div className="shrink-0">
                              <div
                                className={`h-2.5 w-2.5 rounded-full transition-all ${
                                  isActive ? "bg-cyan-400" : "bg-white/20"
                                }`}
                              />
                            </div>
                          </div>

                          <p className="mt-3 text-sm text-white/65 leading-relaxed max-w-xl">
                            {f.desc}
                          </p>

                          {/* sleek underline */}
                          <div className="mt-4 h-px w-full bg-white/10 relative overflow-hidden">
                            {isActive && (
                              <div
                                className={`absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r ${f.accent}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA (non-card, clean strip) */}
            <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.06] to-white/[0.03] px-6 py-6 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-extrabold text-white">
                    Build faster with the right people.
                  </div>
                  <div className="mt-1 text-sm text-white/70">
                    Post a project, follow builders, then message and ship.
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <a
                    href="/register"
                    className="flex-1 md:flex-none text-center rounded-2xl bg-white text-black px-5 py-2.5 font-bold text-sm hover:opacity-90 transition"
                  >
                    Get started
                  </a>
                  <a
                    href="/login"
                    className="flex-1 md:flex-none text-center rounded-2xl border border-white/15 bg-white/10 px-5 py-2.5 font-semibold text-sm text-white hover:bg-white/15 transition"
                  >
                    Sign in
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Mini preview UI — no images, looks like a real product */
function PreviewUI({ featureKey, accent }) {
  // A few simple “UI scenes” that look good and communicate the feature.
  if (featureKey === "discover") {
    return (
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/60">Explore</div>
          <div className={`text-[11px] px-2 py-1 rounded-full bg-gradient-to-r ${accent} text-white`}>
            Filters
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${accent} opacity-80`} />
              <div className="flex-1">
                <div className="h-3 w-2/3 rounded bg-white/15" />
                <div className="mt-2 h-2 w-5/6 rounded bg-white/10" />
                <div className="mt-3 flex gap-2">
                  <span className="h-6 w-16 rounded-full bg-white/10" />
                  <span className="h-6 w-20 rounded-full bg-white/10" />
                  <span className="h-6 w-14 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="text-[11px] text-white/50">BEGINNER</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (featureKey === "post") {
    return (
      <div className="p-5">
        <div className="text-xs text-white/60">Create Post</div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="h-3 w-1/2 rounded bg-white/15" />
          <div className="mt-2 h-2 w-4/5 rounded bg-white/10" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["Tech", "Category", "Deadline"].map((t) => (
              <div key={t} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <div className="text-[10px] text-white/50">{t}</div>
                <div className="mt-2 h-2 w-2/3 rounded bg-white/15" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              <span className="h-7 w-24 rounded-xl bg-white/10" />
              <span className="h-7 w-20 rounded-xl bg-white/10" />
            </div>
            <div className={`h-9 w-32 rounded-2xl bg-gradient-to-r ${accent}`} />
          </div>
        </div>
      </div>
    );
  }

  if (featureKey === "profiles") {
    return (
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${accent}`} />
          <div className="flex-1">
            <div className="h-3 w-1/3 rounded bg-white/15" />
            <div className="mt-2 h-2 w-1/2 rounded bg-white/10" />
            <div className="mt-3 flex gap-2">
              <span className="h-6 w-16 rounded-full bg-white/10" />
              <span className="h-6 w-14 rounded-full bg-white/10" />
              <span className="h-6 w-20 rounded-full bg-white/10" />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs text-white/60">Skills</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["React", "Node", "Prisma", "Postgres", "UI"].map((s) => (
              <span key={s} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (featureKey === "follow") {
    return (
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/60">Network</div>
          <div className={`h-9 w-28 rounded-2xl bg-gradient-to-r ${accent}`} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[11px] text-white/50">Followers</div>
            <div className="mt-2 text-2xl font-extrabold text-white">128</div>
            <div className="mt-3 h-2 w-2/3 rounded bg-white/10" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[11px] text-white/50">Following</div>
            <div className="mt-2 text-2xl font-extrabold text-white">42</div>
            <div className="mt-3 h-2 w-1/2 rounded bg-white/10" />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs text-white/60">People you follow</div>
          <div className="mt-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${accent} opacity-75`} />
                <div className="flex-1">
                  <div className="h-2 w-1/3 rounded bg-white/15" />
                  <div className="mt-2 h-2 w-1/2 rounded bg-white/10" />
                </div>
                <FiHeart className="text-white/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (featureKey === "feedback") {
    return (
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/60">Post feedback</div>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <FiHeart /> 24
            <span className="mx-1">•</span>
            <FiMessageCircle /> 8
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="h-3 w-2/3 rounded bg-white/15" />
          <div className="mt-2 h-2 w-5/6 rounded bg-white/10" />
          <div className="mt-2 h-2 w-4/5 rounded bg-white/10" />

          <div className="mt-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-1/4 rounded bg-white/15" />
                  <div className="text-[10px] text-white/40">just now</div>
                </div>
                <div className="mt-2 h-2 w-5/6 rounded bg-white/10" />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-10 flex-1 rounded-2xl border border-white/10 bg-white/[0.03]" />
            <div className={`h-10 w-24 rounded-2xl bg-gradient-to-r ${accent}`} />
          </div>
        </div>
      </div>
    );
  }

  // dm
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/60">Messages</div>
        <div className="text-[11px] text-white/45">online</div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex justify-start">
          <div className="max-w-[78%] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80">
            Hey! I’m interested in joining — what’s the tech stack?
          </div>
        </div>

        <div className="flex justify-end">
          <div className={`max-w-[78%] rounded-2xl bg-gradient-to-r ${accent} px-4 py-3 text-sm text-white`}>
            React + Prisma + Supabase. Want to hop in?
          </div>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[78%] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80">
            Yep — send the repo link and I’ll start tonight.
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/[0.03]" />
        <div className={`h-11 w-28 rounded-2xl bg-gradient-to-r ${accent}`} />
      </div>
    </div>
  );
}
