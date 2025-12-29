import React, { useState, useRef } from "react";
import emailjs from "@emailjs/browser";
import "./ContactUs.css";

export default function ContactUs() {
  const form = useRef();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  // New state to track if the form has been submitted
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const serviceId = "service_t6cvj1z";
    const templateId = "template_1cgqqii";
    const publicKey = "TtaMH910PO0t_dmIA";

    // Make sure to run: npm install @emailjs/browser

    emailjs.sendForm(serviceId, templateId, form.current, publicKey).then(
      (result) => {
        console.log("SUCCESS!", result.text);
        setIsSubmitted(true);
      },
      (error) => {
        console.log("FAILED...", error.text);
        setErrorMessage(
          "Something went wrong. Please try again later or email us directly."
        );
      }
    );
  };

  return (
    <div className="contact-section" id="contact">
      <div className="contact-wrapper">
        {/* Left Side - Text & Socials */}
        <div className="contact-info">
          {/* Radial Glow Blob */}
          <div className="glow-blob"></div>

          <h2 className="contact-title">Get in Touch</h2>

          <h3 className="contact-subtitle">I'd like to hear from you!</h3>

          <p className="contact-desc">
            If you have any inquiries regarding CSync, partnership
            opportunities, or just want to say hi, please use the contact form!
          </p>

          <div className="contact-email-link">
            {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"> */}
            {/* <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> */}
            {/* </svg> */}
            <a href="csyncteam@gmail.com">csyncteam@gmail.com</a>
          </div>

          {/* Social Icons */}
          <div className="social-icons">
            {/* LinkedIn */}
            <a href="#" className="social-btn linkedin">
              <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>

            {/* Instagram */}
            <a href="#" className="social-btn instagram" aria-label="Instagram">
              <svg
                viewBox="0 0 24 24"
                className="instagram-icon-filled"
                width="24"
                height="24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7 2C4.2386 2 2 4.2386 2 7v10c0 2.7614 2.2386 5 5 5h10c2.7614 0 5-2.2386 5-5V7c0-2.7614-2.2386-5-5-5H7zm5 5a5 5 0 110 10 5 5 0 010-10zm6.5-2a1.5 1.5 0 11.001 3.001A1.5 1.5 0 0118.5 5z" />
              </svg>
            </a>

            {/* GitHub */}
            <a href="#" className="social-btn github">
              <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Right Side - Form OR Success Message */}
        <div className="contact-form-wrapper">
          {!isSubmitted ? (
            <form ref={form} onSubmit={handleSubmit} className="glass-box">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="First Name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="email@example.com"
                />
              </div>

              <div className="form-group full-width last">
                <label className="form-label">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  className="form-input form-textarea"
                  placeholder="Your message here..."
                ></textarea>
              </div>

              <div className="submit-btn-container">
                <button type="submit" className="submit-btn">
                  Send
                </button>
                {errorMessage && <p className="error-msg">{errorMessage}</p>}
              </div>
            </form>
          ) : (
            <div className="glass-box success-container">
              <div className="success-icon-circle">
                <svg
                  className="success-icon-svg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="success-title">Feedback Received!</h3>
              <p className="success-text">
                We have received your feedback. Thank you for reaching out to
                us. We will get back to you as soon as possible.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
