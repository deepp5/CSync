// MyProjectsPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Mock projects data - replace with backend data
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: 'Real-Time Collaboration Platform',
      description: 'A comprehensive real-time collaboration tool with live editing, video conferencing, and project management features.',
      skills: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
      status: 'public',
      likes: 45,
      views: 320,
      comments: 12,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20'
    },
    {
      id: 2,
      title: 'E-Commerce Dashboard',
      description: 'Modern e-commerce admin dashboard with analytics, inventory management, and order tracking capabilities.',
      skills: ['React', 'TypeScript', 'PostgreSQL', 'Express'],
      status: 'public',
      likes: 32,
      views: 215,
      comments: 8,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18'
    },
    {
      id: 3,
      title: 'AI-Powered Task Manager',
      description: 'Smart task management app that uses AI to prioritize and suggest optimal task scheduling.',
      skills: ['Python', 'TensorFlow', 'React', 'FastAPI'],
      status: 'private',
      likes: 0,
      views: 0,
      comments: 0,
      createdAt: '2024-01-05',
      updatedAt: '2024-01-22'
    },
    {
      id: 4,
      title: 'Social Media Analytics Tool',
      description: 'Track and analyze social media performance across multiple platforms with detailed insights.',
      skills: ['Vue.js', 'Python', 'Redis', 'Chart.js'],
      status: 'draft',
      likes: 0,
      views: 0,
      comments: 0,
      createdAt: '2024-01-25',
      updatedAt: '2024-01-25'
    }
  ]);

  // Filter and search projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewProject = (projectId) => {
    navigate(`/post/${projectId}`);
  };

  const handleEditProject = (projectId) => {
    navigate(`/edit-project/${projectId}`);
    setShowMenu(null);
  };

  const handleDeleteProject = (projectId) => {
    const confirmed = window.confirm('Are you sure you want to delete this project? This action cannot be undone.');
    
    if (confirmed) {
      setProjects(projects.filter(p => p.id !== projectId));
      setShowMenu(null);
    }
  };

  const handleToggleVisibility = (projectId) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          status: p.status === 'public' ? 'private' : 'public'
        };
      }
      return p;
    }));
    setShowMenu(null);
  };

  const handleDuplicateProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const newProject = {
        ...project,
        id: Date.now(),
        title: `${project.title} (Copy)`,
        status: 'draft',
        likes: 0,
        views: 0,
        comments: 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setProjects([newProject, ...projects]);
      setShowMenu(null);
    }
  };

  const handleShareProject = (projectId) => {
    const url = `${window.location.origin}/post/${projectId}`;
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

  return (
    <div className="my-projects-page">
      <div className="my-projects-container">
        
        {/* Header */}
        <div className="projects-page-header">
          <div className="header-left">
            <h1 className="page-title">My Projects</h1>
            <p className="page-subtitle">
              Manage and organize your projects ({filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'})
            </p>
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
                <div key={project.id} className="project-card-manage">
                  {/* Card Header */}
                  <div className="card-header-manage">
                    <span className={`status-badge ${statusBadge.class}`}>
                      {project.status === 'public' ? <FiEye /> : <FiEyeOff />}
                      {statusBadge.label}
                    </span>
                    <div className="card-menu-container">
                      <button 
                        className="card-menu-btn"
                        onClick={() => setShowMenu(showMenu === project.id ? null : project.id)}
                      >
                        <FiMoreVertical />
                      </button>
                      
                      {showMenu === project.id && (
                        <div className="card-menu-dropdown">
                          <button 
                            className="menu-item"
                            onClick={() => handleViewProject(project.id)}
                          >
                            <FiEye /> View
                          </button>
                          <button 
                            className="menu-item"
                            onClick={() => handleEditProject(project.id)}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button 
                            className="menu-item"
                            onClick={() => handleToggleVisibility(project.id)}
                          >
                            {project.status === 'public' ? <FiEyeOff /> : <FiEye />}
                            Make {project.status === 'public' ? 'Private' : 'Public'}
                          </button>
                          <button 
                            className="menu-item"
                            onClick={() => handleDuplicateProject(project.id)}
                          >
                            <FiCopy /> Duplicate
                          </button>
                          <button 
                            className="menu-item"
                            onClick={() => handleShareProject(project.id)}
                          >
                            <FiShare2 /> Share
                          </button>
                          <div className="menu-divider"></div>
                          <button 
                            className="menu-item danger"
                            onClick={() => handleDeleteProject(project.id)}
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
                    onClick={() => handleViewProject(project.id)}
                  >
                    <h3 className="card-title-manage">{project.title}</h3>
                    <p className="card-description-manage">{project.description}</p>
                    
                    <div className="card-skills-manage">
                      {project.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-badge">{skill}</span>
                      ))}
                      {project.skills.length > 3 && (
                        <span className="skill-badge more">+{project.skills.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="card-footer-manage">
                    <div className="card-stats">
                      {project.status === 'public' && (
                        <>
                          <span className="stat">❤️ {project.likes}</span>
                          <span className="stat">👁️ {project.views}</span>
                          <span className="stat">💬 {project.comments}</span>
                        </>
                      )}
                      {project.status !== 'public' && (
                        <span className="stat-muted">Not published</span>
                      )}
                    </div>
                    <span className="update-time">
                      Updated {getTimeAgo(project.updatedAt)}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="card-actions">
                    <button 
                      className="action-btn-quick"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProject(project.id);
                      }}
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button 
                      className="action-btn-quick"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProject(project.id);
                      }}
                    >
                      <FiEye /> View
                    </button>
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
