import React from "react";
import Card from "../Cards/Card";
import "./Grid.css";

export default function Grid(props) {
  return (
    <div className="project-grid">
      {props.posts.map(post => (
        <Card post={post} key={post.id} />
      ))}
    </div>
  );
}