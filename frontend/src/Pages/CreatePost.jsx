import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../supabaseClient";
import Sidebar from "../Components/Sidebar/Sidebar";
import PostForm from "../Components/Post/PostForm/PostForm";
import "../Components/Post/CreatePost.css";

export default function CreatePost() {
  const { id } = useParams(); // if present → edit mode
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState(null);
  const isEditMode = Boolean(id);

  useEffect(() => {
    if (!isEditMode) return;

    async function fetchPost() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;

      const res = await axios.get(`http://localhost:5051/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInitialData(res.data);
    }

    fetchPost();
  }, [id, isEditMode]);

  async function createPost(data) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const token = session.access_token;

    await axios.post("http://localhost:5051/posts", data, {
      headers: { Authorization: `Bearer ${token}` }
    });

    //navigate("/my-projects"); MAYBE HERE? IDK?
    return true;
  }

  async function updatePost(data) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const token = session.access_token;

    await axios.put(`http://localhost:5051/posts/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });

    navigate("/my-projects");
    return true;
  }

  return (
    <div className="createpost-container">
      <Sidebar />
      <div className="createpost-content">
        <h1 className="createpost-title">
          {isEditMode ? "Edit Project" : "Create New Post"}
        </h1>

        <div className="createpost-form-wrapper">
          <PostForm
            mode={isEditMode ? "edit" : "create"}
            initialData={initialData || {}}
            createPost={createPost}
            updatePost={updatePost}
          />
        </div>
      </div>
    </div>
  );
}