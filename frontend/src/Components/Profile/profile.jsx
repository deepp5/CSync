// ProfilePage.jsx
import React, { useState } from 'react';
import './Profile.css';
import { FiEdit2, FiGithub, FiLinkedin, FiMail } from 'react-icons/fi';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    profileName: 'Profile Name',
    username: 'Username',
    schoolCompany: 'School/Company',
    github: 'https://github.com/username',
    linkedin: 'https://linkedin.com/in/username',
    email: 'user@example.com',
    bio: 'This is where a short concise bio of the user will be',
    skills: ['React', 'Node.js', 'SQL', 'JavaScript', 'Python'],
    followers: 10,
    following: 10
  });

  const [projects, setProjects] = useState([
    {
      id: 1,
      title: 'Project Title',
      description: 'Sample description for this project. Brief and clean.',
      skills: ['React', 'Node', 'SQL'],
      author: 'Jay'
    },
    {
      id: 2,
      title: 'Project Title',
      description: 'Sample description for this project. Brief and clean.',
      skills: ['React', 'Node', 'SQL'],
      author: 'Jay'
    }
  ]);

  const [editForm, setEditForm] = useState({ ...profileData });
  const [skillsInput, setSkillsInput] = useState('');

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      setProfileData(editForm);
    } else {
      // Start editing
      setEditForm({ ...profileData });
      setSkillsInput(profileData.skills.join(', '));
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillsInputChange = (e) => {
    const value = e.target.value;
    setSkillsInput(value);
    
    // Only update skills array when comma is typed (but keep comma in input)
    const skills = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setEditForm(prev => ({
      ...prev,
      skills: skills
    }));
  };

  const handleCancelEdit = () => {
    setEditForm({ ...profileData });
    setSkillsInput(profileData.skills.join(', '));
    setIsEditing(false);
  };

  // Extract display names from URLs
  const getDisplayName = (url, type) => {
    if (!url) return type;
    
    try {
      if (type === 'GitHub') {
        const match = url.match(/github\.com\/([^\/]+)/);
        return match ? match[1] : 'GitHub';
      } else if (type === 'LinkedIn') {
        const match = url.match(/linkedin\.com\/in\/([^\/]+)/);
        return match ? match[1] : 'LinkedIn';
      } else if (type === 'Email') {
        return url.includes('@') ? url : 'Email';
      }
    } catch (e) {
      return type;
    }
    return url;
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header Section */}
        <div className="profile-header">
          <div className="profile-header-left">
            <div className="profile-picture-container">
              <div className="profile-picture">
                <span className="profile-initial">
                  {profileData.profileName.charAt(0)}
                </span>
              </div>
              {isEditing && (
                <button className="edit-picture-btn">
                  <FiEdit2 />
                </button>
              )}
            </div>

            <div className="profile-info">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className="edit-input profile-name-input"
                    value={editForm.profileName}
                    onChange={(e) => handleInputChange('profileName', e.target.value)}
                    placeholder="Profile Name"
                  />
                  <input
                    type="text"
                    className="edit-input username-input"
                    value={editForm.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Username"
                  />
                  <input
                    type="text"
                    className="edit-input school-input"
                    value={editForm.schoolCompany}
                    onChange={(e) => handleInputChange('schoolCompany', e.target.value)}
                    placeholder="School/Company"
                  />
                </>
              ) : (
                <>
                  <h1 className="profile-name">{profileData.profileName}</h1>
                  <p className="username">{profileData.username}</p>
                  <p className="school-company">{profileData.schoolCompany}</p>
                </>
              )}
            </div>
          </div>

          <div className="profile-header-right">
            <div className="follow-stats">
              <div className="stat">
                <span className="stat-label">Followers:</span>
                <span className="stat-value">{profileData.followers}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Following:</span>
                <span className="stat-value">{profileData.following}</span>
              </div>
            </div>

            <div className="edit-profile-btn-container">
              {isEditing ? (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleEditToggle}>
                    Save
                  </button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="edit-profile-btn" onClick={handleEditToggle}>
                  <FiEdit2 /> Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Below Line - Centered */}
        <div className="profile-content-centered">
          {/* Social Links */}
          <div className="social-links">
            {isEditing ? (
              <>
                <div className="social-input-group">
                  <FiGithub className="social-icon" />
                  <input
                    type="text"
                    className="edit-input"
                    value={editForm.github}
                    onChange={(e) => handleInputChange('github', e.target.value)}
                    placeholder="GitHub URL"
                  />
                </div>
                <div className="social-input-group">
                  <FiLinkedin className="social-icon" />
                  <input
                    type="text"
                    className="edit-input"
                    value={editForm.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    placeholder="LinkedIn URL"
                  />
                </div>
                <div className="social-input-group">
                  <FiMail className="social-icon" />
                  <input
                    type="text"
                    className="edit-input"
                    value={editForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Email address"
                  />
                </div>
              </>
            ) : (
              <>
                <a 
                  href={profileData.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <FiGithub className="social-icon" />
                  <span>{getDisplayName(profileData.github, 'GitHub')}</span>
                </a>
                <a 
                  href={profileData.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <FiLinkedin className="social-icon" />
                  <span>{getDisplayName(profileData.linkedin, 'LinkedIn')}</span>
                </a>
                <a 
                  href={`mailto:${profileData.email}`}
                  className="social-link"
                >
                  <FiMail className="social-icon" />
                  <span>{getDisplayName(profileData.email, 'Email')}</span>
                </a>
              </>
            )}
          </div>

          {/* Bio Section */}
          <div className="bio-section">
            <h3 className="section-title">Bio</h3>
            {isEditing ? (
              <textarea
                className="edit-textarea"
                value={editForm.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Write a short bio about yourself..."
                rows="3"
              />
            ) : (
              <p className="bio-text">{profileData.bio}</p>
            )}
          </div>

          {/* Skills Section */}
          <div className="skills-section">
            <h3 className="section-title">Skills</h3>
            {isEditing ? (
              <div className="skills-edit">
                <input
                  type="text"
                  className="edit-input"
                  value={skillsInput}
                  onChange={handleSkillsInputChange}
                  placeholder="Enter skills separated by commas"
                />
                <p className="helper-text">Separate skills with commas</p>
              </div>
            ) : (
              <div className="skills-list">
                {profileData.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="projects-section">
            <h3 className="section-title">Projects</h3>
            <div className="projects-grid">
              {projects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <h4 className="project-title">{project.title}</h4>
                  </div>
                  <p className="project-description">{project.description}</p>
                  <div className="project-footer">
                    <div className="project-skills">
                      <span className="skills-label">Skills:</span>
                      <span className="skills-text">{project.skills.join(', ')}</span>
                    </div>
                    <span className="project-author">{project.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;