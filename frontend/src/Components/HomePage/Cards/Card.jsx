import React from "react";
import "./Card.css";

export default function Card(props) {
  const getDifficultyClass = (difficulty) => {
    switch(difficulty) {
      case 'BEGINNER': return 'difficulty-easy';
      case 'INTERMEDIATE': return 'difficulty-medium';
      case 'ADVANCED': return 'difficulty-hard';
      default: return 'difficulty-medium';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch(difficulty) {
      case 'BEGINNER': return 'Easy';
      case 'INTERMEDIATE': return 'Medium';
      case 'ADVANCED': return 'Hard';
      default: return 'Medium';
    }
  };

  return (
        <div className="project-card">
            <div className = "cardTop">
                <h3>{props.post.title}</h3>
                <p className="desc">{props.post.header}</p>
                
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
            </div>

            <div className = "cardBottom">
                <span className={`difficulty-badge ${getDifficultyClass(props.post.difficulty)}`}>
                  {getDifficultyLabel(props.post.difficulty)}
                </span>
                <p className="ownerName">Jay</p>
            </div>
        </div>
    );
}