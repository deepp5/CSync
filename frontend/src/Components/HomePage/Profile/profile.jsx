import React, { useState } from "react";
import Sidebar from "../../Sidebar/Sidebar";
import "./Profile.css";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  // Simple local state – later you can hook this up to your backend
  const [bio, setBio] = useState(
    "CS student who loves backend systems, React, and learning Rust. Always excited to collaborate on innovative projects and learn new technologies."
  );

  const [currentSkills, setCurrentSkills] = useState([
    "React",
    "Node",
    "Postgres",
    "Lua",
  ]);
  const [learningSkills, setLearningSkills] = useState(["Rust", "Go"]);

  const [socials, setSocials] = useState({
    github: "https://github.com/jaydev",
    linkedin: "https://www.linkedin.com/in/jaydev",
    discord: "jaydev#1234",
    website: "https://jaydev.dev",
  });

  // In a real app you’d check logged-in user vs profile user
  const isOwner = true;

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev);
    // here you could call an API when turning editing off
  };

  const handleSkillsChange = (type, value) => {
    const list = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (type === "current") setCurrentSkills(list);
    else setLearningSkills(list);
  };

  const handleSocialChange = (field, value) => {
    setSocials((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="profile-container">
      <Sidebar />

      <main className="profile-content">
        {/* Header Section */}
        <section className="profile-header">
          <div className="header-left">
            <div className="avatar-wrapper">
              <div className="avatar">JD</div>
            </div>
            <div className="profile-info">
              <h1 className="display-name">Jay Developer</h1>
              <p className="username">@jaydev</p>
              <p className="affiliation">University of Illinois • CS Major</p>
            </div>
          </div>

          {isOwner && (
            <button className="edit-profile-btn" onClick={handleToggleEdit}>
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>
          )}
        </section>

        {/* Bio & Skills Section */}
        <section className="profile-section bio-skills-section">
          {/* Bio */}
          <div className="bio-block">
            <h2 className="section-title">About</h2>
            {isEditing ? (
              <textarea
                className="profile-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            ) : (
              <p className="bio-text">{bio}</p>
            )}
          </div>

          {/* Skills */}
          <div className="skills-block">
            <h2 className="section-title">Skills</h2>

            <div className="skills-group">
              <span className="skill-label">Current:</span>
              {isEditing ? (
                <input
                  className="profile-input"
                  placeholder="Comma-separated (e.g. React, Node, Postgres)"
                  value={currentSkills.join(", ")}
                  onChange={(e) =>
                    handleSkillsChange("current", e.target.value)
                  }
                />
              ) : (
                <div className="skill-tags">
                  {currentSkills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="skills-group">
              <span className="skill-label">Learning:</span>
              {isEditing ? (
                <input
                  className="profile-input"
                  placeholder="Comma-separated (e.g. Rust, Go)"
                  value={learningSkills.join(", ")}
                  onChange={(e) =>
                    handleSkillsChange("learning", e.target.value)
                  }
                />
              ) : (
                <div className="skill-tags">
                  {learningSkills.map((skill) => (
                    <span key={skill} className="skill-tag learning-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Links Section */}
        <section className="profile-section links-section">
          <h2 className="section-title">Links & Contact</h2>

          <div className="links-grid">
            {/* GitHub */}
            <div className="link-row">
              <div className="link-label">
                <span className="social-chip">GitHub</span>
              </div>
              {isEditing ? (
                <input
                  className="profile-input"
                  value={socials.github}
                  onChange={(e) => handleSocialChange("github", e.target.value)}
                  placeholder="GitHub URL"
                />
              ) : (
                socials.github && (
                  <a
                    href={socials.github}
                    className="social-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>View GitHub</span>
                  </a>
                )
              )}
            </div>

            {/* LinkedIn */}
            <div className="link-row">
              <div className="link-label">
                <span className="social-chip">LinkedIn</span>
              </div>
              {isEditing ? (
                <input
                  className="profile-input"
                  value={socials.linkedin}
                  onChange={(e) =>
                    handleSocialChange("linkedin", e.target.value)
                  }
                  placeholder="LinkedIn URL"
                />
              ) : (
                socials.linkedin && (
                  <a
                    href={socials.linkedin}
                    className="social-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>View LinkedIn</span>
                  </a>
                )
              )}
            </div>

            {/* Discord */}
            <div className="link-row">
              <div className="link-label">
                <span className="social-chip">Discord</span>
              </div>
              {isEditing ? (
                <input
                  className="profile-input"
                  value={socials.discord}
                  onChange={(e) =>
                    handleSocialChange("discord", e.target.value)
                  }
                  placeholder="Discord handle (e.g. jaydev#1234)"
                />
              ) : (
                socials.discord && (
                  <div className="social-text">{socials.discord}</div>
                )
              )}
            </div>

            {/* Website */}
            <div className="link-row">
              <div className="link-label">
                <span className="social-chip">Website</span>
              </div>
              {isEditing ? (
                <input
                  className="profile-input"
                  value={socials.website}
                  onChange={(e) =>
                    handleSocialChange("website", e.target.value)
                  }
                  placeholder="Personal website URL"
                />
              ) : (
                socials.website && (
                  <a
                    href={socials.website}
                    className="social-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>Visit Website</span>
                  </a>
                )
              )}
            </div>
          </div>
        </section>

        {/* Settings Section */}
        <section className="profile-section settings-section">
          <h2 className="section-title">Settings</h2>

          <div className="settings-group">
            <h3 className="settings-subtitle">Account Settings</h3>
            <button className="settings-option">
              <span>Edit Profile Info</span>
              <span className="chevron">›</span>
            </button>
            <button className="settings-option">
              <span>Edit Social Links</span>
              <span className="chevron">›</span>
            </button>
            <button className="settings-option">
              <span>Change Avatar</span>
              <span className="chevron">›</span>
            </button>
          </div>

          <div className="settings-group">
            <h3 className="settings-subtitle">Privacy Settings</h3>
            <div className="settings-option locked">
              <div>
                <span>Project Visibility</span>
                <span className="visibility-badge">PUBLIC</span>
              </div>
              <div className="locked-indicator">
                <span className="lock-icon">🔒</span>
                <span className="locked-text">Cannot be changed</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}