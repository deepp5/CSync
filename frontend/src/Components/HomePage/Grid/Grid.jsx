import React from "react";
import {Link} from "react-router-dom";
import Card from "../Cards/Card";
import "./Grid.css";

export default function Grid(props) {
  return (
    <div className="project-grid">
      {props.posts.map(post => (
        <Link key={post.id} to={`/post/${post.id}`} className="card-link">
          <Card post={post}  />
        </Link>
        
      ))}
    </div>
  );
}