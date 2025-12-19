import React from "react";
import "./Card.css";

export default function Card(props) {
  return (
        <div className="project-card">
            <div className = "cardTop">
                <h3>{props.post.title}</h3>
                <p className="desc">{props.post.header}</p>
            </div>
            <div className = "cardBottom">
                <p className="skills">{props.post.techStack.join(", ")}</p>
                <p className="ownerName">Jay</p>
            </div>
        </div>
    );
}