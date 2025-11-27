import React from "react";
import Sidebar from "../Components/Sidebar/Sidebar";
import PostForm from "../Components/Post/PostForm/PostForm";
import "../Components/Post/CreatePost.css";

export default function CreatePost() {
  return (
    <div className="createpost-container">
        <Sidebar />

        <div className="createpost-content">
            <h1 className="createpost-title">Create New Post</h1>
            <div className="createpost-form-wrapper">
                <PostForm />
            </div>
        </div>

    </div>
  );
}