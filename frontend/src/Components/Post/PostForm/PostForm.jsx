import React, { useState } from "react";
import "./PostForm.css";

export default function PostForm({ mode = "create", initialData = {} }) {
  const [title, setTitle] = useState(initialData.title || "");
  const [header, setHeader] = useState(initialData.header || "");
  const [tech, setTech] = useState(initialData.tech || "");
  const [description, setDescription] = useState(initialData.description || "");

  const [category, setCategory] = useState(initialData.category || "Web Development");
  const [deadline, setDeadline] = useState(initialData.deadline || "");
  const [difficulty, setDifficulty] = useState(initialData.difficulty || "Beginner");
  const [lookingFor, setLookingFor] = useState(initialData.lookingFor || "");

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      title,
      header,
      tech,
      description,
      category,
      deadline,
      difficulty,
      lookingFor,
    };

    console.log("SUBMIT:", formData);
  };

  return (
    <form className="postform" onSubmit={handleSubmit}>
      
      <div className="form-columns">

        {/* LEFT COLUMN */}
        <div className="left-col">
          <div className="form-section">
            <label>Project Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short and descriptive project name..."
            />
          </div>

          <div className="form-section">
            <label>Header / Summary</label>
            <input
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              placeholder="One-sentence summary of the project..."
            />
          </div>

          <div className="form-section">
            <label>Tech Stack</label>
            <input
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              placeholder="React, Node.js, SQL, Firebase, etc..."
            />
          </div>

          <div className="form-section">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the idea, your goals, and what you're looking for..."
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-col">
          <div className="form-section">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Web Development</option>
              <option>Mobile App</option>
              <option>Machine Learning</option>
              <option>AI / LLM</option>
              <option>Game Development</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-section">
            <label>Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div className="form-section">
            <label>Looking For</label>
            <input
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="Ex: 2 developers, UI/UX designer, ML engineer..."
            />
          </div>
        </div>

      </div>

      <button type="submit" className="submit-btn">
        {mode === "create" ? "Create Post" : "Save Changes"}
      </button>

    </form>
  );
}