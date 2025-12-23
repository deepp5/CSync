import React from "react";
import "./Card.css";
import { useNavigate } from "react-router-dom";

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
      case 'BEGINNER': return 'Beginner';
      case 'INTERMEDIATE': return 'Intermediate';
      case 'ADVANCED': return 'Advanced';
      default: return 'Intermediate';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'WEB_DEVELOPMENT': 'Web Development',
      'MOBILE': 'Mobile App',
      'AI_ML': 'Machine Learning',
      'GAME_DEV': 'Game Development',
      'SYSTEMS': 'Systems',
      'OTHER': 'Other'
    };
    return labels[category] || category;
  };
  const navigate = useNavigate();
    const goToPost = () => {
        navigate(`/post/${props.post.id}`);
    };

    const handleKeyDown = (e) => {
        if(e.key === "Enter" || e.key === " "){
            goToPost();
        }
    };

  return (
        <div className="project-card" role="button" tabIndex={0} onClick={goToPost} onKeyDown={handleKeyDown}>
            <div className = "cardTop">
                <h3>{props.post.title}</h3>
                
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

                <p className="desc">{props.post.header}</p>
            </div>

            <div className = "cardBottom">
                <div className="card-bottom-left">
                  <span className="category-badge">
                    {getCategoryLabel(props.post.category)}
                  </span>
                  <span className={`difficulty-badge ${getDifficultyClass(props.post.difficulty)}`}>
                    {getDifficultyLabel(props.post.difficulty)}
                  </span>
                </div>
                <p className="ownerName">Jay</p>
            </div>
        </div>
    );
}