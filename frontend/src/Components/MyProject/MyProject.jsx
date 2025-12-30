// MyProjectsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import { prefetchCache } from "../../utils/prefetchCache";
import "./MyProject.css";
import {
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiMoreVertical,
  FiPlus,
  FiSearch,
  FiShare2,
  FiLock,
} from "react-icons/fi";

// ✅ SINGLE API BASE (dev + prod safe)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5051";

export default function MyProjects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showMenu, setShowMenu] = useState(null);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyProjects() {
      try {
        const cachedData = prefetchCache.get("myProjects");
        if (cachedData) {
          setProjects(cachedData);
          setLoading(false);
          fetchFreshData();
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const token = session.access_token;

        const res = await axios.get(`${API_BASE}/posts/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProjects(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
        setLoading(false);
      }
    }

    async function fetchFreshData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const token = session.access_token;

        const res = await axios.get(`${API_BASE}/posts/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProjects(res.data);
        prefetchCache.set("myProjects", res.data);
      } catch (error) {
        console.error("Error fetching fresh projects:", error);
      }
    }

    fetchMyProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const title = (project.title || "").toLowerCase();
    const desc = (project.description || "").toLowerCase();

    const matchesSearch =
      title.includes(searchQuery.toLowerCase()) ||
      desc.includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      project.visibility === filterStatus.toUpperCase();

    return matchesSearch && matchesFilter;
  });

  const handleEditProject = (projectId) => {
    navigate(`/edit-project/${projectId}`);
    setShowMenu(null);
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Delete this project permanently?")) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;

      await axios.delete(`${API_BASE}/posts/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updated = projects.filter((p) => p.id !== projectId);
      setProjects(updated);
      prefetchCache.set("myProjects", updated);
      setShowMenu(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project.");
    }
  };

  const handleChangeStatus = async (projectId, newVisibility) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const optimistic = projects.map((p) =>
      p.id === projectId ? { ...p, visibility: newVisibility } : p
    );
    setProjects(optimistic);
    prefetchCache.set("myProjects", optimistic);
    setShowMenu(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;

      await axios.put(
        `${API_BASE}/posts/${projectId}`,
        {
          ...project,
          visibility: newVisibility,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch {
      setProjects(projects);
      prefetchCache.set("myProjects", projects);
      alert("Failed to update visibility.");
    }
  };

  const handleShareProject = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    alert("Link copied!");
    setShowMenu(null);
  };

  const getStatusIcon = (v) => {
    if (v === "PUBLIC") return <FiEye />;
    if (v === "PRIVATE") return <FiLock />;
    return <FiEyeOff />;
  };

  return (
    <div className="my-projects-page">
      <div className="my-projects-container">
        <div className="projects-page-header">
          <h1>My Projects</h1>
          <button onClick={() => navigate("/createpost")}>
            <FiPlus /> New Project
          </button>
        </div>

        <div className="projects-controls">
          <FiSearch />
          <input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? null : (
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <div key={project.id} className="project-card-manage">
                <div className="card-header-manage">
                  <span>{getStatusIcon(project.visibility)}</span>

                  <button
                    onClick={() =>
                      setShowMenu(showMenu === project.id ? null : project.id)
                    }
                  >
                    <FiMoreVertical />
                  </button>

                  {showMenu === project.id && (
                    <div className="card-menu-dropdown">
                      <button onClick={() => handleEditProject(project.id)}>
                        <FiEdit2 /> Edit
                      </button>
                      <button onClick={() => handleShareProject(project.id)}>
                        <FiShare2 /> Share
                      </button>
                      <button onClick={() => handleDeleteProject(project.id)}>
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
