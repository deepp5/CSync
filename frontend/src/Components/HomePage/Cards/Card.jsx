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
                <div className="card-skills">
                  {(props.post.techStack || []).slice(0, 3).map((skill, index) => (
                    <span key={index} className="skill-badge">{skill}</span>
                  ))}
                  {props.post.techStack && props.post.techStack.length > 3 && (
                    <span className="skill-badge more">
                      +{props.post.techStack.length - 3}
                    </span>
                  )}
                </div>
                <p className="ownerName">Jay</p>
            </div>
        </div>
    );
}