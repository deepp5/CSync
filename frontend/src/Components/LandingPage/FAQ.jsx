import React, { useState } from 'react';

const FAQ = () => {
  // State to track which FAQ item is currently open
  // null means all are closed. Change to 0 if you want the first one open by default.
  const [openIndices, setOpenIndices] = useState([]);

  const toggleFAQ = (index) => {
    setOpenIndices(prevIndices => {
      if (prevIndices.includes(index)) {
        // If already open, remove it from the array
        return prevIndices.filter(i => i !== index);
      } else {
        // If closed, add it to the array
        return [...prevIndices, index];
      }
    });
  };

  const faqData = [
    {
      question: "What is CSync?",
      answer: "CSync is a collaboration hub for CS students where you can post project ideas, join other people’s projects, and build skills by working together in real time."
    },
    {
      question: "How is CSync different from GitHub or Reddit?",
      answer: "GitHub is for code hosting, and Reddit is for discussion — CSync is focused specifically on helping students collaborate, find teammates, and turn ideas into real projects."
    },
    {
      question: "Do I need prior coding experience to use CSync?",
      answer: "No. You can browse projects at any skill level, and many ideas are beginner-friendly. You can learn by joining other people’s projects or by posting your own."
    },
    {
      question: "How do I join someone else’s project?",
      answer: "Each project has a “Contact Creator” button that lets you message the project owner directly. If they accept, you’ll be added to the team."
    },
    {
        question: "How do I post a project idea?",
        answer: "After creating an account, you can fill out the “New Project” form with a title, description, tech stack, and desired collaborators. It appears instantly for others to see."
    },
    {
        question: "Is my project idea safe from being copied?",
        answer: "Your posts are visible to all users, but CSync encourages collaboration rather than competition. You can also mark certain details private and share them only with accepted collaborators."
    },
    {
        question: "How do I contact another user?",
        answer: "You can send private messages through CSync’s built-in messaging system or request to join their project directly from their post."
    },
    {
        question: "Do I need an account to browse CSync?",
        answer: "Yes. You must create an account to browse and interact with CSync. Accounts help us provide personalized feeds, protect user data, reduce spam, and enable community features (messaging, joining projects, saving favorites)."
    }

  ];

    return (
        <div className="w-full py-20 px-4 md:px-12 relative z-10 bg-[#000000]" id="faq">
        
        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
            FAQ
            </h2>
        </div>

        {/* Questions List */}
        <div className="max-w-3xl mx-auto space-y-4">
            {faqData.map((item, index) => {
            const isOpen = openIndices.includes(index);
            
            return (
                <div key={index} className="group">
                {/* Question Bar - Glassmorphism Style */}
                <button
                    onClick={() => toggleFAQ(index)}
                    className={`
                    w-full flex justify-between items-center p-6 
                    bg-[rgba(255,255,255,0.07)] backdrop-blur-[20px] 
                    border-2 border-white/10
                    text-left 
                    transition-all duration-300 ease-in-out
                    hover:bg-[rgba(255,255,255,0.1)]
                    ${isOpen 
                        ? 'rounded-t-[20px] border-b-0' 
                        : 'rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)]'}
                    `}
                >
                    <span className="text-lg font-semibold text-white">
                    {item.question}
                    </span>
                    
                    {/* Animated Icon */}
                    <span className={`
                    flex items-center justify-center w-8 h-8 rounded-full 
                    transition-all duration-300
                    ${isOpen 
                        ? 'bg-white/20 text-white rotate-180' 
                        : 'bg-white/10 text-gray-300'}
                    `}>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    </span>
                </button>

                {/* Answer Dropdown - Glassmorphism Style */}
                <div 
                    className={`
                    bg-[rgba(255,255,255,0.07)] backdrop-blur-[20px]
                    border-2 border-white/10 border-t-0
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen 
                        ? 'max-h-48 opacity-100 rounded-b-[20px] mb-4' 
                        : 'max-h-0 opacity-0 border-none'}
                    `}
                >
                    <div className="p-6 pt-2 text-gray-300 leading-relaxed">
                    {item.answer}
                    </div>
                </div>
                </div>
            );
            })}
        </div>
        </div>
  );
};

export default FAQ;