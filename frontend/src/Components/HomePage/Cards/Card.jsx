import React from "react";
import "./Card.css";

export default function Card() {
  return (
        <div className="project-card">
            <h3>Project Title</h3>
            <p className="desc">Sample description for this project. Brief and clean.</p>
            <p className="skills">Skills: React, Node, SQL</p>
        </div>
    );
}