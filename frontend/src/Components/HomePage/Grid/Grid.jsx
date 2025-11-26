import React from "react";
import Card from "../Cards/Card";
import "./Grid.css";

export default function Grid() {
  return (
    <div className="project-grid">
      {Array(15).fill(0).map((_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}