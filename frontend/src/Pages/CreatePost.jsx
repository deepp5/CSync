import React from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";
import Sidebar from "../Components/Sidebar/Sidebar";
import PostForm from "../Components/Post/PostForm/PostForm";
import "../Components/Post/CreatePost.css";

export default function CreatePost() {
  async function createPost(data){
    const {data: {session}} = await supabase.auth.getSession();
    if(!session) {return;}
    const token = session.access_token;

    const post = await axios.post("http://localhost:5051/posts", data, {
      headers: {Authorization: `Bearer ${token}`}
    });

    return true;
  }

  return (
    <div className="createpost-container">
        <Sidebar />
        <div className="createpost-content">
            <h1 className="createpost-title">Create New Post</h1>
            <div className="createpost-form-wrapper">
                <PostForm createPost={createPost}/>
            </div>
        </div>
    </div>
  );
}