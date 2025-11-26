import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser'; // TODO: Uncomment this line for local use after installing the package

export default function ContactUs() {
  const form = useRef();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });

  // New state to track if the form has been submitted
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // TODO: Replace these placeholders with your actual EmailJS credentials
    const serviceId = 'service_t6cvj1z';
    const templateId = 'template_1cgqqii';
    const publicKey = 'TtaMH910PO0t_dmIA';

    // // --- START PREVIEW SIMULATION ---
    // // Since @emailjs/browser isn't installed in this preview environment,
    // // we simulate a successful network request so you can see the UI change.
    // console.log("Simulating email send for preview...");
    // setTimeout(() => {
    //     console.log('SUCCESS!');
    //     setIsSubmitted(true);
    // }, 1000);
    // // --- END PREVIEW SIMULATION ---



    // Make sure to run: npm install @emailjs/browser

    emailjs.sendForm(serviceId, templateId, form.current, publicKey)
      .then((result) => {
          console.log('SUCCESS!', result.text);
          setIsSubmitted(true);
      }, (error) => {
          console.log('FAILED...', error.text);
          setErrorMessage("Something went wrong. Please try again later or email us directly.");
      });
    
  };

  return (
    <div className="min-h-screen w-full bg-black py-20 px-4 md:px-12 flex items-center justify-center relative z-10" id="contact">
      
      <div className="max-w-6xl w-full flex flex-col md:flex-row gap-12 md:gap-20">
        
        {/* Left Side - Text & Socials */}
        <div className="w-full md:w-5/12 flex flex-col justify-center text-white">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Get in Touch
          </h2>
          
          <h3 className="text-2xl text-[#9172f8] mb-6 font-medium">
            I'd like to hear from you!
          </h3>
          
          <p className="text-gray-300 text-lg leading-relaxed mb-12">
            If you have any inquiries regarding CSync, partnership opportunities, or just want to say hi, please use the contact form!
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="vp829252@gmail.com" className="hover:underline">support@csync.com</a>
            </div>

            {/* Social Icons */}
            <div className="flex gap-6 mt-8">
              {/* LinkedIn */}
              <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-[#0077b5] transition-all duration-300 group">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-[#E1306C] transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468 4.08c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>

              {/* GitHub */}
              <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-[#333] transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>

            </div>
          </div>
        </div>

        {/* Right Side - Form OR Success Message */}
        <div className="w-full md:w-7/12">
          {!isSubmitted ? (
            <form 
              ref={form}
              onSubmit={handleSubmit}
              className="w-full bg-[rgba(255,255,255,0.07)] backdrop-blur-[20px] border-2 border-white/10 rounded-[20px] p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.1)] min-h-[500px]"
            >
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1">
                  <label className="block text-gray-300 text-sm font-medium mb-2">First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#9172f8] focus:ring-1 focus:ring-[#9172f8] transition-all"
                    placeholder="First Name"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-300 text-sm font-medium mb-2">Last Name</label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#9172f8] focus:ring-1 focus:ring-[#9172f8] transition-all"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">Email *</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#9172f8] focus:ring-1 focus:ring-[#9172f8] transition-all"
                  placeholder="email@example.com"
                />
              </div>

              <div className="mb-8">
                <label className="block text-gray-300 text-sm font-medium mb-2">Message</label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#9172f8] focus:ring-1 focus:ring-[#9172f8] transition-all resize-none"
                  placeholder="Your message here..."
                ></textarea>
              </div>

              <div className="flex justify-end flex-col items-end">
                <button 
                  type="submit"
                  className="bg-[#9172f8] text-white font-bold py-3 px-10 rounded-lg hover:bg-[#7b5de0] transition-colors duration-300 shadow-lg transform hover:scale-105"
                >
                  Send
                </button>
                {errorMessage && (
                  <p className="text-red-400 mt-2 text-sm">{errorMessage}</p>
                )}
              </div>
            </form>
          ) : (
            <div className="w-full bg-[rgba(255,255,255,0.07)] backdrop-blur-[20px] border-2 border-white/10 rounded-[20px] p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center min-h-[500px]">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-[#9172f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Feedback Received!</h3>
              <p className="text-gray-300 text-lg max-w-md">
                We have received your feedback. Thank you for reaching out to us. We will get back to you as soon as possible.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}