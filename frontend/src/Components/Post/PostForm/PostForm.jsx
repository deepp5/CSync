import React, { useState } from "react";
import "./PostForm.css";

export default function PostForm({ mode = "create", initialData = {}, createPost}) {
  const [title, setTitle] = useState(initialData.title || "");
  const [header, setHeader] = useState(initialData.header || "");
  const [techStack, setTech] = useState(initialData.tech || "");
  const [description, setDescription] = useState(initialData.description || "");

  const [category, setCategory] = useState(initialData.category || "WEB_DEVELOPMENT");
  const [difficulty, setDifficulty] = useState(initialData.difficulty || "BEGINNER");
  const [deadline, setDeadline] = useState(initialData.deadline || "");
  const [visibility, setVisibility] = useState(initialData.visibility || "DRAFT");

  // Update form when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData.title) setTitle(initialData.title);
    if (initialData.header) setHeader(initialData.header);
    if (initialData.tech) setTech(initialData.tech);
    if (initialData.description) setDescription(initialData.description);
    if (initialData.category) setCategory(initialData.category);
    if (initialData.difficulty) setDifficulty(initialData.difficulty);
    if (initialData.deadline) setDeadline(initialData.deadline);
    if (initialData.visibility) setVisibility(initialData.visibility);
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      title,
      header,
      techStack: techStack.split(",").map(t => t.trim()),
      description,
      category,
      difficulty,
      deadline,
      visibility,
    };

    const success = await createPost(data);

    if (success && mode === "create") {
      // Only reset form if we're creating a new post
      setTitle("");
      setHeader("");
      setTech("");
      setDescription("");
      setCategory("WEB_DEVELOPMENT");
      setDifficulty("BEGINNER");
      setDeadline("");
      setVisibility("DRAFT");
    }
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
              value={techStack}
              onChange={(e) => setTech(e.target.value)}
              placeholder="React, Node.js, SQL, Firebase, etc..."
            />
          </div>

          {/* <div className="form-section">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the idea, your goals, and what you're looking for..."
            />
          </div> */}
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-col">
          <div className="form-section">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="WEB_DEVELOPMENT">Web Development</option>
              <option value="MOBILE">Mobile App</option>
              <option value="AI_ML">AI / Machine Learning</option>
              <option value="GAME_DEV">Game Development</option>
              <option value="SYSTEMS">Systems / Backend</option>
              <option value="OTHER">Other</option>
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
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

      </div>

      <div className="form-section full-width">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain the idea, your goals, and what you're looking for..."
        />
      </div>

      <button type="submit" className="submit-btn">
        {mode === "create" ? "Create Post" : "Update Post"}
      </button>

    </form>
  );
}