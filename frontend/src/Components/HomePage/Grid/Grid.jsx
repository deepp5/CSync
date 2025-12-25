import React from "react";
import Card from "../Cards/Card";
import "./Grid.css";

export default function Grid({ posts = [] }) {
  if (posts.length === 0) {
    return (
      <div className="no-results">
        <h3>No projects found</h3>
        <p>Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="projects-grid">
      {posts.map((post) => (
        <Card key={post.id} post={post} />
      ))}
    </div>
  );
}
