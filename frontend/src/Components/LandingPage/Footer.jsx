import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="relative bg-black border-t border-white/10 ">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-cyan-500/8 blur-[140px]" />
        <div className="absolute -top-40 right-1/4 h-[420px] w-[420px] rounded-full bg-fuchsia-500/8 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="text-white font-extrabold text-xl">CSync</div>
            <p className="mt-3 text-white/70 leading-relaxed max-w-md">
              A ship-focused builder network: post projects, follow builders, and message to form teams.
            </p>

            <div className="mt-6 flex gap-3">
              <Link
                to="/register"
                className="rounded-2xl bg-white text-black px-5 py-2.5 font-bold text-sm hover:opacity-90 transition"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-2.5 font-semibold text-sm text-white hover:bg-white/15 transition"
              >
                Log in
              </Link>
            </div>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <div className="text-white/80 font-bold text-sm">Explore</div>
              <div className="mt-3 space-y-2 text-sm">
                <button onClick={() => scrollTo("home")} className="text-white/60 hover:text-white transition">
                  Home
                </button>
                <br />
                <button onClick={() => scrollTo("features")} className="text-white/60 hover:text-white transition">
                  Features
                </button>
                <br />
                <button onClick={() => scrollTo("faq")} className="text-white/60 hover:text-white transition">
                  FAQ
                </button>
              </div>
            </div>

            <div>
              <div className="text-white/80 font-bold text-sm">Company</div>
              <div className="mt-3 space-y-2 text-sm">
                <button onClick={() => scrollTo("about")} className="text-white/60 hover:text-white transition">
                  About
                </button>
                <br />
                <button onClick={() => scrollTo("contact")} className="text-white/60 hover:text-white transition">
                  Contact
                </button>
              </div>
            </div>

            <div>
              <div className="text-white/80 font-bold text-sm">Legal</div>
              <div className="mt-3 space-y-2 text-sm">
                <span className="text-white/60">Privacy</span>
                <br />
                <span className="text-white/60">Terms</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-white/10 pt-6">
          <div className="text-xs text-white/50">
            © {new Date().getFullYear()} CSync. All rights reserved.
          </div>
          <div className="text-xs text-white/50">
            Built by engineers, for engineers.
          </div>
        </div>
      </div>
    </footer>
  );
}



// import React from "react";
// import "./Footer.css"

// export default function Footer(){
//     const year = 2025;

//     return (

//         <div className="footer-content">
//         {/* Left Side: Copyright */}
//         <div className="copyright">
//           &copy; {year} CSync. All rights reserved.
//         </div>

//         {/* Right Side: Links */}
//         <div className="footer-links">
//           <a href="/privacy" className="footer-link">Privacy</a>
//           <a href="/terms" className="footer-link">Terms</a>
//         </div>
//       </div>
//     );
// }