// MyProjectsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { supabase } from "../../supabaseClient";
import './MyProject.css';
import { 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiEyeOff,
  FiMoreVertical,
  FiPlus,
  FiSearch,
  FiFilter,
  FiCopy,
  FiShare2
} from 'react-icons/fi';

export default function MyProjects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, public, private, draft
  const [selectedProject, setSelectedProject] = useState(null);
  const [showMenu, setShowMenu] = useState(null);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyProjects() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;

      const res = await axios.get("http://localhost:5051/posts/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects(res.data);
      setLoading(false);
    }

    fetchMyProjects();
  }, []);

  // Filter and search projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Removed handleViewProject function

  const handleEditProject = (projectId) => {
    navigate(`/edit-project/${projectId}`);
    setShowMenu(null);
  };

  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone."
    );
    if (!confirmed) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const token = session.access_token;

    await axios.delete(`http://localhost:5051/posts/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setProjects(projects.filter(p => p.id !== projectId));
    setShowMenu(null);
  };

  const handleShareProject = (projectId) => {
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({
        title: 'Check out my project!',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
    setShowMenu(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      public: { label: 'Public', class: 'status-public' },
      private: { label: 'Private', class: 'status-private' },
      draft: { label: 'Draft', class: 'status-draft' }
    };
    return badges[status] || badges.draft;
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="my-projects-page">
        <div className="my-projects-container">
          {/* Optional: replace with skeleton later */}
        </div>
      </div>
    );
  }
  return (
    <div className="my-projects-page">
      <div className="my-projects-container">
        {/* Header */}
        <div className="projects-page-header">
          <div className="header-left">
            <h1 className="page-title">My Projects</h1>
          </div>
          <button className="create-project-btn" onClick={() => navigate('/create-project')}>
            <FiPlus /> New Project
          </button>
        </div>

        {/* Filters and Search */}
        <div className="projects-controls">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button 
              className={`filter-tab ${filterStatus === 'public' ? 'active' : ''}`}
              onClick={() => setFilterStatus('public')}
            >
              Public
            </button>
            <button 
              className={`filter-tab ${filterStatus === 'private' ? 'active' : ''}`}
              onClick={() => setFilterStatus('private')}
            >
              Private
            </button>
            <button 
              className={`filter-tab ${filterStatus === 'draft' ? 'active' : ''}`}
              onClick={() => setFilterStatus('draft')}
            >
              Drafts
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="no-projects">
            <div className="no-projects-icon">📁</div>
            <h3>No projects found</h3>
            <p>
              {searchQuery 
                ? "Try adjusting your search or filters" 
                : "Start by creating your first project"}
            </p>
            {!searchQuery && (
              <button className="create-first-btn" onClick={() => navigate('/create-project')}>
                <FiPlus /> Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {filteredProjects.map((project) => {
              const statusBadge = getStatusBadge(project.status);
              
              return (
                <div
                  key={project.id}
                  className="project-card-manage"
                >
                  {/* Card Header */}
                  <div className="card-header-manage">
                    <span className={`status-badge ${statusBadge.class}`}>
                      {project.status === 'public' ? <FiEye /> : <FiEyeOff />}
                      {statusBadge.label}
                    </span>
                    <div className="card-menu-container">
                      <button 
                        className="card-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(showMenu === project.id ? null : project.id);
                        }}
                      >
                        <FiMoreVertical />
                      </button>
                      
                      {showMenu === project.id && (
                        <div className="card-menu-dropdown">
                          <button 
                            className="menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project.id);
                            }}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button 
                            className="menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareProject(project.id);
                            }}
                          >
                            <FiShare2 /> Share
                          </button>
                          <div className="menu-divider"></div>
                          <button 
                            className="menu-item danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div 
                    className="card-content-manage"
                  >
                    <h3 className="card-title-manage">{project.title}</h3>
                    <p className="card-description-manage">{project.description}</p>
                    
                    <div className="card-skills-manage">
                      {(project.techStack || []).slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-badge">{skill}</span>
                      ))}
                      {project.techStack && project.techStack.length > 3 && (
                        <span className="skill-badge more">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="card-footer-manage">
                    <span className="update-time">
                      Updated {getTimeAgo(project.updatedAt)}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
