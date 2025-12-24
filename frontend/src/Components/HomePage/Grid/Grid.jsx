import React from "react";
import Card from "../Cards/Card";
import "./Grid.css";
import {Link} from "react-router-dom";

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