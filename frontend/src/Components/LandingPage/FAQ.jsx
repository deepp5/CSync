// FAQ.jsx
import React, { useState } from "react";

const faqData = [
  {
    question: "What is CSync?",
    answer:
      "CSync is a collaboration hub for CS students where you can post project ideas, join other people's projects, and build skills by working together in real time.",
  },
  {
    question: "How is CSync different from GitHub or Reddit?",
    answer:
      "GitHub is for code hosting, and Reddit is for discussion — CSync is focused specifically on helping students collaborate, find teammates, and turn ideas into real projects.",
  },
  {
    question: "Do I need prior coding experience to use CSync?",
    answer:
      "No. You can browse projects at any skill level, and many ideas are beginner-friendly. You can learn by joining other people's projects or by posting your own.",
  },
  {
    question: "How do I join someone else's project?",
    answer:
      'Each project has a "Contact Creator" button that lets you message the project owner directly. If they accept, you\'ll be added to the team.',
  },
  {
    question: "How do I post a project idea?",
    answer:
      'After creating an account, you can fill out the "New Project" form with a title, description, tech stack, and desired collaborators. It appears instantly for others to see.',
  },
  {
    question: "Is my project idea safe from being copied?",
    answer:
      "Your posts are visible to all users, but CSync encourages collaboration rather than competition. You can also mark certain details private and share them only with accepted collaborators.",
  },
  {
    question: "How do I contact another user?",
    answer:
      "You can send private messages through CSync's built-in messaging system or request to join their project directly from their post.",
  },
  {
    question: "Do I need an account to browse CSync?",
    answer:
      "Yes. You must create an account to browse and interact with CSync. Accounts help us provide personalized feeds, protect user data, reduce spam, and enable community features.",
  },
];

const FAQ = () => {
  const [openIndices, setOpenIndices] = useState([]);

  const toggleFAQ = (index) => {
    setOpenIndices((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  return (
    <section id="faq" className="relative py-24 lg:py-32 px-6 bg-black">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-cyan-400 font-medium text-sm uppercase tracking-wider mb-4">FAQ</p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #ffffff 0%, #a3a3a3 100%)" }}
            >
              Frequently asked questions
            </span>
          </h2>
          <p className="text-gray-400 text-lg">Everything you need to know about CSync.</p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqData.map((item, index) => {
            const isOpen = openIndices.includes(index);
            return (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-white pr-4">{item.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96" : "max-h-0"}`}>
                  <p className="px-6 pb-6 text-gray-400 leading-relaxed">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
