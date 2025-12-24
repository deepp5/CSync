import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../supabaseClient";
import Sidebar from "../Components/Sidebar/Sidebar";
import PostForm from "../Components/Post/PostForm/PostForm";
import "../Components/Post/CreatePost.css";

export default function CreatePost() {
  const { id } = useParams(); // If ID exists, we're in edit mode
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      fetchPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchPost() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const token = session.access_token;
      const response = await axios.get(`http://localhost:5051/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const post = response.data;
      
      // Format the data for the form
      setInitialData({
        title: post.title,
        header: post.header,
        tech: post.techStack.join(", "),
        description: post.description,
        category: post.category,
        difficulty: post.difficulty,
        deadline: post.deadline ? post.deadline.split('T')[0] : "",
        visibility: post.visibility,
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching post:", error);
      alert("Failed to load post. Please try again.");
      navigate("/myproject");
    }
  }

  async function createPost(data) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return false;
      }
      
      const token = session.access_token;

      await axios.post("http://localhost:5051/posts", data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Post created successfully!");
      navigate("/myproject");
      return true;
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
      return false;
    }
  }

  async function updatePost(data) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return false;
      }
      
      const token = session.access_token;

      await axios.put(`http://localhost:5051/posts/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Post updated successfully!");
      navigate("/myproject");
      return true;
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post. Please try again.");
      return false;
    }
  }

  // Don't render form in edit mode until data is loaded
  if (isEditMode && !initialData) {
    return (
      <div className="createpost-container">
        <Sidebar />
        <div className="createpost-content">
          <div className="createpost-content-wrapper">
            <h1 className="createpost-title">Edit Post</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="createpost-container">
      <Sidebar />
      <div className="createpost-content">
        <div className="createpost-content-wrapper">
          <h1 className="createpost-title">
            {isEditMode ? "Edit Post" : "Create New Post"}
          </h1>
          <div className="createpost-form-wrapper">
            <PostForm 
              mode={isEditMode ? "edit" : "create"}
              initialData={initialData || {}}
              createPost={isEditMode ? updatePost : createPost}
            />
          </div>
        </div>
      </div>
    </div>
  );
}